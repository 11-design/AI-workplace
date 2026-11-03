import { EXECUTE_PLAN, PLAN_RESULT } from '../features/coordination/planningExecution'
import { useEffect, useRef, useState } from 'react'
import { FigmaIcon as Icon } from './FigmaIcon'
import './planning-conversation.css'
export type PlanningContext={task:string;project:string;owner:string;downstream:string[];prompt:string}
export const OPEN_PLANNING='workplace:open-planning'
export function openPlanning(detail:PlanningContext){window.dispatchEvent(new CustomEvent(OPEN_PLANNING,{detail}))}
const QUESTIONS=[
  {title:'最晚可以接受哪天完成？',choices:['保持原截止日期 11/04','最多延后 2 天至 11/06','自定义截止日期'],multi:false},
  {title:'哪些调整方式可以接受？',choices:['顺延受影响任务','允许无依赖的工作并行','允许拆分交付范围'],multi:true},
  {title:'人员与工作时间有什么边界？',choices:['保持现有人员，不安排加班','可以增加协作人员，不安排加班','资源方案待我进一步确认'],multi:false},
]
export function PlanningConversation({context}:{context:PlanningContext}){
 const [step,setStep]=useState(0),[answers,setAnswers]=useState<string[][]>([[],[],[]]),[date,setDate]=useState(''),[notes,setNotes]=useState<string[]>([]),[message,setMessage]=useState(''),[error,setError]=useState('')
 const [execution,setExecution]=useState('')
 const requestId=useRef('')
 const messagesRef=useRef<HTMLDivElement>(null)
 useEffect(()=>{const element=messagesRef.current;if(element)element.scrollTo({top:element.scrollHeight,behavior:'smooth'})},[step,execution,notes])
 useEffect(()=>{const handle=(event:Event)=>{const result=(event as CustomEvent).detail;if(result.requestId===requestId.current)setExecution(result.message)};window.addEventListener(PLAN_RESULT,handle);return()=>window.removeEventListener(PLAN_RESULT,handle)},[])
 const execute=(allowShift=answers[1].includes('顺延受影响任务'))=>{requestId.current=crypto.randomUUID();setExecution('正在调整排期…正在检查前置依赖与截止日期。');window.dispatchEvent(new CustomEvent(EXECUTE_PLAN,{detail:{requestId:requestId.current,project:context.project,task:context.task,deadline:answers[0].includes('自定义截止日期')?date:answers[0].includes('最多延后 2 天至 11/06')?'2026-11-06':'2026-11-04',allowShift,notes:[...notes,...(message.trim()?[message.trim()]:[])]}}))}
 const q=QUESTIONS[step]
 const labels=(index:number)=>answers[index].map(value=>value==='自定义截止日期'?date:value).join('；')
 const submit=()=>{if(!answers[step].length){setError('请选择边界条件');return}if(step===0&&answers[0].includes('自定义截止日期')&&(!date||date<'2026-10-30')){setError('请选择不早于 2026-10-30 的日期');return}setError('');setStep(step+1);if(step===2)execute()}
 const send=()=>{if(message.trim()){setNotes(old=>[...old,message.trim()]);setMessage('')}}
 return <div className="planning-conversation">
  <div className="planning-messages" ref={messagesRef}>
   <div className="planning-context">{context.project} · 排期调整</div>
   <div className="planning-user">{context.prompt}</div>
   <div className="planning-assistant"><header><Icon file="avatar.png"/>智能助手小西</header><p>已带入「{context.task}」的超时信息，负责人为{context.owner}。{context.downstream.length?`相关下游任务包括${context.downstream.join('、')}。`:''}先确认以下边界，再准备调整方案。</p></div>
   {answers.map((answer,index)=>index<step&&answer.length>0&&<div className="planning-user" key={index}>{labels(index)}</div>)}
   {notes.map((note,index)=><div className="planning-note-pair" key={index}><div className="planning-user">{note}</div><p>已记录为补充条件。</p></div>)}
   {step===3&&<details className="planning-summary"><summary>已确认的边界条件</summary><dl>{['最晚截止','调整范围','资源边界'].map((label,index)=><div key={label}><dt>{label}</dt><dd>{labels(index)}</dd></div>)}{notes.length>0&&<div><dt>补充条件</dt><dd>{notes.join('；')}</dd></div>}</dl></details>}

  </div>
  {step===3&&<section className="planning-execution"><header><Icon file="avatar.png"/>智能助手小西</header><p role="status" aria-live="polite">{execution}</p>{!execution.startsWith('正在')&&<div className="planning-execution-actions">{execution.includes('未允许顺延')&&<button className="primary" onClick={()=>{setAnswers(old=>old.map((value,index)=>index===1?[...new Set([...value,'顺延受影响任务'])]:value));execute(true)}}>允许顺延并继续</button>}<button onClick={()=>setStep(execution.includes('未允许顺延')?1:0)}>修改边界条件</button></div>}</section>}
  {q&&<section className="planning-boundary">{step>0&&<p>{step===1?'请选择允许采用的排期调整方式。':'请确认资源边界，避免产生未经同意的人员或加班安排。'}</p>}<h3>{step+1} / 3　{q.title}<small>（{q.multi?'多选':'单选'}）</small></h3><div className="planning-options">{q.choices.map((choice,index)=><button key={choice} className={answers[step].includes(choice)?'selected':''} aria-pressed={answers[step].includes(choice)} onClick={()=>{setError('');setAnswers(old=>old.map((value,i)=>i!==step?value:q.multi?(value.includes(choice)?value.filter(v=>v!==choice):[...value,choice]):[choice]))}}><Icon file={`choice-number-${index+1}${answers[step].includes(choice)?'-selected':''}.svg`} className="planning-number-icon"/><span>{choice}</span>{answers[step].includes(choice)&&<Icon file="870aa.svg"/>}</button>)}</div>{step===0&&answers[0].includes('自定义截止日期')&&<input aria-label="最晚截止日期" type="date" min="2026-10-30" value={date} onChange={event=>setDate(event.target.value)}/>} {error&&<p role="alert">{error}</p>}<footer><button onClick={()=>{setError('');setStep(step-1)}} disabled={step===0}>上一步</button><button className="primary" onClick={submit}>{step===2?'确认边界':'确定'}</button></footer></section>}
  <div className="agent-input-wrap planning-composer"><div className="agent-input"><textarea aria-label="补充排期边界" value={message} onChange={event=>setMessage(event.target.value)} placeholder="描述你想推进的事项，或需要调整的项目计划" onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing){event.preventDefault();send()}}}/><div className="agent-input-actions"><button title="添加附件"><Icon file="9747e.svg"/></button><button className="agent-mode"><Icon file="ed607.svg"/>界面模式<Icon file="ba197.svg"/></button><button className="agent-send" title="发送补充条件" disabled={!message.trim()} onClick={send}><Icon file="34a34.svg"/></button></div></div><small><span>推荐和回答由 AI 生成，仅供参考</span></small></div>
 </div>
}
