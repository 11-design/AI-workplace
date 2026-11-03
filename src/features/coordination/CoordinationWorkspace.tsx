import { ProjectMaterials, saveMaterials } from './ProjectMaterials'
import type { ProjectMaterial } from './ProjectMaterials'
import { WorkActivity } from '../../components/WorkActivity'
import { useEffect, useState } from 'react'
import { WbsBoard } from './WbsBoard'
import { TaskAiBadge, TaskAiContent } from './TaskAiInsight'
import { DAYS } from './data'
import type { DialogMode, Task, TaskStatus } from './types'
import { useCoordination } from './useCoordination'
import { FigmaIcon as Icon } from '../../components/FigmaIcon'
const STATUSES: TaskStatus[] = ['待开始', '进行中', '已完成', '挂起']

function Button({ children, onClick, primary = false }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return <button onClick={onClick} className={`console-btn ${primary ? 'console-btn-primary' : ''}`}>{children}</button>
}

function getRows(tasks: Task[], project: string) {
  const source = tasks.filter((task) => task.project === project)
  const rows: Task[] = []
  const walk = (parent?: string) => source.filter((task) => task.parent === parent).forEach((task) => { rows.push(task); walk(task.id) })
  walk()
  return rows
}

function TaskDialog({ mode, projects, project, tasks, editing, parentPreset, onClose, onProject, onTask, onUpdate }: { mode: Exclude<DialogMode, null>; projects: string[]; project: string; tasks: Task[]; editing?: Task | null; parentPreset?: string; onClose: () => void; onProject: (name: string) => void; onTask: (task: Pick<Task, 'title' | 'owner' | 'parent' | 'deps' | 'end'>) => void; onUpdate: (id: string, task: Pick<Task, 'title' | 'owner' | 'parent' | 'deps' | 'end'>) => void }) {
  const [title, setTitle] = useState(editing?.title ?? '')
  const [owner, setOwner] = useState(editing?.owner ?? '林晓')
  const [parent, setParent] = useState(editing?.parent ?? parentPreset ?? '')
  const [dependency, setDependency] = useState(editing?.deps[0] ?? '')
  const [end, setEnd] = useState(editing?.end ?? 2)
  const [error, setError] = useState('')
  const [files,setFiles]=useState<File[]>([])
  const [linked,setLinked]=useState<ProjectMaterial[]>([])
  const [saving,setSaving]=useState(false)
  const submit = async () => {
    if(saving)return
    if (!title.trim()) return setError('请输入名称')
    if (mode === 'project') {
      if(projects.includes(title.trim()))return setError('项目名称已存在')
      setSaving(true)
      try { await saveMaterials(title.trim(),files,linked);onProject(title.trim()) }
      catch { setSaving(false);setError('资料保存失败，请重试');return }
    }
    else if (editing) onUpdate(editing.id, { title: title.trim(), owner, parent: parent || undefined, deps: dependency ? [dependency] : [], end })
    else onTask({ title: title.trim(), owner, parent: parent || undefined, deps: dependency ? [dependency] : [], end })
    onClose()
  }
  const target = project === '全部项目' ? projects[0] : project
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/25 p-6">
    <section role="dialog" aria-modal="true" className="console-panel project-create-dialog w-full max-w-[480px] space-y-5 p-6">
      <h2 className="text-lg font-semibold">{mode === 'project' ? '创建项目' : editing ? '编辑任务' : parentPreset ? '添加子任务' : '添加任务'}</h2>
      <label className="project-name-field"><span className="font-medium">{mode==='project'?'项目名称':'名称'}{mode==='project'&&<span className="project-required" aria-hidden="true"> *</span>}</span><input required={mode==='project'} aria-required={mode==='project'} autoFocus className="h-9 w-full rounded-md border border-line px-3" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      {mode === 'project' && <ProjectMaterials files={files} linked={linked} onFiles={setFiles} onLinked={setLinked}/>}
      {mode === 'task' && <div className="grid grid-cols-2 gap-4">
        <p className="col-span-2 text-black/50">所属项目：{target}</p>
        <label className="space-y-2"><span className="block font-medium">负责人</span><input className="h-9 w-full rounded-md border border-line px-3" value={owner} onChange={(event) => setOwner(event.target.value)} /></label>
        <label className="space-y-2"><span className="block font-medium">截止日期</span><select className="h-9 w-full rounded-md border border-line px-3" value={end} onChange={(event) => setEnd(Number(event.target.value))}>{DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>
        <label className="space-y-2"><span className="block font-medium">父任务</span><select className="h-9 w-full rounded-md border border-line px-3" value={parent} onChange={(event) => setParent(event.target.value)}><option value="">无</option>{tasks.filter((task) => task.project === target).map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label>
        <label className="space-y-2"><span className="block font-medium">前置依赖</span><select className="h-9 w-full rounded-md border border-line px-3" value={dependency} onChange={(event) => setDependency(event.target.value)}><option value="">无</option>{tasks.map((task) => <option key={task.id} value={task.id}>{task.project} / {task.title}</option>)}</select></label>
      </div>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="flex justify-end gap-2"><Button onClick={onClose}>取消</Button><Button primary onClick={submit}>{saving?'创建中…':editing ? '保存' : '创建'}</Button></div>
    </section>
  </div>
}

export default function CoordinationWorkspace() {
  const state = useCoordination()
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [statusFilter, setStatusFilter] = useState('全部')
  const [editTarget,setEditTarget]=useState<HTMLDivElement|null>(null)
  const [boardView, setBoardView] = useState('gantt')
  useEffect(()=>{if(state.aiRunning&&state.aiActivity.includes('拆解')){setBoardView('wbs');setStatusFilter('全部')}},[state.aiRunning,state.aiActivity])
  const [showAdvice, setShowAdvice] = useState(false)
  const filteredTasks = state.tasks.filter(task => statusFilter === '全部' || task.status === statusFilter)
  const [parentPreset, setParentPreset] = useState<string | undefined>()
  const openTaskDialog = (editing?: Task, parent?: string) => { setEditingTask(editing ?? null); setParentPreset(parent); state.setDialog('task') }
  const closeTaskDialog = () => { setEditingTask(null); setParentPreset(undefined); state.setDialog(null) }
  return <>
    <div className="coordination-workspace">
      <section aria-busy={state.aiRunning} className={`coordination-main ${state.aiRunning ? 'ai-is-running' : ''} ${boardView === 'wbs' ? 'coordination-list-view' : ''}`}>
        <header className="coordination-section-title">
          <div className="coordination-heading"><Icon file="04c60.svg" className="rotate-90" /><h2>项目计划与协调事项</h2>{state.aiRunning&&<span role="status" className="ai-running-label">{state.aiActivity}</span>}<p>层级表示工作组成 · 时间条表示周期 · 连线语义由依赖字段记录</p></div>
          <div className="coordination-toolbar">
            <button className="suggestion-pill" onClick={() => setShowAdvice(!showAdvice)}><Icon file="suggestion.png" />处理建议<span>按照变动重新调整任务安排</span></button>
            <Button primary onClick={() => state.setDialog('project')}>＋ 创建项目</Button>
          </div>
        </header>
        {showAdvice && <div className="coordination-advice">当前有 {state.pendingCount} 条待确认动态。请先确认来源与变更内容，再调整关联任务的排期。<button onClick={() => { state.setOnlyPending(true); setShowAdvice(false) }}>查看待确认动态</button></div>}
        <div className="coordination-plan-card">
        <div className="coordination-filters" inert={state.aiRunning}>
          <label className="coordination-project-label" htmlFor="coordination-project">项目</label>
          <div className="coordination-select"><select id="coordination-project" value={state.project} onChange={event => { state.setProject(event.target.value); state.selectTask(null) }}><option>全部项目</option>{state.projects.map(item => <option key={item}>{item}</option>)}</select><Icon file="66e18.svg" /></div>
          <div className="coordination-status-filters" role="group" aria-label="事项状态">{['全部','待开始','进行中','已完成','挂起'].map(item => <button key={item} onClick={() => setStatusFilter(item)} className={`status-filter ${statusFilter===item?'active':''}`}>{item}</button>)}</div>
          <div ref={setEditTarget} className="wbs-project-actions coordination-edit-actions"/>
          <div className="coordination-view-toggle"><button title="甘特视图" className={boardView==='gantt'?'active':''} onClick={() => setBoardView('gantt')}><Icon file="f71ba.svg" /></button><button title="WBS 任务拆解" className={boardView==='wbs'?'active':''} onClick={() => setBoardView('wbs')}><Icon file="fff00.svg" /></button></div>
        </div>
        <WbsBoard view={boardView} aiDraft={state.aiDraft} onCancelAi={state.cancelAiDraft} editTarget={editTarget} aiEditingIds={state.aiEditingIds} projectMembers={state.projectMembers} onCommit={state.commitProject} onUpdate={task => state.updateTask(task.id, task)} tasks={state.tasks} visibleIds={new Set(filteredTasks.map(task => task.id))} projects={state.visibleProjects} onCreate={(title, project, parent) => state.createTask({ title, project, parent: parent?.id, owner: parent?.owner || '林晓', end: parent?.end ?? 0, deps: [] })} onEdit={task => openTaskDialog(task)} onDelete={task => { if (window.confirm('删除此任务及全部子任务？')) state.deleteTask(task.id) }} onSelect={id => { state.selectTask(id); state.setDrawerOpen(true) }} />
        </div>
        {state.selected && <footer className="flex items-center justify-between border-t border-line-soft bg-zinc-50 px-5 py-3"><span>已选择 <strong>{state.selected.title}</strong> · 动态已同步筛选</span><div className="flex gap-4"><button onClick={() => state.setDrawerOpen(true)}>打开详情</button><button onClick={() => state.selectTask(null)} className="text-black/50">取消选择</button></div></footer>}
      </section>
      <WorkActivity count={8} onOpen={title=>{if(title==='支付体验改版'){state.setProject(title);return}const task=state.tasks.find(item=>item.title===title);if(task){state.selectTask(task.id);state.setDrawerOpen(true)}}}/>
    </div>
    {state.drawerOpen && state.selected && <div className="fixed inset-0 z-40 bg-black/25" onClick={() => state.setDrawerOpen(false)}><aside className="absolute inset-y-0 right-0 w-full max-w-[560px] overflow-auto bg-white shadow-xl" onClick={(event) => event.stopPropagation()}><header className="flex items-center justify-between border-b border-line-soft px-6 py-5"><div><p className="text-black/40">事项详情</p><h2 className="mt-1 text-lg font-semibold">{state.selected.title}</h2></div><Button onClick={() => state.setDrawerOpen(false)}>关闭</Button></header><div className="space-y-6 p-6"><dl className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">{[['项目', state.selected.project], ['负责人', state.selected.owner], ['状态', state.selected.status], ['截止', DAYS[state.selected.end]], ['前置依赖', state.selected.deps.map((id) => state.tasks.find((task) => task.id === id)?.title).join('、') || '无']].map(([key, value]) => <div className="contents" key={key}><dt className="text-black/40">{key}</dt><dd>{value}</dd></div>)}</dl><TaskAiContent task={state.selected} tasks={state.tasks}/><label className="block space-y-2"><span className="font-semibold">更新节点</span><select className="block h-9 rounded-md border border-line px-3" value={state.selected.status} onChange={(event) => state.updateStatus(state.selected!.id, event.target.value as TaskStatus)}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label><section><h3 className="mb-3 font-semibold">关联动态</h3>{state.events.filter((event) => event.task === state.selected?.id).map((event) => <div className="mb-3 rounded-lg border border-line-soft p-4" key={event.id}><p className="font-medium">{event.title}</p><p className="mt-2 text-black/45">{event.source}</p><p className="mt-2 leading-5">{event.quote}</p></div>)}</section></div></aside></div>}
    {state.dialog && <TaskDialog mode={state.dialog} projects={state.projects} project={state.project} tasks={state.tasks} editing={editingTask} parentPreset={parentPreset} onClose={closeTaskDialog} onProject={name=>{state.createProject(name);setBoardView('wbs')}} onTask={state.createTask} onUpdate={state.updateTask} />}
  </>
}
