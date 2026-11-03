import { AiBadge } from '../../components/AiBadge'
import { useState } from 'react'
import { CheckCheck, CalendarDays, FolderClosed, MessageSquare, FileText } from 'lucide-react'
import { FigmaIcon } from '../../components/FigmaIcon'

type ContextItem = { id:string; title:string; type:'任务'|'会议'; project:string; owner:string; status:string }
export function ItemContext({item,items,onSelect}:{item:ContextItem;items:ContextItem[];onSelect:(id:string)=>void}) {
 const [focused,setFocused]=useState<string|null>(null)
 const related=items.filter(other=>other.project===item.project&&other.title!==item.title).filter((other,index,list)=>list.findIndex(candidate=>candidate.title===other.title&&candidate.type===other.type)===index).slice(0,2)
 const hasContext=['研发交付对齐','活动页文案确认'].includes(item.title)
 const nodes=[{id:'project',title:item.project,type:'项目',x:22,y:32,icon:FolderClosed,description:'当前事项所属项目'},...related.map((other,i)=>({id:other.id,title:other.title,type:other.type,x:404,y:32+i*80,icon:other.type==='会议'?CalendarDays:CheckCheck,description:`${other.owner} · ${other.status}`})),...(hasContext?[{id:'source',title:'后端项目群',type:'消息',x:22,y:192,icon:MessageSquare,description:'10/28 · 沟通来源，与当前事项关联'},{id:'document',title:'支付体验改版需求说明',type:'文件',x:404,y:192,icon:FileText,description:'交付范围与验收要求 · 关联项目资料'}]:[])]
 const active=nodes.find(node=>node.id===focused)
 return <>
  <section className="item-context-section"><div className="item-section-heading"><h4>关联实体</h4><span>{nodes.length} 个关联</span></div>
   <div className="item-graph-legend"><span><i/>所属与关联</span><span>点击节点查看上下文</span></div>
   <div className="item-graph-scroll"><div className="item-graph">
    <svg className="item-graph-edges" width="600" height="270" aria-hidden="true">{nodes.map(node=><path key={node.id} d={node.x<200?`M 186 ${node.y+18} C 226 ${node.y+18}, 186 130, 218 130`:`M 382 130 C 416 130, 364 ${node.y+18}, 404 ${node.y+18}`}/>)}</svg>
    <div className="item-graph-current" style={{left:218,top:112}}><span className={'item-status-dot '+(item.status==='已完成'?'complete':'')}/><span title={item.title}>{item.title}</span><span className="item-graph-avatar">{item.owner.slice(-2)}</span></div>
    {nodes.map(node=><button key={node.id} className={'item-graph-node'+(focused===node.id?' selected':'')} style={{left:node.x,top:node.y}} onClick={()=>setFocused(focused===node.id?null:node.id)} title={node.title}><node.icon size={13}/><span>{node.title}</span></button>)}
   </div></div>
   {active&&<div className="item-entity-preview"><div><span>{active.type}</span><strong>{active.title}</strong><p>{active.description}</p></div>{items.some(other=>other.id===active.id)&&<button onClick={()=>{onSelect(active.id);setFocused(null)}}>查看事项</button>}</div>}
  </section>
  <section className="item-context-section"><div className="item-section-heading"><h4>相关动态</h4><span>仅当前事项</span></div>
   {hasContext?<div className="item-detail-events">
    <article><div className="item-event-marker"><FigmaIcon file="activity-ai/df3a9.svg"/><i/></div><div><div className="item-event-date">10/28 · 10:52</div><p><span className="item-actor">{item.owner}</span> 在沟通中补充了 <span className="item-inline-entity">{item.title}</span> 的交付要求</p><div className="item-event-note">交付前需完成需求对齐，并确认相关资料中的验收要求。</div><div className="item-event-source"><span>来源</span><span className="event-source-name">后端项目群 · 10/28</span><AiBadge/></div></div></article>
    <article><div className="item-event-marker"><FigmaIcon file="my-items/2d603.svg"/><i/></div><div><div className="item-event-date">10/28 · 09:30</div><p><span className="item-actor">{item.owner}</span> 创建了 <span className="item-inline-entity">{item.title}</span></p><div className="item-event-source"><span>来源</span><span>{item.owner} · 10/28 09:30</span></div></div></article>
   </div>:<p className="item-context-empty">暂无相关动态</p>}
  </section>
 </>
}
