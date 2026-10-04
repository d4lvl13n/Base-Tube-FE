import ctrApi from '../../api/ctr';
import api from '../../api/index';
jest.mock('../../api/index', () => ({__esModule:true, default:{post:jest.fn(),get:jest.fn(),patch:jest.fn()}}));
it('submits the optional viewer goal through the existing API and keeps an idempotency key', async()=>{
 (api.post as jest.Mock).mockResolvedValueOnce({data:{success:true,data:{schemaVersion:2}}});
 await ctrApi.auditChannel('@creator','  Relax on television  ');
 expect(api.post).toHaveBeenCalledWith('/api/v1/ctr/channel-audit',{channelUrl:'@creator',creatorGoal:'Relax on television'},expect.objectContaining({headers:{'Idempotency-Key':expect.any(String)}}));
});
it('downloads the saved HTML through the authenticated shared client', async()=>{
 const report=new Blob(['<!doctype html><html>Report</html>'],{type:'text/html'});(api.get as jest.Mock).mockResolvedValueOnce({data:report});
 expect(await ctrApi.exportChannelAudit(42)).toBe(report);expect(api.get).toHaveBeenCalledWith('/api/v1/ctr/channel-audit/42/export',{responseType:'blob'});
});

it('records a native-test declaration through the same authenticated client', async()=>{
 const tracking=[{experimentId:'exp1',status:'completed',result:'inconclusive',source:'creator_reported'}];(api.patch as jest.Mock).mockResolvedValueOnce({data:{success:true,data:{experimentTracking:tracking}}});
 const update:any={status:'completed',result:'inconclusive',startDate:'2026-09-01',endDate:'2026-09-10'};
 expect(await ctrApi.updateAuditExperiment(42,'exp1',update)).toBe(tracking);
 expect(api.patch).toHaveBeenCalledWith('/api/v1/ctr/channel-audit/42/experiments/exp1',update);
});
it('does not report a rejected test update as saved',async()=>{
 (api.patch as jest.Mock).mockResolvedValueOnce({data:{success:false,error:{message:'Invalid date'}}});
 await expect(ctrApi.updateAuditExperiment(42,'exp1',{status:'prepared'})).rejects.toThrow('Invalid date');
});
