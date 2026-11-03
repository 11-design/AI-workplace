import type { Task } from './types'
export const EXECUTE_BREAKDOWN='workplace:execute-breakdown'
export const BREAKDOWN_PROGRESS='workplace:breakdown-progress'
export type BreakdownRequest={requestId:string;project:string;answers:string[];notes:string[]}
export type BreakdownProgress={requestId:string;phase:'running'|'complete'|'error';message:string;step:number;total:number}
// Local prototype planner. File content is not sent to or interpreted by a model.
export function buildBreakdownBatches(request:BreakdownRequest):Task[][] {
 const scope=request.answers[1].split(/[，、,；;\n]+/).map(s=>s.trim()).filter(s=>s&&!/不包含|不涉及|暂不|不做|排除/.test(s))
 const topics=scope.length?scope.slice(0,4):['明确需求','制定方案','实施交付','验收确认']
 const batches:Task[][]=[]
 let predecessor:string|undefined
 topics.forEach((topic,index)=>{
  const root='breakdown-'+crypto.randomUUID(),first='breakdown-'+crypto.randomUUID(),second='breakdown-'+crypto.randomUUID()
  const start=Math.min(index*2,8),end=Math.min(start+1,9)
  const base={project:request.project,owner:'待分配',participants:['林晓'],status:'待开始' as const,start,end,aiChange:'小W根据已确认的项目目标与范围生成，负责人和排期待确认。'}
  batches.push([{...base,id:root,title:topic.slice(0,48),deps:predecessor?[predecessor]:[]},{...base,id:first,parent:root,title:'明确'+topic.slice(0,20)+'的交付要求',end:start,deps:[]},{...base,id:second,parent:root,title:'完成'+topic.slice(0,20)+'并检查成果',start:end,deps:[first]}])
  predecessor=root
 })
 return batches
}
