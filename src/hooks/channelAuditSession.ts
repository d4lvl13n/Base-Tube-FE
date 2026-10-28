import ctrApi from '../api/ctr';
import type { ChannelAuditResult } from '../types/ctr';

export type AuditSession = {
  accountId: string;
  requestKey: string;
  channel: string;
  goal?: string;
  startedAt: number;
  status: 'pending' | 'recovering' | 'completed' | 'failed' | 'unresolved';
  result?: ChannelAuditResult;
  error?: unknown;
};
export const AUDIT_RECOVERY_WINDOW_MS = 20 * 60_000;
const sessions = new Map<string, AuditSession>();
const listeners = new Map<string, Set<() => void>>();
const checksInFlight = new Set<string>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const prefix = 'bt.channelAudit.pending.v1:';
const emit = (account: string) => listeners.get(account)?.forEach(fn => fn());
function persist(entry: AuditSession) {
  try {
    if (entry.status === 'failed') sessionStorage.removeItem(prefix + entry.accountId);
    else sessionStorage.setItem(prefix + entry.accountId, JSON.stringify({accountId:entry.accountId,requestKey:entry.requestKey,channel:entry.channel,goal:entry.goal,startedAt:entry.startedAt}));
  } catch { /* In-memory navigation still works without storage. */ }
}
export function getAuditSession(account: string): AuditSession | null { return sessions.get(account) || null; }
export function subscribeAuditSession(account: string, callback: () => void) {
  const set = listeners.get(account) || new Set();
  listeners.set(account, set); set.add(callback);
  return () => { set.delete(callback); };
}
function update(entry: AuditSession, patch: Partial<AuditSession>) {
  if (sessions.get(entry.accountId)?.requestKey !== entry.requestKey) return;
  const next = {...entry,...patch}; sessions.set(entry.accountId,next); persist(next); emit(entry.accountId);
}
/** Only GETs. A reload must never replay a paid POST, even with the same key. */
export async function checkAuditSession(account: string): Promise<void> {
  const entry = sessions.get(account);
  if (!listeners.get(account)?.size || !entry || entry.status === 'pending' || entry.status === 'completed' || entry.status === 'failed') return;
  if(checksInFlight.has(account)) return;
  checksInFlight.add(account);
  const timer = timers.get(account); if(timer) clearTimeout(timer); timers.delete(account);
  try {
    const status = await ctrApi.getChannelAuditRequestStatus(entry.requestKey);
    if (sessions.get(account)?.requestKey !== entry.requestKey) return;
    if(status.status === 'completed' && status.auditId) {
      const result = await ctrApi.getChannelAudit(status.auditId);
      update(entry,{status:'completed',result}); return;
    }
    update(entry,{status:'unresolved',error:undefined});
  } catch (error) { update(entry,{status:'unresolved',error}); } finally { checksInFlight.delete(account); }
  // Bounded polling; after that the user may explicitly perform another free check.
  if(Date.now() - entry.startedAt < AUDIT_RECOVERY_WINDOW_MS && sessions.get(account)?.requestKey === entry.requestKey && listeners.get(account)?.size) {
    timers.set(account,setTimeout(() => { void checkAuditSession(account); },45_000));
  }
}
export function restoreAuditSession(account: string): AuditSession | null {
  if (!account || account === 'anonymous') return null;
  if(sessions.has(account)) {
    const entry=sessions.get(account)!;
    if(entry.status === 'recovering' || entry.status === 'unresolved') void checkAuditSession(account);
    return entry;
  }
  try {
    const raw=JSON.parse(sessionStorage.getItem(prefix+account) || 'null');
    if(raw && raw.accountId === account && typeof raw.requestKey === 'string' && /^[\w-]{8,128}$/.test(raw.requestKey) && typeof raw.channel === 'string' && typeof raw.startedAt === 'number' && Number.isFinite(raw.startedAt) && raw.startedAt > 0 && (raw.goal === undefined || typeof raw.goal === 'string')) {
      const entry: AuditSession={...raw,status:'recovering'};
      sessions.set(account,entry); void checkAuditSession(account); return entry;
    }
  } catch { /* Ignore malformed/blocked storage; never submit a request. */ }
  return null;
}
export function startAuditSession(account: string, channel: string, goal?: string): AuditSession {
  const existing=sessions.get(account);
  if(existing && ['pending','recovering','unresolved'].includes(existing.status)) return existing;
  const requestKey=globalThis.crypto?.randomUUID?.() || `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const entry:AuditSession={accountId:account,requestKey,channel,goal,startedAt:Date.now(),status:'pending'};
  sessions.set(account,entry);persist(entry);emit(account);
  // This promise belongs to the account session, never to a mounted component.
  void ctrApi.auditChannel(channel,goal,requestKey).then(result=>update(entry,{status:'completed',result})).catch(error=>{
    const status=error?.response?.status;
    if(!status || status === 408 || status === 504) {
      update(entry,{status:'recovering',error}); void checkAuditSession(account);
    } else update(entry,{status:'failed',error});
  });
  return entry;
}
export function clearAuditSession(account: string) {
  const entry=sessions.get(account);
  if(entry && ['pending','recovering','unresolved'].includes(entry.status)) return;
  sessions.delete(account); try{sessionStorage.removeItem(prefix+account);}catch{} emit(account);
}

/** Explicitly stop reconciling an old, unknown request. Never abort an active POST. */
export function stopWaitingForAuditSession(account: string): boolean {
  const entry = sessions.get(account);
  if (!entry || !['recovering', 'unresolved'].includes(entry.status) || Date.now() - entry.startedAt < AUDIT_RECOVERY_WINDOW_MS) return false;
  const timer = timers.get(account);
  if (timer) clearTimeout(timer);
  timers.delete(account);
  sessions.delete(account);
  try { sessionStorage.removeItem(prefix + account); } catch { /* The in-memory owner is still cleared. */ }
  emit(account);
  return true;
}
