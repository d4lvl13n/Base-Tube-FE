/** Persist before the HTTP write: a lost response/reload must replay the same request. */
export function studioCreationKey(account: string, body: unknown): string {
  const storageKey = `studio-create-request:${account}`;
  const payload = JSON.stringify(body);
  const saved = sessionStorage.getItem(storageKey);
  if (saved) {
    const prior = JSON.parse(saved);
    if (prior.payload === payload && typeof prior.key === 'string') return prior.key;
  }
  const key = crypto.randomUUID();
  sessionStorage.setItem(storageKey, JSON.stringify({ key, payload }));
  return key;
}
export function clearStudioCreationKey(account: string) {
  sessionStorage.removeItem(`studio-create-request:${account}`);
}
