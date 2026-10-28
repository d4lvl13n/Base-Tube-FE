import React from 'react';
import {render,screen,fireEvent,act,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import ChannelAuditPage from '../ChannelAuditPage';
import ctrApi from '../../../../api/ctr';
import { stopWaitingForAuditSession } from '../../../../hooks/channelAuditSession';
let mockAccount='account-a';
jest.mock('@clerk/clerk-react',()=>({useUser:()=>({isLoaded:true,isSignedIn:true,user:{id:mockAccount}})}));
jest.mock('../../../../contexts/AuthContext',()=>({useAuth:()=>({isAuthenticated:false,isRestoring:false,user:null})}));
jest.mock('../../../../hooks/useCTREngine',()=>({__esModule:true,default:()=>({usageAccess:null,isLoadingQuota:false,refreshQuota:jest.fn(),isAnonymous:false})}));
jest.mock('../../../../api/ctr',()=>({__esModule:true,default:{auditChannel:jest.fn(),getChannelAuditRequestStatus:jest.fn(),getChannelAudit:jest.fn(),listChannelAudits:jest.fn()}}));
jest.mock('../AIThumbnailsLayout',()=>({__esModule:true,default:({children}:any)=><div>{children}</div>}));
jest.mock('../components/ChannelAuditReport',()=>({ChannelAuditReport:({audit,isRerunning}:any)=><div>Report {audit.id}{isRerunning ? ' (re-running)' : ''}</div>}));
jest.mock('../components/ChannelAuditProgress',()=>({__esModule:true,default:()=> <div>Preparing audit</div>}));
jest.mock('../components/AIThumbnailsSignInOptions',()=>({__esModule:true,default:()=>null}));
jest.mock('framer-motion',()=>{
 const React=require('react');
 return {AnimatePresence:({children}:any)=>children,motion:new Proxy({}, {get:(_:any,tag:string)=>React.forwardRef(({children,initial,animate,exit,transition,whileTap,whileHover,...props}:any,ref:any)=>React.createElement(tag,{...props,ref},children))})};
});
const deferred=()=>{let resolve!:(value:any)=>void;let reject!:(error:any)=>void;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const mount=()=>render(<MemoryRouter><ChannelAuditPage/></MemoryRouter>);
const submit=()=>{fireEvent.change(screen.getByPlaceholderText(/youtube.com\/@yourchannel/),{target:{value:'@Garter'}});fireEvent.click(screen.getByRole('button',{name:'Audit channel'}));};
beforeEach(()=>{jest.clearAllMocks();sessionStorage.clear();localStorage.clear();window.history.replaceState({},'', '/');mockAccount='account-'+Math.random();});
it('retains exactly one POST across unmount/remount and renders completion',async()=>{
 const request=deferred();(ctrApi.auditChannel as jest.Mock).mockReturnValue(request.promise);
 let view=mount();submit();expect(screen.getByText('Preparing audit')).toBeInTheDocument();view.unmount();
 view=mount();expect(screen.getByText('Preparing audit')).toBeInTheDocument();
 expect(ctrApi.auditChannel).toHaveBeenCalledTimes(1);
 await act(async()=>{request.resolve({schemaVersion:2,id:41});});
 expect(await screen.findByText('Report 41')).toBeInTheDocument();view.unmount();
});
it('shows a report completed while the page was absent',async()=>{
 const request=deferred();(ctrApi.auditChannel as jest.Mock).mockReturnValue(request.promise);
 const view=mount();submit();view.unmount();await act(async()=>{request.resolve({schemaVersion:2,id:42});});
 mount();expect(await screen.findByText('Report 42')).toBeInTheDocument();expect(ctrApi.auditChannel).toHaveBeenCalledTimes(1);
});
it('retains a failed state without automatically retrying',async()=>{
 const request=deferred();(ctrApi.auditChannel as jest.Mock).mockReturnValue(request.promise);
 const view=mount();submit();view.unmount();await act(async()=>{request.reject({response:{status:503,data:{error:{message:'Audit unavailable'}}}});});
 mount();expect(await screen.findByRole('alert')).toBeInTheDocument();expect(screen.queryByText('Preparing audit')).not.toBeInTheDocument();expect(ctrApi.auditChannel).toHaveBeenCalledTimes(1);
});
it('never exposes another account pending request or late result',async()=>{
 const request=deferred();(ctrApi.auditChannel as jest.Mock).mockReturnValue(request.promise);
 const view=mount();submit();mockAccount='other-account';view.rerender(<MemoryRouter><ChannelAuditPage/></MemoryRouter>);
 expect(screen.queryByText('Preparing audit')).not.toBeInTheDocument();
 expect(screen.getByPlaceholderText(/youtube.com\/@yourchannel/)).toHaveValue('');
 await act(async()=>{request.resolve({schemaVersion:2,id:43});});
 expect(screen.queryByText('Report 43')).not.toBeInTheDocument();expect(ctrApi.auditChannel).toHaveBeenCalledTimes(1);
});
it('after reload reconciles only through GET and opens the exact saved request',async()=>{
 const account=`clerk:${mockAccount}`;
 sessionStorage.setItem('bt.channelAudit.pending.v1:'+account,JSON.stringify({accountId:account,requestKey:'saved-request-123',channel:'@Garter',startedAt:Date.now()}));
 (ctrApi.getChannelAuditRequestStatus as jest.Mock).mockResolvedValue({status:'completed',auditId:44});
 (ctrApi.getChannelAudit as jest.Mock).mockResolvedValue({schemaVersion:2,id:44});
 mount();expect(await screen.findByText('Report 44')).toBeInTheDocument();
 expect(ctrApi.getChannelAuditRequestStatus).toHaveBeenCalledWith('saved-request-123');expect(ctrApi.auditChannel).not.toHaveBeenCalled();
});
it('reload with unknown status stays honest and does not submit again',async()=>{
 const account=`clerk:${mockAccount}`;
 sessionStorage.setItem('bt.channelAudit.pending.v1:'+account,JSON.stringify({accountId:account,requestKey:'unknown-request-123',channel:'@Garter',startedAt:Date.now()-21*60_000}));
 (ctrApi.getChannelAuditRequestStatus as jest.Mock).mockResolvedValue({status:'unknown'});
 mount();await act(async()=>{});await waitFor(()=>expect(ctrApi.getChannelAuditRequestStatus).toHaveBeenCalled());
 expect(screen.getByText(/Checking for your saved audit report/)).toBeInTheDocument();expect(screen.queryByText('Preparing audit')).not.toBeInTheDocument();expect(ctrApi.auditChannel).not.toHaveBeenCalled();
 expect(screen.getByRole('button',{name:/Preparing|Auditing|Audit channel/})).toBeDisabled();
});

it('polls saved lookup after reload and opens completion without a POST',async()=>{
 jest.useFakeTimers();
 const account=`clerk:${mockAccount}`;
 sessionStorage.setItem('bt.channelAudit.pending.v1:'+account,JSON.stringify({accountId:account,requestKey:'poll-request-123',channel:'@Garter',startedAt:Date.now()}));
 (ctrApi.getChannelAuditRequestStatus as jest.Mock).mockResolvedValueOnce({status:'unknown'}).mockResolvedValueOnce({status:'completed',auditId:45});
 (ctrApi.getChannelAudit as jest.Mock).mockResolvedValue({schemaVersion:2,id:45});
 const view=mount();await act(async()=>{});
 await act(async()=>{jest.advanceTimersByTime(45_000);});
 expect(screen.getByText('Report 45')).toBeInTheDocument();
 expect(ctrApi.auditChannel).not.toHaveBeenCalled();expect(ctrApi.getChannelAuditRequestStatus).toHaveBeenCalledTimes(2);
 view.unmount();jest.useRealTimers();
});
it('respects authentication failures during read-only recovery',async()=>{
 const account=`clerk:${mockAccount}`;
 sessionStorage.setItem('bt.channelAudit.pending.v1:'+account,JSON.stringify({accountId:account,requestKey:'auth-request-123',channel:'@Garter',startedAt:Date.now()-21*60_000}));
 (ctrApi.getChannelAuditRequestStatus as jest.Mock).mockRejectedValueOnce({response:{status:401}});
 mount();await act(async()=>{});
 expect(screen.getByText(/Sign in to audit a channel/)).toBeInTheDocument();expect(ctrApi.auditChannel).not.toHaveBeenCalled();
});

it('allows explicit stop after recovery timeout without POST, then a new user submission',async()=>{
 const account=`clerk:${mockAccount}`;
 sessionStorage.setItem('bt.channelAudit.pending.v1:'+account,JSON.stringify({accountId:account,requestKey:'expired-request-123',channel:'@Garter',startedAt:Date.now()-21*60_000}));
 (ctrApi.getChannelAuditRequestStatus as jest.Mock).mockResolvedValueOnce({status:'unknown'});
 mount();await act(async()=>{});
 expect(screen.getByText(/The result is still unknown/)).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Stop waiting and return to form'}));
 expect(ctrApi.auditChannel).not.toHaveBeenCalled();
 expect(sessionStorage.getItem('bt.channelAudit.pending.v1:'+account)).toBeNull();
 expect(screen.queryByText(/Checking for your saved audit report/)).not.toBeInTheDocument();
 const request=deferred();(ctrApi.auditChannel as jest.Mock).mockReturnValue(request.promise);
 submit();expect(ctrApi.auditChannel).toHaveBeenCalledTimes(1);
 await act(async()=>{request.resolve({schemaVersion:2,id:46});});
 expect(screen.getByText('Report 46')).toBeInTheDocument();
});
it('never stops a known active POST even after twenty minutes',async()=>{
 jest.useFakeTimers();
 const request=deferred();(ctrApi.auditChannel as jest.Mock).mockReturnValue(request.promise);
 const view=mount();submit();
 act(()=>{jest.advanceTimersByTime(21*60_000);});
 expect(stopWaitingForAuditSession(`clerk:${mockAccount}`)).toBe(false);
 expect(screen.queryByRole('button',{name:'Stop waiting and return to form'})).not.toBeInTheDocument();
 expect(screen.getByText('Preparing audit')).toBeInTheDocument();
 expect(ctrApi.auditChannel).toHaveBeenCalledTimes(1);
 await act(async()=>{request.resolve({schemaVersion:2,id:47});});
 view.unmount();jest.useRealTimers();
});
it('frees the re-run button when a recovered request completes under a History link',async()=>{
 const account=`clerk:${mockAccount}`;
 window.history.replaceState({},'','/?audit=45');
 sessionStorage.setItem('bt.channelAudit.pending.v1:'+account,JSON.stringify({accountId:account,requestKey:'linked-request-123',channel:'@Garter',startedAt:Date.now()}));
 (ctrApi.getChannelAuditRequestStatus as jest.Mock).mockResolvedValue({status:'completed',auditId:44});
 (ctrApi.getChannelAudit as jest.Mock).mockImplementation(async(id:number)=>({schemaVersion:2,id}));
 (ctrApi.listChannelAudits as jest.Mock).mockResolvedValue([]);
 render(<MemoryRouter initialEntries={['/ai-thumbnails/channel-audit?audit=45']}><ChannelAuditPage/></MemoryRouter>);
 expect(await screen.findByText('Report 45')).toBeInTheDocument();
 await waitFor(()=>expect(ctrApi.getChannelAudit).toHaveBeenCalledWith(44));
 await waitFor(()=>expect(screen.queryByText(/re-running/)).not.toBeInTheDocument());
 expect(screen.getByText('Report 45')).toBeInTheDocument();
});
