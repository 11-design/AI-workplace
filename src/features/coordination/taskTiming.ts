import type { Task } from './types'
const BASE=Date.UTC(2026,9,28)
export function timelinePosition(date:Date){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Stockholm',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date)
 const val=(key:string)=>Number(parts.find(p=>p.type===key)?.value)
 return (Date.UTC(val('year'),val('month')-1,val('day'))-BASE)/86400000+(val('hour')*60+val('minute'))/1440
}
export function taskTiming(task:Task,now:Date){
 const current=timelinePosition(now),actual=task.completedAt?timelinePosition(new Date(task.completedAt)):undefined
 const end=task.baselineEnd??task.end
 const overdue=!task.aiChange&&task.status!=='已完成'&&current>=task.end+1
 const comparison=task.status==='已完成'?actual:current
 const color=task.status==='已完成'?'complete':task.aiChange?'progress':overdue?'overdue':current>=task.start?'progress':'idle'
 return {current,actual,end,overdue,comparison,late:comparison!==undefined&&comparison>end+1,color}
}
