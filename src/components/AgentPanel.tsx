import { OPEN_BREAKDOWN, ProjectBreakdownConversation } from './ProjectBreakdownConversation'
import { useEffect, useState } from 'react'
import { FigmaIcon as Icon } from './FigmaIcon'
import { OPEN_PLANNING, PlanningConversation } from './PlanningConversation'
import type { PlanningContext } from './PlanningConversation'

const PROMPTS = ['帮我梳理项目进展，找出需要协调的事项', '帮我拆解项目任务，理清前置依赖', '根据任务变动，帮我重新调整项目排期']

export function AgentPanel({ expanded = false }: { expanded?: boolean }) {
  const [breakdown,setBreakdown]=useState<string|null>(null)
  useEffect(()=>{const handle=(event:Event)=>{setBreakdown((event as CustomEvent<{project:string}>).detail.project);setPlanning(null);setSession(value=>value+1);setOpen(true)};window.addEventListener(OPEN_BREAKDOWN,handle);return()=>window.removeEventListener(OPEN_BREAKDOWN,handle)},[])
  const [planning,setPlanning]=useState<PlanningContext|null>(null)
  const [session,setSession]=useState(0)
  useEffect(()=>{const handle=(event:Event)=>{setBreakdown(null);setPlanning((event as CustomEvent<PlanningContext>).detail);setSession(value=>value+1);setOpen(true)};window.addEventListener(OPEN_PLANNING,handle);return()=>window.removeEventListener(OPEN_PLANNING,handle)},[])
  const [open, setOpen] = useState(expanded)
  const [message, setMessage] = useState('')
  const [wide, setWide] = useState(false)
  if (!open) return <button className="agent-launcher" title="打开智能助手" onClick={() => setOpen(true)}><Icon file="avatar.png" /></button>
  return <aside className="agent-panel" aria-label="智能助手小西" style={{...(wide ? {width:600}:{}),...(planning?{zIndex:60}:{})}}>
    <header className="agent-panel-header"><div className="agent-header-actions">
      <button title="新建对话" onClick={() => {setMessage('');setPlanning(null);setBreakdown(null)}}><Icon file="97b0b.svg" /></button>
      <span className="agent-header-divider" />
      <button title="切换面板宽度" onClick={() => setWide(!wide)}><Icon file="8d53f.svg" /></button>
      <button title="更多"><Icon file="eb759.svg" /></button>
      <button title="收起智能助手" onClick={() => setOpen(false)}><Icon file="9806a.svg" /></button>
    </div></header>
    {breakdown?<ProjectBreakdownConversation key={session} project={breakdown}/>:planning?<PlanningConversation key={session} context={planning}/>:<>
    <div className="agent-panel-body">
      <Icon file="avatar.png" className="agent-avatar" />
      <h2>Hi，我是 Worktile 智能助手小西<span>一起推进你的项目</span></h2>
      <p>从任务变动到协作进展，帮你理清依赖、发现风险、调整排期。</p>
      <div className="agent-prompts">{PROMPTS.map(prompt => <button key={prompt} onClick={() => setMessage(prompt)}>
        <span className="figma-star" aria-hidden="true"><Icon file="8ecbc.svg" /><span className="figma-star-light first"><Icon file="8905b.svg" /></span><span className="figma-star-light second"><Icon file="a0411.svg" /></span></span><span>{prompt}</span><Icon file="f0889.svg" />
      </button>)}</div>
    </div>
    <footer className="agent-input-wrap">
      <div className="agent-input">
        <textarea aria-label="询问智能助手" value={message} onChange={event => setMessage(event.target.value)} placeholder="描述你想推进的事项，或需要调整的项目计划" />
        <div className="agent-input-actions">
          <button title="添加附件"><Icon file="9747e.svg" /></button>
          <button className="agent-mode"><Icon file="ed607.svg" />界面模式<Icon file="ba197.svg" /></button>
          <button className="agent-send" disabled title="发送"><Icon file="34a34.svg" /></button>
        </div>
      </div>
      <small><span>推荐和回答由 AI 生成，仅供参考</span></small>
    </footer></>}
  </aside>
}
