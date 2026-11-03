import { FigmaIcon as Icon } from './FigmaIcon'

export function CloudHeader() {
  return <header className="cloud-header">
    <div className="cloud-header-front">
      <button className="cloud-menu" aria-label="导航菜单"><Icon file="my-items/c7e79.svg" /></button>
      <span className="cloud-divider" />
      <button className="cloud-home"><Icon file="my-items/11fd8.svg" />工作台</button>
      <button className="cloud-more" aria-label="更多"><Icon file="my-items/b1dcd.svg" /></button>
    </div>
    <div className="cloud-actions">
      <button className="cloud-upgrade">升级</button>
      <label className="cloud-search"><input aria-label="搜索" placeholder="搜索" /><Icon file="my-items/7448c.svg" className="rotate-90" /></label>
      <button className="cloud-action-icon cloud-notice" aria-label="通知 2 条"><Icon file="my-items/d0aa0.svg" /><b>2</b></button>
      <span className="cloud-divider" />
      <div className="cloud-user"><span className="cloud-account">zxxxx<br />主账号</span><span className="cloud-avatar">Z</span></div>
    </div>
  </header>
}
const railGroups = [
  ['b92c2.svg'],
  ['41bdb.svg','5a3da.svg','74d58.svg','c753c.svg'],
  ['15661.svg','c0c7d.svg','717b6.svg','ea468.svg'],
  ['4b13d.svg'],
  ['b7435.svg','d143a.svg','a8250.svg'],
]
export function CloudRail() {
  return <aside className="cloud-rail" aria-label="产品导航">
    <div className="rail-product"><Icon file="my-items/28ab8.svg" /></div>
    <nav>{railGroups.map((group,index)=><div className="rail-group" key={index}>
      {index>0&&<div className="rail-separator"/>}
      {group.map((file,i)=><button key={file+i} aria-label={index===0?'工作台':`应用 ${index}-${i+1}`} className={index===0?'active':''}><Icon file={'my-items/'+file}/></button>)}
    </div>)}</nav>
    <button className="rail-bottom" aria-label="展开导航"><Icon file="my-items/d4d4f.svg"/></button>
  </aside>
}
