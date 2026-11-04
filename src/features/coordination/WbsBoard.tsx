import { taskTiming, timelinePosition } from './taskTiming'
import { createPortal } from 'react-dom'
import { FigmaIcon as Icon } from '../../components/FigmaIcon'
import { useEffect, useRef, useState } from 'react'
import './wbs.css'
import { ProjectBreakdownPrompt } from './ProjectBreakdownPrompt'
import { TaskAiBadge, TaskAiContent } from './TaskAiInsight'
import { Pencil, Check, X, Undo2, Plus } from 'lucide-react'
import type { Task } from './types'
import { DAYS } from './data'
const AVATAR_COLORS=['#9255ef','#3489ef','#20b47b','#586ced','#20ae9b','#20bbc9']
const avatarColor=(name:string)=>{
  const known=['林晓','陈宇','苏禾','王敏','赵晨','李悦'].indexOf(name)
  const index=known>=0?known:Array.from(name).reduce((sum,c)=>sum+c.charCodeAt(0),0)
  return {backgroundColor:AVATAR_COLORS[index%AVATAR_COLORS.length],color:'#fff',borderColor:'transparent'}
}

export function WbsBoard({ view, aiDraft, onCancelAi, editTarget, aiEditingIds, tasks: savedTasks, visibleIds, projects, projectMembers, onCommit }: {
  view:string; aiDraft:Task[]|null; onCancelAi:()=>void;
  editTarget:HTMLDivElement|null;
  aiEditingIds: string[];
  projectMembers: Record<string,string[]>;
  onCommit: (project: string, tasks: Task[], members:string[]) => void;
  tasks: Task[]; visibleIds: Set<string>; projects: string[];
  onCreate: (title: string, project: string, parent?: Task) => string;
  onUpdate: (task: Task) => void;
  onEdit: (task: Task) => void; onDelete: (task: Task) => void; onSelect: (id: string) => void;
}) {
  const [now,setNow]=useState(()=>new Date())
  useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(timer)},[])
  const [hoveredMember,setHoveredMember] = useState<string|null>(null)
  const memberHoverTimer = useRef<ReturnType<typeof setTimeout>|null>(null)
  const showMember=(name:string)=>{if(memberHoverTimer.current)clearTimeout(memberHoverTimer.current);setHoveredMember(name)}
  const hideMember=()=>{if(memberHoverTimer.current)clearTimeout(memberHoverTimer.current);memberHoverTimer.current=setTimeout(()=>setHoveredMember(null),160)}
  const [members, setMembers] = useState<string[]>([])
  const [addingMember,setAddingMember] = useState(false)
  const [memberName,setMemberName] = useState('')
  const [draggingMember,setDraggingMember] = useState<string|null>(null)
  const [dropTarget,setDropTarget] = useState<string|null>(null)
  const [editingProject, setEditingProject] = useState<string|null>(null)
  const [workingTasks, setWorkingTasks] = useState<Task[]|null>(null)
  const tasks=workingTasks??savedTasks
  const positionSnapshot=useRef<Record<string,{x:number;y:number}>>({})
  const beginEdit=(project:string)=>{
    if(editingProject&&editingProject!==project){setLinkMessage('请先保存或取消当前项目的修改');return false}
    if(!editingProject){setMembers([...new Set([...(projectMembers[project]||[]),...savedTasks.filter(t=>t.project===project).flatMap(t=>[...(t.owner==='待分配'?[]:[t.owner]),...t.participants])])].filter(Boolean));setAddingMember(false);positionSnapshot.current={...positions};setWorkingTasks(savedTasks.map(t=>({...t,deps:[...t.deps]})));setEditingProject(project);setLinkMessage('')}
    return true
  }
  const onCreate=(title:string,project:string,parent?:Task)=>{
    if(editingProject!==project)return '' 
    const id='task-'+crypto.randomUUID()
    setWorkingTasks(current=>[...(current??savedTasks),{id,title,project,parent:parent?.id,owner:parent?.owner??'林晓',participants:['林晓'],status:'待开始',start:0,end:parent?.end??0,deps:[]}])
    return id
  }
  const onDelete=(task:Task)=>{
    if(editingProject!==task.project)return
    const removed=new Set([task.id]);let added=true
    while(added){added=false;tasks.forEach(t=>{if(t.parent&&removed.has(t.parent)&&!removed.has(t.id)){removed.add(t.id);added=true}})}
    setWorkingTasks(tasks.filter(t=>!removed.has(t.id)).map(t=>({...t,deps:t.deps.filter(id=>!removed.has(id))})))
    setChanges(current=>Object.fromEntries(Object.entries(current).filter(([id])=>!removed.has(id)).map(([id,c])=>[id,{...c,deps:c.deps.filter(dep=>!removed.has(dep))}])))
    setSelectedId('')
  }
  const [editingId, setEditingId] = useState<string|null>(null)
  const [link, setLink] = useState<{id:string; x:number; y:number; startX:number; startY:number}|null>(null)
  const [linkMessage, setLinkMessage] = useState('')
  const [positions, setPositions] = useState<Record<string,{x:number;y:number}>>({})
  const drag = useRef<{id:string;x:number;y:number;px:number;py:number;start:number;end:number;moved:boolean}|null>(null)
  const skipClick = useRef(false)
  const [changes, setChanges] = useState<Record<string, Task>>({})
  const [saveError, setSaveError] = useState<{id:string;message:string}|null>(null)
  const stage = (task:Task) => {
    if(editingProject!==task.project)return
    setChanges(current=>({...current,[task.id]:task}))
  }
  const revert=(id:string)=>{
    setChanges(current=>{const next={...current};delete next[id];return next})
    const original=savedTasks.find(task=>task.id===id)
    if(original)setWorkingTasks(current=>current?.map(task=>task.id===id?original:task)??null)
    setMode(null);setSaveError(null)
  }
  useEffect(()=>{
    if(!aiDraft)return
    const changed=aiDraft.find(task=>JSON.stringify(task)!==JSON.stringify(savedTasks.find(old=>old.id===task.id)))
    if(!changed)return
    setWorkingTasks(aiDraft);setChanges({});setEditingProject(changed.project)
    setMembers([...new Set([...(projectMembers[changed.project]||[]),...aiDraft.filter(t=>t.project===changed.project).flatMap(t=>[...(t.owner==='待分配'?[]:[t.owner]),...t.participants])])].filter(Boolean))
    positionSnapshot.current={...positions}
    setSelectedId('')
  },[aiDraft])

  const finishEdit=(save:boolean)=>{
    if(save&&editingProject){
      const result=tasks.filter(t=>t.project===editingProject).map(t=>({...t,...changes[t.id]}))
      if(result.some(t=>!t.title.trim())){setLinkMessage('请填写所有任务名称后保存');return}
      const visiting=new Set<string>(),done=new Set<string>()
      const cycle=(id:string):boolean=>{if(visiting.has(id))return true;if(done.has(id))return false;visiting.add(id);const t=result.find(t=>t.id===id);if(t&&[...t.deps,...(t.parent?[t.parent]:[])].some(cycle))return true;visiting.delete(id);done.add(id);return false}
      if(result.some(t=>cycle(t.id))){setLinkMessage('依赖存在循环，请调整后保存');return}
      onCommit(editingProject,result.map(t=>({...t,title:t.title.trim()})),members)
    }else setPositions(positionSnapshot.current)
    onCancelAi()
    setAddingMember(false);setDraggingMember(null);setDropTarget(null);setWorkingTasks(null);setChanges({});setEditingProject(null);setEditingId(null);setMode(null);setDraft(null);setLinkMessage('');setLink(null)
  }
  useEffect(()=>{
    const id=aiEditingIds[0];if(!id)return
    const frame=requestAnimationFrame(()=>document.querySelector<HTMLElement>(`.wbs-node[data-wbs-node="${id}"]`)?.scrollIntoView({block:'nearest',inline:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}))
    return()=>cancelAnimationFrame(frame)
  },[aiDraft,aiEditingIds])
  const [mode, setMode] = useState<'dependencies' | null>(null)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [draft, setDraft] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const editor = (project: string, parent?: Task) => draft === (parent?.id ?? project) && <form className="wbs-editor" onSubmit={event => { event.preventDefault(); if(title.trim()) { onCreate(title.trim(), project, parent); setTitle('') } }}>
    <input autoFocus aria-label="新任务名称" placeholder="输入名称，Enter 连续添加" value={title} onChange={event=>setTitle(event.target.value)} />
    <button type="submit">添加</button><button type="button" onClick={()=>setDraft(null)}>完成</button>
  </form>
  return <div className={`wbs-board ${view==='gantt'?'task-timeline-board':''}`}>{projects.map(project => {
    const all = tasks.filter(t=>t.project===project).map(task=>({...task,...changes[task.id]}))
    const memberTasks=(name:string)=>{
      const index=members.indexOf(name)
      const current=all.filter(task=>task.owner===name&&task.status==='进行中')
      const baseline=savedTasks.filter(task=>task.project===project&&task.owner===name&&task.status==='进行中').length
      const extraCount=Math.max(0,([3,4,2,3,5][index]??baseline)-baseline)
      const examples:Record<string,string[]>={
        '林晓':['支付异常场景梳理','需求验收标准补充','产品评审意见整理'],
        '陈宇':['支付接口错误码整理','回调重试机制联调','接口文档补充','支付日志排查'],
        '王敏':['支付流程埋点核对','用户反馈归纳'],
        '苏禾':['支付结果页设计','异常提示样式完善','设计资产整理'],
        '赵晨':['支付组件开发','移动端适配','支付状态轮询优化','前端异常监控接入','联调问题修复']
      }
      return [...current,...Array.from({length:extraCount},(_,i)=>({id:'preview-'+name+'-'+i,title:(examples[name]??['验收用例整理','回归问题核对','测试环境检查','发布检查清单','验收报告更新'])[i],end:Math.min(3+i,DAYS.length-1)}))]
    }
    const included = new Set([...visibleIds,...tasks.filter(t=>!savedTasks.some(old=>old.id===t.id)).map(t=>t.id)])
    const include = (id:string, seen=new Set<string>()) => {
      if(seen.has(id)) return; seen.add(id)
      const t=all.find(t=>t.id===id); if(!t) return
      included.add(id); [...t.deps,...(t.parent?[t.parent]:[])].forEach(id=>include(id,seen))
    }
    visibleIds.forEach(id=>include(id))
    const source=all.filter(t=>included.has(t.id))
    const levels=new Map<string,number>()
    const level=(t:Task, trail=new Set<string>()):number=>{
      if(levels.has(t.id)) return levels.get(t.id)!
      if(trail.has(t.id)) return 0
      const next=new Set(trail).add(t.id)
      const parents=[...t.deps,...(t.parent?[t.parent]:[])].map(id=>source.find(t=>t.id===id)).filter((t):t is Task=>!!t)
      const result=parents.length?1+Math.max(...parents.map(t=>level(t,next))):0
      levels.set(t.id,result); return result
    }
    source.forEach(t=>level(t))
    const roots=source.filter(task=>!source.some(parent=>parent.id===task.parent))
    const rootOf=(task:Task,seen=new Set<string>()):Task=>{
      if(!task.parent||seen.has(task.id))return task
      seen.add(task.id);const parent=source.find(t=>t.id===task.parent)
      return parent?rootOf(parent,seen):task
    }
    const groups=roots.map(root=>({root,members:source.filter(task=>rootOf(task).id===root.id)}))
    const groupLevels=new Map<string,number>()
    const groupLevel=(id:string,seen=new Set<string>()):number=>{
      if(groupLevels.has(id))return groupLevels.get(id)!
      if(seen.has(id))return 0
      const group=groups.find(g=>g.root.id===id);if(!group)return 0
      const next=new Set(seen).add(id)
      const deps=group.members.flatMap(t=>t.deps).map(dep=>source.find(t=>t.id===dep)).filter((t):t is Task=>!!t).map(t=>rootOf(t).id).filter(root=>root!==id)
      const result=deps.length?Math.max(...deps.map(dep=>groupLevel(dep,next)))+1:0
      groupLevels.set(id,result);return result
    }
    groups.forEach(g=>groupLevel(g.root.id))
    const nodes:Array<{task:Task;x:number;y:number;code:string}>=[]
    const columnY=new Map<number,number>()
    const columnWidths=new Map<number,number>()
    const depth=(task:Task,seen=new Set<string>()):number=>{
      if(!task.parent||seen.has(task.id))return 0
      seen.add(task.id);const parent=source.find(t=>t.id===task.parent)
      return parent?depth(parent,seen)+1:0
    }
    groups.forEach(g=>{const col=groupLevels.get(g.root.id)!;columnWidths.set(col,Math.max(columnWidths.get(col)||300,Math.max(...g.members.map(t=>depth(t)))*220+300))})
    groups.forEach((group,index)=>{
      const col=groupLevels.get(group.root.id)!
      const left=40+Array.from({length:col},(_,i)=>columnWidths.get(i)||300).reduce((a,b)=>a+b,0)
      const top=columnY.get(col)||80
      let row=0
      const place=(task:Task,code:string,d:number)=>{
        const node={task,x:positions[task.id]?.x??left+d*220,y:positions[task.id]?.y??top+row*76,code}
        nodes.push(node);row++
        source.filter(t=>t.parent===task.id).forEach((child,i)=>place(child,code+'.'+(i+1),d+1))
      }
      place(group.root,String(index+1),0)
      columnY.set(col,top+Math.max(row*76,100)+80)
    })
    const dayWidth=100,timelineLeft=300
    const currentTimelinePosition=timelinePosition(now)
    const currentDayEnd=Math.min(DAYS.length,Math.floor(currentTimelinePosition)+1)
    const capsuleWidth=(task:Task)=>{
      const timing=taskTiming(task,now)
      const actualEnd=task.status==='已完成'?timing.actual:(task.status==='进行中'||timing.overdue)?timing.current:undefined
      // Editing previews the schedule being changed; the normal view reflects actual progress.
      const endpoint=editingProject===project||actualEnd===undefined?task.end+1:Math.floor(actualEnd)+1
      const duration=Math.max(1,Math.min(DAYS.length,endpoint)-task.start)
      return duration*dayWidth-8
    }

    if(view==='gantt')nodes.forEach((node,index)=>{node.x=timelineLeft+node.task.start*dayWidth+4;node.y=54+index*60})
    const height=view==='gantt'
      ?Math.max(617,...nodes.map(n=>n.y+60))
      :Math.max(400,...nodes.map(n=>n.y+380))
    const width=view==='gantt'?timelineLeft+DAYS.length*dayWidth:Math.max(760,...nodes.map(n=>n.x+480))
    const selected=source.find(t=>t.id===selectedId)
    const children=selected?all.filter(t=>t.parent===selected.id):[]
    const isUnpublishedProject=editingProject===project&&!savedTasks.some(task=>task.project===project)
    return <section key={project} className={editingProject===project?'wbs-project-editing':undefined}>
      {editTarget&&createPortal(<div className="wbs-project-actions">{projects.length>1&&<span>{project}</span>}
        {editingProject!==project&&<button disabled={!!editingProject} onClick={()=>beginEdit(project)}><Pencil size={14}/>编辑</button>}
      </div>,editTarget)}
      <div className="wbs-legend-row"><div className="wbs-legend">浅灰分组＋分叉线：任务拆解　　流动虚线：前置任务 → 后续任务</div>
      {editingProject===project && <div className="wbs-people-bar">
        <button className="wbs-add-task" onClick={()=>{setDraft(project);setTitle('')}}><Plus size={14}/>添加任务</button>
        <div className="wbs-people-list">{members.map(name=>{
          const count=memberTasks(name).length
          return <div className="wbs-person" key={name} onMouseEnter={()=>showMember(name)} onMouseLeave={hideMember} onFocus={()=>showMember(name)} onBlur={hideMember}>
            <button draggable onDragStart={event=>{setHoveredMember(null);event.dataTransfer.setData('application/x-wbs-person',name);event.dataTransfer.effectAllowed='copy';setDraggingMember(name)}} onDragEnd={()=>{setDraggingMember(null);setDropTarget(null)}} aria-label={'拖动分配 '+name} className="wbs-person-avatar" style={avatarColor(name)}>{name.slice(-2)}<span className="wbs-person-count">{count}</span></button>
          </div>
        })}<button className="wbs-add-member" onClick={()=>{setHoveredMember(null);setAddingMember(value=>!value)}} aria-label="添加项目人员"><Plus size={16}/><span>添加</span></button></div>
        {hoveredMember&&!draggingMember&&!addingMember&&<div className="wbs-person-tasks" role="tooltip" aria-label={hoveredMember+'的进行中任务'} onMouseEnter={()=>showMember(hoveredMember)} onMouseLeave={hideMember}>
          <header><strong>{hoveredMember}</strong><span>进行中 · {memberTasks(hoveredMember).length}</span></header>
          <div className="wbs-person-task-list">{memberTasks(hoveredMember).map(task=><div className="wbs-person-task" key={task.id}><span>{task.title}</span><small>{DAYS[task.end]} 截止</small></div>)}</div>
          {!memberTasks(hoveredMember).length&&<p>暂无进行中的任务</p>}
        </div>}
        {addingMember&&<div className="wbs-member-popover" role="dialog" aria-label="添加项目人员">
          <input aria-label="搜索或输入人员姓名" placeholder="搜索或输入姓名" value={memberName} onChange={event=>setMemberName(event.target.value)} autoFocus onKeyDown={event=>{if(event.key==='Escape')setAddingMember(false)}}/>
          <div className="wbs-member-options">{[...new Set(savedTasks.flatMap(task=>[task.owner,...task.participants]))].filter(name=>name&&!members.includes(name)&&name.includes(memberName.trim())).map(name=><button key={name} onClick={()=>{setMembers(current=>[...current,name]);setMemberName('');setAddingMember(false)}}><span className="wbs-member-mini" style={avatarColor(name)}>{name.slice(-2)}</span>{name}<Plus size={12}/></button>)}</div>
          {memberName.trim()&&!members.includes(memberName.trim())&&<button className="wbs-member-create" onClick={()=>{setMembers(current=>[...current,memberName.trim()]);setMemberName('');setAddingMember(false)}}><Plus size={12}/>添加“{memberName.trim()}”</button>}
          {!memberName.trim()&&savedTasks.flatMap(task=>[task.owner,...task.participants]).every(name=>!name||members.includes(name))&&<small>输入姓名添加人员</small>}
        </div>}

      </div>}
      </div>

      <div className={`wbs-content ${selected ? 'has-selection' : ''}`} inert={aiEditingIds.length>0}>
      {!all.length && !draft && <ProjectBreakdownPrompt key={project} project={project}/>}
      <div className="wbs-graph-scroll"><div className="wbs-graph" style={{width:view==='gantt'?width:Math.max(width,...nodes.map(n=>n.x+480)),height}} onClick={event=>{if(event.target===event.currentTarget){setSelectedId('');setMode(null)}}}>
        {draft === project && <div className="wbs-canvas-create">{editor(project)}</div>}
        {linkMessage && <div className="wbs-link-message" role="status">{linkMessage}</div>}
        {groups.filter(group=>view!=='gantt'&&group.members.length>1).map(group=>{
          const members=nodes.filter(n=>group.members.some(t=>t.id===n.task.id))
          const left=Math.min(...members.map(n=>n.x))-18,top=Math.min(...members.map(n=>n.y))-34
          return <div key={group.root.id} className="wbs-task-group" style={{left,top,width:Math.max(...members.map(n=>n.x+174))-left+24,height:Math.max(...members.map(n=>n.y+40))-top+26}}><span>{group.root.title} · 任务拆解</span></div>
        })}
        <svg className="wbs-edges" style={{opacity:view==='gantt'?.4:1}} width={view==='gantt'?width:Math.max(width,...nodes.map(n=>n.x+480))} height={height} >
          <defs><marker id="wbs-dependency-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M 0 0 L 7 3.5 L 0 7 Z" className="wbs-arrow-head"/></marker></defs>
          {link && <path className="wbs-link-preview" d={`M ${link.startX} ${link.startY} C ${link.startX+Math.max(60,Math.abs(link.x-link.startX)*0.45)} ${link.startY}, ${link.x-Math.max(60,Math.abs(link.x-link.startX)*0.45)} ${link.y}, ${link.x} ${link.y}`} />}
          {nodes.flatMap(node=>[...node.task.deps.map(id=>({id,hierarchy:false})),...(node.task.parent?[{id:node.task.parent,hierarchy:true}]:[])].map(edge=>{
            const from=nodes.find(n=>n.task.id===edge.id); if(!from) return null
            const x=from.x+(view==='gantt'?capsuleWidth(from.task):174),y=from.y+17,bend=(x+node.x)/2
            return <path className={edge.hierarchy?'wbs-hierarchy-edge':'wbs-dependency-edge'} key={edge.id+node.task.id+edge.hierarchy} d={edge.hierarchy?`M ${x} ${y} H ${x+22} V ${node.y+17} H ${node.x}`:`M ${x} ${y} C ${bend} ${y}, ${bend} ${node.y+17}, ${node.x-3} ${node.y+17}`} ><title>{edge.hierarchy?`${node.task.title} 是 ${from.task.title} 的子任务`:`${node.task.title} 依赖 ${from.task.title}`}</title></path>
          }))}
        </svg>
        {view==='gantt'&&<><div className="task-timeline-head" style={{width}}><div className="task-timeline-meta-head"><span>项目 / 任务<Icon file="54457.svg"/></span><span>负责人<Icon file="54457.svg"/></span></div>{DAYS.map(day=><span key={day}>{day}</span>)}</div>{nodes.map(({task,y})=><div key={task.id} className="task-timeline-row" style={{top:y-13,width,height:60}}><div className="task-timeline-meta"><div className={`task-timeline-name ${task.parent?'is-child':''}`}><span className="console-tag">{task.status}</span><button title={task.title} onClick={()=>setSelectedId(task.id)}>{task.parent?'└ ':''}{task.title}</button></div><span className="task-timeline-owner"><i className="owner-avatar" style={avatarColor(task.owner)}>{task.owner.slice(-2)}</i>{task.owner}</span></div>{editingProject===project&&<button className="task-row-insert" title="在此处增加任务行" aria-label={'在'+task.title+'后添加任务'} onClick={()=>{
 const id='task-'+crypto.randomUUID()
 const newTask:Task={id,title:'新任务',project,parent:task.parent,owner:task.owner,participants:['林晓'],status:'待开始',start:task.start,end:task.end,deps:[]}
 setWorkingTasks(current=>{const next=[...(current??savedTasks)];const index=next.findIndex(item=>item.id===task.id);next.splice(index+1,0,newTask);return next})
 setSelectedId(id);setEditingId(id);setMode(null)
 }}><Plus size={14}/></button>}</div>)}</>}

        {view==='gantt'&&currentTimelinePosition>=0&&currentTimelinePosition<DAYS.length&&<div className="gantt-now-line" style={{left:timelineLeft+currentDayEnd*dayWidth-4,height}}><span>当前 {new Intl.DateTimeFormat('zh-CN',{timeZone:'Europe/Stockholm',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now)}</span></div>}
        {nodes.map(({task,x,y,code})=>{const timing=taskTiming(task,now);const nodeWidth=view==='gantt'?capsuleWidth(task):174;const lateFill=view==='gantt'&&timing.late&&editingProject!==project&&!isUnpublishedProject;const plannedWidth=Math.max(0,Math.min(nodeWidth,((task.baselineEnd??task.end)+1-task.start)*dayWidth-4));const nodeColor=isUnpublishedProject?(task.status==='已完成'?'complete':task.status==='进行中'?'progress':'idle'):timing.color;return <div key={task.id}>
          <TaskAiBadge task={task} tasks={all} style={{left:x+nodeWidth+8,top:y+4}} onSelect={()=>{setSelectedId(task.id);setMode(null)}}/>
          <button data-wbs-node={task.id} onDragOver={event=>{if(editingProject===project&&draggingMember){event.preventDefault();event.dataTransfer.dropEffect='copy';setDropTarget(task.id)}}} onDragLeave={()=>setDropTarget(null)} onDrop={event=>{event.preventDefault();const name=event.dataTransfer.getData('application/x-wbs-person');if(editingProject!==project||!members.includes(name))return;stage({...task,owner:name});setDropTarget(null);setDraggingMember(null);setSelectedId(task.id)}} className={`wbs-node ${lateFill?'has-overdue-segment':''} ${aiEditingIds.includes(task.id)?'is-ai-editing':''} ${task.aiChange?'is-ai-adjusted':''} ${dropTarget===task.id?'is-person-target':''} ${editingProject===project?'is-editable':'is-readonly'} ${task.parent?'is-child':''} ${selected?.id===task.id?'is-selected':''}`} style={{left:x,top:y,width:nodeWidth,...(lateFill?{background:`linear-gradient(to right, #fff 0px, #fff ${plannedWidth}px, rgba(220,82,82,.07) ${plannedWidth}px)`}:{})}} onPointerDown={event=>{
            if(event.button!==0||editingProject!==project)return
            event.preventDefault()
            drag.current={id:task.id,x:event.clientX,y:event.clientY,px:x,py:y,start:task.start,end:task.end,moved:false}
            event.currentTarget.setPointerCapture(event.pointerId)
          }} onPointerMove={event=>{
            const current=drag.current;if(!current||current.id!==task.id)return
            const graph=event.currentTarget.closest('.wbs-graph') as HTMLElement
            const scale=graph.getBoundingClientRect().width/graph.offsetWidth
            const dx=(event.clientX-current.x)/scale,dy=(event.clientY-current.y)/scale
            if(Math.abs(dx)+Math.abs(dy)>4)current.moved=true
            if(current.moved&&view==='gantt'){
              const start=Math.max(0,Math.min(DAYS.length-1-(current.end-current.start),current.start+Math.round(dx/dayWidth)))
              stage({...task,start,end:start+current.end-current.start})
            }
            if(current.moved&&view!=='gantt')setPositions(old=>({...old,[task.id]:{x:Math.max(16,current.px+dx),y:Math.max(16,current.py+dy)}}))
          }} onPointerUp={()=>{skipClick.current=!!drag.current?.moved;drag.current=null;setSelectedId(task.id)}} onPointerCancel={()=>{drag.current=null}}
          onDoubleClick={()=>{if(editingProject===project){setEditingId(task.id);setMode(null)}}} onClick={()=>{if(skipClick.current){skipClick.current=false;return}setSelectedId(task.id);setDraft(null);setMode(null);setError('')}} title={lateFill?`原计划截止 ${DAYS[timing.end]} · 浅红区域为超期部分 · ${task.status==='已完成'?'实际完成':'截至当前'} ${new Intl.DateTimeFormat('zh-CN',{timeZone:'Europe/Stockholm',month:'2-digit',day:'2-digit'}).format(task.completedAt?new Date(task.completedAt):now)}`:editingProject===project?(view==='gantt'?'拖动调整排期，双击修改名称':task.title):'点击查看任务；先点击编辑即可调整排期'} aria-pressed={selected?.id===task.id}>{lateFill&&plannedWidth>0&&plannedWidth<nodeWidth&&<i className="gantt-original-deadline" style={{left:plannedWidth}} title={`原定 ${DAYS[timing.end]} 完成，已超期 ${Math.max(1,Math.ceil(timing.comparison!-(timing.end+1)))} 天`} aria-label={`原计划截止 ${DAYS[timing.end]}`}/>}{lateFill&&<small className="gantt-overdue-label" style={{left:plannedWidth+8,maxWidth:Math.max(0,nodeWidth-plannedWidth-40)}}>逾期{Math.max(1,Math.ceil(timing.comparison!-(timing.end+1)))}天</small>}<span className={`wbs-dot is-${nodeColor}`} title={isUnpublishedProject?'未发布':timing.overdue?'已逾期':task.status}/><span className="wbs-task-label" style={{visibility:editingId===task.id?'hidden':undefined,...(lateFill?{maxWidth:Math.max(0,plannedWidth-40)}:{})}}>{task.parent?<><small className="wbs-node-code">{code}</small>{task.title}</>:task.title}</span><span className="wbs-node-owner" style={avatarColor(task.owner)} title={task.owner}>{task.owner.slice(-2)}</span></button>
          {view==='gantt'&&editingProject===project&&(['start','end'] as const).map(edge=><span key={edge} className="task-timeline-resize" style={{left:edge==='start'?x-2:x+nodeWidth-10,top:y}} aria-label={edge==='start'?'调整起点':'调整终点'} onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();event.stopPropagation();event.currentTarget.setPointerCapture(event.pointerId);drag.current={id:task.id,x:event.clientX,y:event.clientY,px:x,py:y,start:task.start,end:task.end,moved:false}}} onPointerMove={event=>{const current=drag.current;if(!current)return;if(current.id!==task.id)return;const graph=event.currentTarget.closest('.wbs-graph') as HTMLElement;const scale=graph.getBoundingClientRect().width/graph.offsetWidth;const delta=Math.round((event.clientX-current.x)/(dayWidth*scale));stage({...task,start:edge==='start'?Math.max(0,Math.min(current.end,current.start+delta)):current.start,end:edge==='end'?Math.min(DAYS.length-1,Math.max(current.start,current.end+delta)):current.end})}} onPointerUp={()=>{drag.current=null;setSelectedId(task.id)}} onPointerCancel={()=>{drag.current=null}}/>)}
          {editingId===task.id && <input className="wbs-inline-name" style={{left:x+33,top:y+2}} autoFocus aria-label="节点名称" value={task.title} onFocus={event=>{const input=event.currentTarget;input.setSelectionRange(input.value.length,input.value.length)}} onChange={event=>stage({...task,title:event.target.value})} onPointerDown={event=>event.stopPropagation()} onKeyDown={event=>{if(event.key==='Enter')setEditingId(null);if(event.key==='Escape'){revert(task.id);setEditingId(null)}}} onBlur={()=>setEditingId(null)} />}
          {editingProject===project && <><button className="wbs-quick-add" style={{left:x+nodeWidth+6,top:y-22}} aria-label={'为'+task.title+'创建子任务'} title="创建子任务" onClick={()=>{
            const id=onCreate('新子任务',project,task);if(!id)return
            
            setSelectedId(id);setEditingId(id);setMode(null);setError('')
          }}>＋</button>
          <button className="wbs-link-port" data-wbs-node={task.id} style={{left:x+nodeWidth-4,top:y+14}} aria-label={'从'+task.title+'拖动建立前置依赖'} title="拖到另一任务，将其设为本任务的前置依赖"
            onPointerDown={event=>{
              if(event.button!==0||editingProject!==project)return
              event.preventDefault();event.stopPropagation()
              event.currentTarget.setPointerCapture(event.pointerId)
              setLinkMessage('');setLink({id:task.id,x:x+nodeWidth,y:y+17,startX:x+nodeWidth,startY:y+17})
            }}
            onPointerMove={event=>{
              if(!link||link.id!==task.id)return
              const bounds=event.currentTarget.closest('.wbs-graph')!.getBoundingClientRect()
              setLink({...link,x:event.clientX-bounds.left,y:event.clientY-bounds.top})
            }}
            onPointerUp={event=>{
              if(!link)return
              const targetElement=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-wbs-node]')
              const targetId=targetElement?.getAttribute('data-wbs-node')
              setLink(null)
              if(!targetId)return
              if(targetId===task.id){setLinkMessage('不能依赖自身');return}
              if(task.deps.includes(targetId)){setLinkMessage('该依赖已存在');return}
              const reaches=(id:string,seen=new Set<string>()):boolean=>{
                if(id===task.id)return true
                if(seen.has(id))return false
                seen.add(id);const other=all.find(t=>t.id===id)
                return !!other&&[...other.deps,...(other.parent?[other.parent]:[])].some(parent=>reaches(parent,seen))
              }
              if(reaches(targetId)){setLinkMessage('无法建立连线：该依赖会形成循环');return}
              stage({...task,deps:[...task.deps,targetId]});setSelectedId(task.id);setMode(null)
              setLinkMessage('依赖已预览，完成后在筛选栏保存修改')
            }}
            onPointerCancel={()=>setLink(null)}
          />
          </>}
          {editingProject===project && selected?.id===task.id && (changes[task.id] || JSON.stringify(task)!==JSON.stringify(savedTasks.find(old=>old.id===task.id)) || positions[task.id]!==positionSnapshot.current[task.id]) && <div className="wbs-node-save" style={{left:x+nodeWidth+10,top:y+6}}>
            <button aria-label={'撤回节点修改：'+task.title} onClick={()=>{revert(task.id);setEditingId(null);setPositions(old=>{const next={...old};if(positionSnapshot.current[task.id])next[task.id]=positionSnapshot.current[task.id];else delete next[task.id];return next})}}><Undo2 size={13}/>撤销</button>
            {saveError?.id===task.id&&<p role="alert">{saveError.message}</p>}
          </div>}
          {editingProject===project && selected?.id===task.id && <div className="wbs-node-tools" style={{left:x,top:y+42}}>
            <div className="wbs-node-actions">
              <button onClick={()=>{if(editingProject===project){setMode('dependencies');setError('')}}}>依赖</button>
              <button className="wbs-delete" onClick={()=>onDelete(task)}>删除</button>
            </div>
            {mode==='dependencies' && <div className="wbs-node-popover">
              <strong>选择前置任务</strong>
              <div className="wbs-dependency-options">{all.filter(item=>item.id!==task.id).map(item=>{
                const reaches=(id:string,seen=new Set<string>()):boolean=>{
                  if(id===task.id)return true
                  if(seen.has(id))return false
                  seen.add(id);const other=all.find(t=>t.id===id)
                  return !!other&&[...other.deps,...(other.parent?[other.parent]:[])].some(parent=>reaches(parent,seen))
                }
                const checked=task.deps.includes(item.id)
                const disabled=!checked&&reaches(item.id)
                const reason=disabled?'该任务已通过依赖或拆分关系位于当前任务之后，设为前置任务会形成循环。':undefined
                return <label key={item.id} className={disabled?'is-disabled':undefined} title={reason} tabIndex={disabled?0:undefined}>
                  <input type="checkbox" disabled={disabled} checked={checked} aria-label={item.title} aria-description={reason} onChange={event=>{
                    const deps=event.target.checked?[...task.deps,item.id]:task.deps.filter(id=>id!==item.id)
                    setError('');stage({...task,deps})
                  }}/><span>{item.title}</span>
                </label>
              })}</div>
              {error&&<p role="alert">{error}</p>}
            </div>}
          </div>}
        </div>})}
        {!!all.length&&!source.length&&<p className="wbs-empty">暂无任务，点击“添加任务”开始拆解</p>}
      </div></div>
      {selected&&<section className="wbs-detail" aria-label="节点信息">
        <header className="wbs-detail-header">
          <h3>{selected.title}</h3>
          <div><small>负责人</small><span>{selected.owner}</span></div>
          <div><small>状态</small><span>{selected.status}</span></div>
          <div><small>排期</small><span>{DAYS[selected.start]} — {DAYS[selected.end]}</span></div>
        </header>
        <div className="wbs-detail-body">
          <div className="wbs-info-group"><span className="wbs-info-label">前置任务</span><div>{selected.deps.length?selected.deps.map(id=><p key={id}>{all.find(t=>t.id===id)?.title??'未找到任务'}</p>):<p>无</p>}</div></div>
          <div className="wbs-info-group"><span className="wbs-info-label">子任务 · {children.length}</span><div>{children.length?children.map(child=><p key={child.id}>{child.title}</p>):<p>无</p>}</div></div>
        </div>
        <TaskAiContent task={selected} tasks={all}/>
      </section>}
      </div>
      {editingProject===project&&<footer className="wbs-project-submitbar">
        <div className="wbs-project-actions"><button className="wbs-save-all" onClick={()=>finishEdit(true)}><Check size={14}/>{isUnpublishedProject?'发布项目':'保存修改'}</button><button onClick={()=>finishEdit(false)}><X size={14}/>取消</button></div>
      </footer>}
    </section>
  })}</div>
}
