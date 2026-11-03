import { useEffect, useState } from 'react'
import { FigmaIcon as Icon } from '../../components/FigmaIcon'
import { WorkActivity } from '../../components/WorkActivity'
import { ItemContext } from './ItemContext'
import { AiBadge } from '../../components/AiBadge'
import './personal.css'
type Item={id:string;title:string;type:'任务'|'会议';time:string;owner:string;project:string;status:string;column:string;dynamics:string[]}
const COLUMNS=['进行中','已完成','未开始','已挂起']
const PROJECTS=['支付体验改版','交易稳定性提升','移动端收银台升级']
const ITEM_SEEDS:Array<Pick<Item,'title'|'type'|'time'|'owner'|'dynamics'>>=[
 {title:'接口错误码定义',type:'任务',time:'11/04 截止',owner:'陈宇',dynamics:['需求确认','活动规则','文案校对']},
 {title:'支付链路联调会',type:'会议',time:'11/03 10:30',owner:'林晓',dynamics:['会议邀请','议程确认','智能会议纪要']},
 {title:'异常状态文案确认',type:'任务',time:'11/04 截止',owner:'苏禾',dynamics:['需求变更','文案初稿','评审通过']},
 {title:'支付结果页视觉稿',type:'任务',time:'10/27 完成',owner:'苏禾',dynamics:['设计排期','视觉初稿','设计验收']},
 {title:'回调重试机制开发',type:'任务',time:'10/28 完成',owner:'赵晨',dynamics:['方案评审','代码提交','合并完成']},
 {title:'埋点字段核对',type:'任务',time:'10/28 完成',owner:'王敏',dynamics:['字段清单','数据核验','口径确认']},
 {title:'测试用例评审',type:'会议',time:'11/03 15:00',owner:'李悦',dynamics:['会议邀请','材料补充','智能会议纪要']},
 {title:'需求验收标准补充',type:'任务',time:'10/29 完成',owner:'林晓',dynamics:['标准草案','业务确认','版本归档']},
 {title:'前端支付组件接入',type:'任务',time:'11/04 截止',owner:'赵晨',dynamics:['接口对齐','组件开发','联调中']},
 {title:'灰度发布方案',type:'任务',time:'11/05 截止',owner:'林晓',dynamics:['范围确认','风险评估','方案评审']},
 {title:'支付失败监控配置',type:'任务',time:'11/05 截止',owner:'陈宇',dynamics:['指标定义','告警配置','等待验证']},
 {title:'用户反馈回访',type:'任务',time:'11/06 截止',owner:'王敏',dynamics:['名单整理','话术确认','等待回访']},
 {title:'上线验收',type:'任务',time:'11/06 截止',owner:'李悦',dynamics:['验收清单','环境检查','等待上线']},
 {title:'旧版支付入口下线',type:'任务',time:'待确认',owner:'赵晨',dynamics:['影响排查','下线窗口','待确认']}
]
const COLUMN_COUNTS=[3,5,5,1],COLUMN_OFFSETS=[0,3,8,13]
const ITEM_PROJECTS=[
 '支付体验改版','交易稳定性提升','移动端收银台升级','支付体验改版',
 '交易稳定性提升','移动端收银台升级','支付体验改版','交易稳定性提升',
 '移动端收银台升级','支付体验改版','交易稳定性提升','移动端收银台升级',
 '支付体验改版','交易稳定性提升'
]
const INITIAL:Item[]=COLUMNS.flatMap((column,c)=>Array.from({length:COLUMN_COUNTS[c]},(_,i)=>{const index=COLUMN_OFFSETS[c]+i;return {id:`${c}-${i}`,...ITEM_SEEDS[index],project:ITEM_PROJECTS[index],status:column,column}}))
const ITEM_TEMPLATE=new Map(INITIAL.map(item=>[item.id,item]))
export default function PersonalWorkspace(){
 const [items,setItems]=useState<Item[]>(()=>{try{const stored:Item[]=JSON.parse(localStorage.getItem('workbase-personal-items')||'null')??INITIAL;return stored.map(item=>{const seed=ITEM_TEMPLATE.get(item.id);return seed?{...item,...seed}:item})}catch{return INITIAL}}),[project,setProject]=useState('全部'),[kind,setKind]=useState('全部'),[view,setView]=useState('calendar'),[selected,setSelected]=useState<Item|null>(null),[creating,setCreating]=useState(false),[title,setTitle]=useState(''),[advice,setAdvice]=useState(false)
 useEffect(()=>{localStorage.setItem('workbase-personal-items',JSON.stringify(items))},[items])
 const shown=items.filter(item=>(project==='全部'||item.project===project)&&(kind==='全部'||item.type===kind))
 const projectItems=items.filter(item=>project==='全部'||item.project===project)
 const update=(change:Partial<Item>)=>{if(!selected)return;const next={...selected,...change};setItems(old=>old.map(item=>item.id===next.id?next:item));setSelected(next)}
 const card=(item:Item)=><article className="personal-task" key={item.id}>
  <div className="personal-task-meta"><span>{item.type} · {item.time}</span><button aria-label={'修改'+item.title+'状态'} onClick={()=>setSelected(item)}><Icon file="my-items/2ead0.svg"/><span>{item.status}</span><Icon file="my-items/edit.svg"/></button></div>
  <button className="personal-task-title" onClick={()=>setSelected(item)}>{item.title}</button>
  <div className={`personal-task-footer${item.type==='会议'?' is-meeting':''}`}>{item.type==='会议'&&<AiBadge label="智能会议纪要"/>}<div className="personal-task-owner"><Icon file="my-items/person-avatar.svg"/>{item.owner}</div></div>
 </article>
 const removeItem=(id:string)=>setItems(old=>old.filter(item=>item.id!==id))
 const listDate=(item:Item)=>item.time==='待确认'?'待确认':`2026/${item.time.slice(0,5)}`
 const dynamics=(item:Item)=><div className="personal-list-dynamics">{item.dynamics.map((dynamic,index)=><span className="personal-dynamic-part" key={dynamic}><span className={`personal-dynamic-chip${index===item.dynamics.length-1?' is-current':''}${dynamic==='智能会议纪要'?' is-ai':''}`}>{index===item.dynamics.length-1&&<Icon file="my-items/dynamic-dot.svg"/>}{dynamic}</span>{index<item.dynamics.length-1&&<i/>}</span>)}</div>
 const listRow=(item:Item)=><article className="personal-list-row" key={item.id}>
  <div className="personal-list-name"><button className="personal-list-project" onClick={()=>setProject(item.project)}>{item.project}</button><button onClick={()=>setSelected(item)}>{item.title}</button></div>
  <div><span className={`personal-list-type is-${item.type==='会议'?'meeting':'task'}`}>{item.type}</span></div>
  <button className="personal-list-status" onClick={()=>setSelected(item)}><Icon file="my-items/status-dot.svg"/><span>{item.status}</span><Icon file="my-items/edit.svg"/></button>
  <time>{listDate(item)}</time>
  {dynamics(item)}
  <div className="personal-list-owner"><Icon file="my-items/person-avatar.svg"/>{item.owner}</div>
  <div className="personal-list-actions"><button onClick={()=>setSelected(item)}>详情</button><button onClick={()=>{if(window.confirm(`删除“${item.title}”？`))removeItem(item.id)}}>删除</button></div>
 </article>
 return <><div className="coordination-workspace personal-workspace"><section className="personal-main">
  <header className="coordination-section-title"><div className="coordination-heading"><Icon file="my-items/work-heading.svg"/><h2>我的工作</h2><p>会议显示开始时间 · 任务只标截止日期</p></div><div className="coordination-toolbar"><button className="suggestion-pill" onClick={()=>setAdvice(!advice)}><Icon file="my-items/fc9a4.svg"/>处理建议<span>按照变动重新调整任务安排</span></button><button className="personal-create" aria-label="新建事项" onClick={()=>{setTitle('');setCreating(true)}}>＋ 新建事项</button></div></header>
  {advice&&<div className="coordination-advice">先查看与我相关的变动，确认任务状态和前置依赖，再调整待办。<button onClick={()=>setAdvice(false)}>收起</button></div>}
  <div className="personal-card"><div className="personal-filters"><label htmlFor="personal-project">项目</label><div className="coordination-select"><select id="personal-project" value={project} onChange={e=>setProject(e.target.value)}><option>全部</option>{PROJECTS.map(name=><option key={name}>{name}</option>)}</select><Icon file="my-items/66e18.svg"/></div><div className="personal-kind-filters">{['全部','任务','会议'].map(type=>{const count=type==='全部'?projectItems.length:projectItems.filter(item=>item.type===type).length;return <button className={kind===type?'active':''} key={type} onClick={()=>setKind(type)}>{type==='全部'?'全部事项':type} {count}</button>})}</div><div className="personal-views">{[{id:'calendar',icon:view==='calendar'?'1def7.svg':'39f77.svg',name:'日历视图'},{id:'list',icon:view==='list'?'list-view-active.svg':'fff00.svg',name:'清单视图'},{id:'board',icon:view==='board'?'873f8.svg':'cb6db.svg',name:'看板视图'}].map(v=><button title={v.name} aria-pressed={view===v.id} className={view===v.id?'active':''} key={v.id} onClick={()=>setView(v.id)}><Icon file={'my-items/'+v.icon} className={v.id==='board'&&view==='board'?'rotate-90':''}/></button>)}</div></div>
  <div className={'personal-items personal-'+view}>{view==='board'?COLUMNS.map(column=><section className="personal-column" key={column}><h3>{column}<span>5</span></h3>{shown.filter(item=>item.column===column).map(card)}</section>):view==='list'?<div className="personal-list"><header className="personal-list-head"><span>项目名 / 任务名 <Icon file="54457.svg"/></span><span>类型</span><span>任务状态</span><span>截止/起始日期 <Icon file="54457.svg"/></span><span>动态</span><span>发起人</span><span>操作</span></header>{shown.map(listRow)}</div>:<div className="personal-calendar-grid">
    <div className="personal-time-axis"><div className="personal-date-spacer"/>{Array.from({length:13},(_,i)=><span key={i}>{String(i+8).padStart(2,'0')}:00</span>)}</div>
    {Array.from({length:4},(_,column)=>{const columnItems=shown.filter((_,index)=>index%4===column);return <section className="personal-date-column" key={column}><h3>{['11/03','11/04','11/05','11/06'][column]} <span>{columnItems.length}</span></h3><div className="personal-day-items">{columnItems.map((item,index)=><div className={'personal-calendar-slot '+(index%2===0?'compact':'')+(item.type==='会议'?' meeting-slot':'')} key={item.id}>{card(item)}</div>)}</div></section>})}
    <div className="personal-current-time"><span>15:23 PM</span><i/></div>
  </div>}
  </div></div>
 </section><WorkActivity onOpen={name=>setSelected(items.find(item=>item.title===name)??{...INITIAL[0],id:'linked',title:name})}/></div>
 {selected&&<div className="personal-overlay" onClick={()=>setSelected(null)}><aside className="personal-detail" role="dialog" aria-modal="true" aria-label="事项详情" onClick={e=>e.stopPropagation()}><header><h2>事项详情</h2><button onClick={()=>setSelected(null)}>关闭</button></header><h3>{selected.title}</h3><dl className="item-detail-fields"><dt>所属项目</dt><dd>{selected.project}</dd><dt>关联人员</dt><dd>{selected.owner}</dd><dt>事项类型</dt><dd>{selected.type}</dd><dt>时间</dt><dd>{selected.time}</dd><dt>状态</dt><dd><select value={selected.status} onChange={e=>update({status:e.target.value,column:e.target.value})}>{COLUMNS.map(s=><option key={s}>{s}</option>)}</select></dd></dl><ItemContext key={selected.id} item={selected} items={items} onSelect={id=>{const target=items.find(item=>item.id===id);if(target)setSelected(target)}}/></aside></div>}
 {creating&&<div className="personal-overlay" onClick={()=>setCreating(false)}><form className="personal-create-dialog" role="dialog" aria-modal="true" aria-label="新建事项" onClick={e=>e.stopPropagation()} onSubmit={e=>{e.preventDefault();if(!title.trim())return;setItems(old=>[...old,{...INITIAL[0],id:crypto.randomUUID(),title:title.trim(),status:'未开始',column:'未开始',dynamics:['事项创建','等待分配']}]);setCreating(false)}}><h2>新建事项</h2><label>事项名称<input required autoFocus value={title} onChange={e=>setTitle(e.target.value)}/></label><footer><button type="button" onClick={()=>setCreating(false)}>取消</button><button type="submit">创建</button></footer></form></div>}
 </>
}
