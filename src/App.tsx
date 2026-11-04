import { useState } from 'react'
import Coordination from './Coordination'
import PersonalWorkspace from './features/personal/PersonalWorkspace'
import { CloudHeader, CloudRail } from './components/CloudChrome'
import { AgentPanel } from './components/AgentPanel'
export default function App(){
 const [tab,setTab]=useState(new URLSearchParams(window.location.search).get('view')==='personal'?'我的事项':'项目协作')
 const [riskAlertsActive,setRiskAlertsActive]=useState(false)
 return <div className={`cloud-app ${riskAlertsActive?'risk-alerts-active':''}`}><CloudHeader/><CloudRail/><div className="cloud-tabs">{['项目协作','我的事项'].map(name=><button key={name} className={tab===name?'active':''} onClick={()=>setTab(name)}>{name}</button>)}<button className="cloud-new-workspace" aria-label="新建工作区">＋ 新建工作区</button></div><main className="coordination-page"><section className="workspace-greeting" aria-label="今日工作概览"><h1>早上好 Caroline，<span>今日有 <b>3</b> 个事项推荐你优先关注</span></h1><aside className="workspace-tracking" aria-label="AI 跟踪概览"><header><span className="tracking-pulse"/>AI 持续跟踪</header><div className="tracking-metrics"><div><p><b><button className="tracking-priority" onClick={()=>setRiskAlertsActive(true)}>3</button></b><span>个优先关注</span></p></div><i/><div><p><b>2</b><span>条今日变动</span></p></div><i/><div><p><b>6</b><span>个我的事项</span></p></div></div></aside></section>{tab==='我的事项'?<PersonalWorkspace/>:<Coordination/>}</main><AgentPanel/></div>
}
