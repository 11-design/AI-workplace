import type { Task } from './types'
export const EXECUTE_PLAN='workplace:execute-plan'
export const PLAN_RESULT='workplace:plan-result'
export type PlanRequest={requestId:string;project:string;task:string;deadline:string;allowShift:boolean;notes:string[]}
export function schedulePlan(tasks:Task[], request:PlanRequest):Task[]{
 if(request.notes.length)throw new Error('补充说明需要进一步确认，本次未自动修改排期。')
 if(!request.allowShift)throw new Error('接口交接、前端联调与上线验收存在前置依赖，不能通过并行解决超时。当前未允许顺延，因此尚未修改排期；可允许顺延后继续。')
 const target=tasks.find(t=>t.project===request.project&&t.title===request.task)
 if(!target)throw new Error('未找到目标任务，请重新打开处置建议。')
 const limit=Math.floor((Date.parse(request.deadline+'T00:00:00Z')-Date.parse('2026-10-28T00:00:00Z'))/86400000)
 const affected=new Set([target.id]);let expanded=true
 while(expanded){expanded=false;tasks.forEach(t=>{if(t.project===request.project&&!affected.has(t.id)&&t.deps.some(id=>affected.has(id))){affected.add(t.id);expanded=true}})}
 const result=tasks.map(t=>({...t})),done=new Set<string>(),visiting=new Set<string>()
 const visit=(id:string)=>{if(done.has(id))return;if(visiting.has(id))throw new Error('依赖存在循环，本次未修改排期。');visiting.add(id)
 const t=result.find(t=>t.id===id)!;for(const dep of t.deps)if(affected.has(dep))visit(dep)
 if(t.status!=='已完成'){
 const earliest=Math.max(t.start,id===target.id?2:0,...t.deps.map(id=>(result.find(t=>t.id===id)?.end??-1)+1))
 t.end=earliest+(t.end-t.start);t.start=earliest
 if(t.end>9)throw new Error('调整结果超出当前时间范围，本次未修改排期。')
 if(t.end>limit)throw new Error('保持现有工期与依赖时，无法满足截止日期。请放宽截止日期后重试。')
 }
 visiting.delete(id);done.add(id)}
 affected.forEach(visit)
 return result
}
