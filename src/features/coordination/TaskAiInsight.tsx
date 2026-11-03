import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CSSProperties } from 'react'
import type { Task } from './types'
import { DAYS } from './data'
import './task-ai.css'
import { openPlanning } from '../../components/PlanningConversation'

// Prototype event: snapshot at 10/30, not a live monitoring or model response.
export function getTaskInsight(task: Task, tasks: Task[]) {
  if (task.id !== 'api' || task.status === '已完成' || task.end >= 2) return null
  const related = tasks.filter(item => item.project === task.project)
  const affected = new Set<string>([task.id])
  let changed = true
  while (changed) { changed = false; related.forEach(item => { if (!affected.has(item.id) && item.deps.some(id => affected.has(id))) { affected.add(item.id); changed = true } }) }
  const downstream = related.filter(item => item.id !== task.id && affected.has(item.id))
  return { overdue: 2-task.end, downstream, planned: DAYS[task.end], owner: task.owner }
}
const asset=(file:string)=>`${import.meta.env.BASE_URL}figma/${file}`
function Star() { return <span className="figma-star task-ai-star" aria-hidden="true"><img src={asset('8ecbc.svg')} alt=""/><span className="figma-star-light first"><img src={asset('8905b.svg')} alt=""/></span><span className="figma-star-light second"><img src={asset('a0411.svg')} alt=""/></span></span> }
export function TaskAiContent({ task, tasks, compact=false }: {task:Task;tasks:Task[];compact?:boolean}) {
  const insight=getTaskInsight(task,tasks)
  if(task.aiChange)return <section className="task-ai-content is-compact"><header><span><Star/>AI 已调整</span></header><p>{task.aiChange}</p></section>
  if (!insight) return null
  return <section className={`task-ai-content ${compact?'is-compact':''}`}>
    <header><span><Star/>AI 排期研判</span></header>
    <h4>交付超时，后续排期存在风险</h4>
    <p>{task.owner}负责的「{task.title}」原定 {insight.planned} 完成，截至 10/30 仍为{task.status}，已超时 {insight.overdue} 天{insight.downstream.length?'，可能影响后续任务按期推进。':'，需进一步确认剩余工时。'}</p>
    <div className="task-ai-evidence"><strong>研判依据</strong><ul><li>计划截止：{insight.planned}；当前状态：{task.status}。</li><li>来源：任务排期、负责人及前置依赖记录。</li>{insight.downstream.length>0?<li>下游依赖：{insight.downstream.map(item=>item.title).join(' → ')}。</li>:<li>当前未发现关联的下游任务。</li>}</ul></div>
    <div className="task-ai-advice"><strong>处置建议</strong><div className="task-ai-prompts">
      <button type="button" className="task-ai-prompt" onClick={()=>openPlanning({task:task.title,project:task.project,owner:task.owner,downstream:insight.downstream.map(t=>t.title),prompt:"帮我重新调整项目排期"})}><Star/><span>帮我重新调整项目排期</span><img src={asset('f0889.svg')} width="16" height="16" alt=""/></button>
      {!compact&&<button type="button" className="task-ai-prompt" onClick={()=>openPlanning({task:task.title,project:task.project,owner:task.owner,downstream:insight.downstream.map(t=>t.title),prompt:"帮我评估交付范围与资源"})}><Star/><span>帮我评估交付范围与资源</span><img src={asset('f0889.svg')} width="16" height="16" alt=""/></button>}
    </div></div>
    {!compact&&<small className="task-ai-footnote">当前仅展示研判与建议，尚未修改任务排期。</small>}
  </section>
}
export function TaskAiBadge({task,tasks,style,onSelect}:{task:Task;tasks:Task[];style:CSSProperties;onSelect:()=>void}) {
  const hideTimer=useRef<ReturnType<typeof setTimeout>|null>(null)
  const [anchor,setAnchor]=useState<{left:number;top:number}|null>(null)
  if(task.aiChange)return null
  if(!getTaskInsight(task,tasks))return null
  return <span className="task-ai-badge" style={style} onMouseEnter={event=>{if(hideTimer.current)clearTimeout(hideTimer.current);const box=event.currentTarget.getBoundingClientRect();setAnchor({left:Math.max(12,Math.min(box.right+10,window.innerWidth-332)),top:Math.max(12,Math.min(box.top,window.innerHeight-440))})}} onMouseLeave={()=>{hideTimer.current=setTimeout(()=>setAnchor(null),180)}}>
    <button aria-label={'查看'+task.title+'的AI排期提醒'} onClick={event=>{event.stopPropagation();setAnchor(null);onSelect()}} onFocus={event=>{const box=event.currentTarget.getBoundingClientRect();setAnchor({left:Math.max(12,Math.min(box.right+10,window.innerWidth-332)),top:Math.max(12,Math.min(box.top,window.innerHeight-440))})}} onBlur={()=>setAnchor(null)}><img className="task-ai-risk-icon" src={asset('ai-prompt/fc9a4.svg')} alt=""/><span>风险提示</span></button>
    {anchor&&createPortal(<div className="task-ai-tooltip" role="tooltip" style={anchor} onMouseEnter={()=>{if(hideTimer.current)clearTimeout(hideTimer.current)}} onMouseLeave={()=>setAnchor(null)}><TaskAiContent task={task} tasks={tasks} compact/></div>,document.body)}
  </span>
}
