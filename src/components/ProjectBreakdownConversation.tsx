import { EXECUTE_BREAKDOWN, BREAKDOWN_PROGRESS } from '../features/coordination/projectBreakdownExecution'
import type { BreakdownProgress } from '../features/coordination/projectBreakdownExecution'
import { useEffect, useRef, useState } from 'react'
import { FigmaIcon as Icon } from './FigmaIcon'
import { ProjectMaterials, readMaterials, saveMaterials } from '../features/coordination/ProjectMaterials'
import type { ProjectMaterial } from '../features/coordination/ProjectMaterials'
import './planning-conversation.css'
export const OPEN_BREAKDOWN='workplace:open-project-breakdown'
export function openProjectBreakdown(project:string){window.dispatchEvent(new CustomEvent(OPEN_BREAKDOWN,{detail:{project}}))}
const STEPS=[
 {title:'这个项目希望达成什么目标？',hint:'描述要解决的问题，以及最终希望交付的成果。',placeholder:'例如：改版支付流程，减少支付失败，交付设计稿、前后端功能和验收报告。'},
 {title:'哪些工作需要包含在拆解里？',hint:'补充交付范围，也可以说明本次不做的内容。',placeholder:'例如：包含需求梳理、设计、开发和验收；暂不涉及海外支付。'},
 {title:'时间和人员有什么边界？',hint:'填写已知约束；尚未明确的部分可以标记为待确认。',placeholder:'例如：希望两周内完成；设计 1 人、前端 2 人、后端 1 人，不安排加班。'},
]
export function ProjectBreakdownConversation({project}:{project:string}) {
 const [step,setStep]=useState(0),[answers,setAnswers]=useState(['','','']),[done,setDone]=useState(false),[error,setError]=useState(''),[saving,setSaving]=useState(false)
 const [materials,setMaterials]=useState(()=>readMaterials().filter(m=>m.project===project))
 const [files,setFiles]=useState<File[]>([]),[linked,setLinked]=useState<ProjectMaterial[]>([])
 const [message,setMessage]=useState(''),[notes,setNotes]=useState<string[]>([])
 const [progress,setProgress]=useState<BreakdownProgress|null>(null)
 const requestId=useRef('')
 useEffect(()=>{const receive=(event:Event)=>{const result=(event as CustomEvent<BreakdownProgress>).detail;if(result.requestId===requestId.current)setProgress(result)};window.addEventListener(BREAKDOWN_PROGRESS,receive);return()=>window.removeEventListener(BREAKDOWN_PROGRESS,receive)},[])
 const start=(supplement:string[])=>{requestId.current=crypto.randomUUID();setProgress({requestId:requestId.current,phase:'running',message:'正在准备拆解项目…',step:0,total:0});window.dispatchEvent(new CustomEvent(EXECUTE_BREAKDOWN,{detail:{requestId:requestId.current,project,answers,notes:supplement}}))}
 const q=STEPS[step]
 const next=async()=>{
   if(!answers[step].trim()){setError('请补充这项信息，或填写“待确认”');return}
   if(saving)return
   setSaving(true);setError('')
   try {
     if(files.length||linked.length){await saveMaterials(project,files,linked);setMaterials(readMaterials().filter(m=>m.project===project));setFiles([]);setLinked([])}
     if(step<2)setStep(step+1)
     else {const supplement=[...notes,...(message.trim()?[message.trim()]:[])];localStorage.setItem('workbase-breakdown-brief:'+project,JSON.stringify({project,answers,notes:supplement}));setNotes(supplement);setMessage('');setDone(true);start(supplement)}
   }catch{setError('资料保存失败，请重试')}finally{setSaving(false)}
 }
 const send=()=>{if(message.trim()){setNotes(old=>[...old,message.trim()]);setMessage('')}}
 return <div className="planning-conversation breakdown-conversation">
  <div className="planning-messages">
   <div className="planning-context">{project} · 项目拆解</div>
   <div className="planning-user">帮我快速拆解这个项目</div>
   <div className="planning-assistant"><header><Icon file="avatar.png"/>小W</header><p>我们先明确项目目标和边界，再把工作拆成可执行的任务。{materials.length?`已关联 ${materials.length} 份项目资料，你可以继续补充。`:'你可以补充需求文档或关联资料，也可以直接描述项目。'}</p></div>
   {!!materials.length&&<div className="breakdown-materials"><strong>项目资料 · {materials.length}</strong>{materials.map((m,i)=><div key={m.id+i}><Icon file="9747e.svg"/><span>{m.name}</span></div>)}</div>}
   {answers.map((answer,i)=>(i<step||done)&&<div className="planning-user" key={i}>{answer}</div>)}
   {notes.map((note,i)=><div className="planning-user" key={'note'+i}>{note}</div>)}
   {done&&<section className="planning-summary"><h3>项目拆解信息已确认</h3><dl>{['项目目标','交付范围','时间与人员'].map((label,i)=><div key={label}><dt>{label}</dt><dd>{answers[i]}</dd></div>)}{!!notes.length&&<div><dt>补充说明</dt><dd>{notes.join('；')}</dd></div>}</dl>{progress?.phase==='error'&&<button onClick={()=>{setDone(false);setStep(0);setProgress(null)}}>修改项目信息</button>}</section>}
  </div>
  {done&&progress&&<section className="planning-execution breakdown-execution"><header><Icon file="avatar.png"/>小W{progress.phase==='running'&&<span className="breakdown-working-dot"/>}</header><p role="status" aria-live="polite">{progress.message}</p>{progress.phase==='running'&&<progress aria-label="项目拆解进度" max={progress.total||1} value={progress.step}/>}{progress.phase==='error'&&<button className="breakdown-retry" onClick={()=>start(notes)}>重新尝试</button>}</section>}
  {!done&&<section className="planning-boundary breakdown-boundary"><h3>{step+1} / 3　{q.title}</h3><p>{q.hint}</p><textarea aria-label={q.title} placeholder={q.placeholder} value={answers[step]} onChange={e=>{setAnswers(old=>old.map((v,i)=>i===step?e.target.value:v));setError('')}}/>
   {step===0&&<ProjectMaterials files={files} linked={linked} onFiles={setFiles} onLinked={setLinked}/>}
   {error&&<p role="alert">{error}</p>}<footer><button disabled={step===0||saving} onClick={()=>{setStep(step-1);setError('')}}>上一步</button><button className="primary" disabled={saving} onClick={next}>{saving?'保存中…':step===2?'确认信息':'下一步'}</button></footer>
  </section>}
  <div className="agent-input-wrap planning-composer"><div className="agent-input"><textarea aria-label="补充项目说明" placeholder="补充项目背景、要求或其他说明" disabled={done} value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();send()}}}/><div className="agent-input-actions"><button className="agent-mode"><Icon file="ed607.svg"/>界面模式<Icon file="ba197.svg"/></button><button className="agent-send" title="发送补充说明" disabled={done||!message.trim()} onClick={send}><Icon file="34a34.svg"/></button></div></div><small>项目资料与确认信息仅保存在当前浏览器</small></div>
 </div>
}
