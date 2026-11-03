import { AiBadge } from './AiBadge'
import { FigmaIcon as Icon } from './FigmaIcon'
export function WorkActivity({onOpen,count=8}:{onOpen:(title:string)=>void;count?:number}) {
 return <aside className="coordination-activity personal-activity">
  <header className="coordination-activity-title"><div className="coordination-heading"><Icon file="my-items/04c60.svg" className="rotate-90"/><h2>工作动态</h2></div></header>
  <div className="activity-card" aria-label="与我相关的工作动态"><div className="activity-feed">
   {Array.from({length:count},(_,index)=>{const aiRecognized=index===1||index===3;return <article className={`coordination-event${aiRecognized?' is-ai-recognized':''}`} key={index}>
    <div className="event-time"><div className="event-time-label"><Icon file={aiRecognized?'activity-ai/df3a9.svg':'my-items/'+(index===0?'fffbc.svg':'2d603.svg')} className={index===0?'watching-icon':''}/><span>{index===0?'当前':'昨天'}</span></div><div className="event-time-line"><Icon file={aiRecognized?'activity-ai/eb6c1.svg':'my-items/'+(index===0?'1c97f.svg':'2c725.svg')}/></div></div>
    <div className="event-content"><h3 className="event-sentence"><span className="event-person"><Icon file="my-items/person-avatar.svg"/>林晓</span><span>{index===0?'创建了':'修改了'}</span><button className="event-entity" onClick={()=>onOpen('支付体验改版')}>支付体验改版</button>{index===0?<><span>项目，创建了</span>{['接口定义交接','设计规范交接','111'].map(title=><button key={title} className="event-entity" onClick={()=>onOpen(title)}>{title}</button>)}<span>任务</span></>:<span>项目的截止时间</span>}</h3><div className="event-source-row"><dl><dt>来源</dt><dd>{aiRecognized?<><span className="event-source-name">后端项目群 · </span><span>10/28</span></>:'林晓 · 10/28 10:52'}</dd></dl>{aiRecognized&&<AiBadge title="由 AI 从来源信息中识别"/>}</div></div>
   </article>})}
  </div></div>
 </aside>
}
