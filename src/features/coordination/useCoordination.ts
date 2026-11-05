import { EXECUTE_BREAKDOWN, BREAKDOWN_PROGRESS, buildBreakdownBatches } from './projectBreakdownExecution'
import type { BreakdownRequest, BreakdownProgress } from './projectBreakdownExecution'
import { EXECUTE_PLAN, PLAN_RESULT, schedulePlan } from './planningExecution'
import type { PlanRequest } from './planningExecution'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CURRENT_USER, DAYS, INITIAL_EVENTS, INITIAL_PROJECTS, INITIAL_TASKS, STORAGE_KEY } from './data'
import type { CoordinationEvent, DialogMode, Task, TaskStatus } from './types'

export function useCoordination() {
  const captureOverlay = new URLSearchParams(window.location.search).get('overlay')
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [events, setEvents] = useState<CoordinationEvent[]>(INITIAL_EVENTS)
  const [projectMembers, setProjectMembers] = useState<Record<string,string[]>>({})
  const [projects, setProjects] = useState(INITIAL_PROJECTS)
  const [project, setProject] = useState('支付体验改版')
  const [selectedId, setSelectedId] = useState<string | null>(captureOverlay === 'drawer' ? 'api' : null)
  const [onlyPending, setOnlyPending] = useState(false)
  const [dialog, setDialog] = useState<DialogMode>(captureOverlay === 'task' ? 'task' : captureOverlay === 'project' ? 'project' : null)
  const [drawerOpen, setDrawerOpen] = useState(captureOverlay === 'drawer')
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); if (saved?.tasks && saved?.events && saved?.projects) {
      if ((saved.aiTrialResetVersion || 0) < 2) {
        localStorage.setItem(STORAGE_KEY + '-before-ai-trial-reset', JSON.stringify(saved))
        saved.tasks = saved.tasks.map((task: Task) => {
          if (!task.aiChange) return task
          const previous = task.aiChange.match(/从 (\d{2}\/\d{2})—(\d{2}\/\d{2})/)
          const { aiChange: _removed, ...rest } = task
          const start = previous ? DAYS.indexOf(previous[1]) : -1
          const end = previous ? DAYS.indexOf(previous[2]) : -1
          return start >= 0 && end >= 0 ? { ...rest, start, end } : rest
        })
        saved.events = saved.events.filter((event: CoordinationEvent) => !event.id.startsWith('ai-'))
        saved.aiTrialResetVersion = 2
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
      }
      if ((saved.singleOverdueDemoVersion || 0) < 2) {
        saved.tasks = saved.tasks.map((task:Task) => {
          const sample=INITIAL_TASKS.find(item=>item.id===task.id)
          if(!sample)return task
          return {...task,status:sample.status,start:sample.start,end:sample.end,baselineEnd:sample.end,completedAt:sample.completedAt,aiChange:undefined}
        })
      }
      if ((saved.singleOverdueDemoVersion || 0) < 3) {
        saved.tasks = saved.tasks.map((task: Task) => ['api', 'copy'].includes(task.id)
          ? { ...task, status: '已完成', completedAt: task.id === 'api' ? '2026-11-05T16:00:00+01:00' : '2026-11-05T16:10:00+01:00' }
          : task)
        saved.singleOverdueDemoVersion = 3
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
      }
      setTasks(saved.tasks.map((task: Task) => ({ ...task, status: !saved.workloadDemoVersion && ['decision','api','design'].includes(task.id) && task.status==='待开始' && !saved.events.some((event: CoordinationEvent)=>event.task===task.id && /^(update-|edit-|batch-)/.test(event.id)) ? '进行中' : ['待开始','进行中','已完成','挂起'].includes(task.status) ? task.status : '待开始' }))); setEvents(saved.events); setProjects(saved.projects); setProjectMembers(saved.projectMembers || {}) } } catch {} setHydrated(true) }, [])
  useEffect(() => { if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, events, projects, projectMembers, workloadDemoVersion: 1, aiTrialResetVersion: 2, singleOverdueDemoVersion: 3 })) }, [events, hydrated, projects, tasks, projectMembers])
  const [aiDraft,setAiDraft]=useState<Task[]|null>(null)
  const [aiRunning,setAiRunning]=useState(false)
  const [aiEditingIds,setAiEditingIds]=useState<string[]>([])
  const [aiActivity,setAiActivity]=useState('')
  const latest=useRef(tasks);latest.current=tasks
  const busy=useRef(false)
  useEffect(()=>{
    let timer:ReturnType<typeof setTimeout>|undefined
    const handle=(event:Event)=>{
      const request=(event as CustomEvent<PlanRequest>).detail
      const reply=(message:string)=>window.dispatchEvent(new CustomEvent(PLAN_RESULT,{detail:{requestId:request.requestId,message}}))
      if(busy.current){reply('已有排期调整正在执行，请稍后重试。');return}
      if(document.querySelector('.wbs-project-editing, .gantt-task-bar.is-edited')){reply('请先保存或取消当前手动修改，再执行 AI 排期。');return}
      busy.current=true;setAiActivity('AI 正在调整排期…');setAiRunning(true);setProject(request.project);setDrawerOpen(false)
      const snapshot=latest.current
      try {
        const preview=schedulePlan(snapshot,request)
        setAiEditingIds(preview.filter(task=>{const old=snapshot.find(item=>item.id===task.id)!;return old.start!==task.start||old.end!==task.end}).map(task=>task.id))
      } catch { setAiEditingIds([]) }
      timer=setTimeout(()=>{
        try{
          if(latest.current!==snapshot)throw new Error('任务已发生变化，请重新确认边界后再试。')
          const planned=schedulePlan(snapshot,request)
          const changes=planned.filter(t=>{const old=snapshot.find(o=>o.id===t.id)!;return old.start!==t.start||old.end!==t.end})
          const format=(day:number)=>{const date=new Date(Date.UTC(2026,9,28+day));return `${String(date.getUTCMonth()+1).padStart(2,'0')}/${String(date.getUTCDate()).padStart(2,'0')}`}
          changes.forEach(t=>{const old=snapshot.find(o=>o.id===t.id)!;t.aiChange=`AI 将排期从 ${format(old.start)}—${format(old.end)} 调整为 ${format(t.start)}—${format(t.end)}。`})
          if(changes.length)setAiDraft(planned)
          reply(changes.length?`已生成 ${changes.length} 项排期修改，已进入编辑态。可继续调整，点击“保存修改”后生效。`:'当前排期已满足条件，无需修改。')
        }catch(error){reply(error instanceof Error?error.message:'调整失败，本次未修改排期。')}
        finally{busy.current=false;setAiRunning(false);setAiEditingIds([])}
      },6000)
    }
    window.addEventListener(EXECUTE_PLAN,handle)
    return()=>{window.removeEventListener(EXECUTE_PLAN,handle);clearTimeout(timer)}
  },[])
  useEffect(()=>{
    let timer:ReturnType<typeof setTimeout>|undefined
    let active:BreakdownRequest|null=null
    const handle=(event:Event)=>{
      const request=(event as CustomEvent<BreakdownRequest>).detail
      const reply=(phase:BreakdownProgress['phase'],message:string,step=0,total=0)=>window.dispatchEvent(new CustomEvent(BREAKDOWN_PROGRESS,{detail:{requestId:request.requestId,phase,message,step,total}}))
      if(busy.current||document.querySelector('.wbs-project-editing')){reply('error','请先等待当前操作完成，并保存或取消项目修改。');return}
      if(latest.current.some(t=>t.project===request.project)){reply('error','该项目已有任务。请先确认现有任务，本次未重复生成。');return}
      active=request;busy.current=true;setAiRunning(true);setAiActivity('小W 正在拆解项目…');setProject(request.project);setDrawerOpen(false)
      const snapshot=latest.current,batches=buildBreakdownBatches(request),generated:Task[]=[]
      let index=0
      reply('running','正在梳理项目目标与交付范围…',0,batches.length)
      const advance=()=>{
        if(latest.current!==snapshot){setAiDraft(null);setAiRunning(false);setAiEditingIds([]);busy.current=false;active=null;reply('error','项目任务已发生变化，已停止生成，请重新确认。');return}
        if(index===batches.length){setAiEditingIds([]);setAiRunning(false);busy.current=false;active=null;reply('complete',`已拆解为 ${batches.length} 个工作阶段、${generated.length} 个任务节点。负责人和排期待确认；可继续编辑，点击“保存修改”后生效。`,index,batches.length);return}
        const batch=batches[index];generated.push(...batch);setAiDraft([...snapshot,...generated]);setAiEditingIds(batch.map(t=>t.id));index++
        reply('running',`正在拆解「${batch[0].title}」，补充子任务与前置依赖…`,index,batches.length)
        timer=setTimeout(advance,2600)
      }
      timer=setTimeout(advance,1400)
    }
    window.addEventListener(EXECUTE_BREAKDOWN,handle)
    return()=>{window.removeEventListener(EXECUTE_BREAKDOWN,handle);clearTimeout(timer);if(active)window.dispatchEvent(new CustomEvent(BREAKDOWN_PROGRESS,{detail:{requestId:active.requestId,phase:'error',message:'已离开项目工作台，生成已停止，未保存任务。',step:0,total:0}}))}
  },[])
  const selected = useMemo(() => tasks.find((task) => task.id === selectedId) ?? null, [selectedId, tasks])
  const visibleProjects = projects.filter((name) => project === '全部项目' || name === project)
  const linkedIds = useMemo(() => selected ? new Set([selected.id, ...selected.deps, ...tasks.filter((task) => task.deps.includes(selected.id)).map((task) => task.id)]) : null, [selected, tasks])
  const isRelatedToCurrentUser = (task?: Task) => Boolean(task && (task.owner === CURRENT_USER || task.participants?.includes(CURRENT_USER)))
  const visibleEvents = events.filter((event) => {
    const task = tasks.find((item) => item.id === event.task)
    return isRelatedToCurrentUser(task) && (!onlyPending || event.pending) && (!linkedIds || linkedIds.has(event.task)) && (project === '全部项目' || task?.project === project)
  })
  const createProject = (name: string) => { if (!projects.includes(name)) setProjects((current) => [...current, name]); setProject(name) }
  const createTask = (input: Pick<Task, 'title' | 'owner' | 'parent' | 'deps' | 'end'> & { project?: string }) => { const id = `task-${crypto.randomUUID()}`; const targetProject = input.project ?? tasks.find(task => task.id === input.parent)?.project ?? (project === '全部项目' ? projects[0] : project); const task: Task = { id, project: targetProject, participants: input.owner === CURRENT_USER ? [] : [CURRENT_USER], status: '待开始', start: 0, ...input }; setTasks((current) => [...current, task]); setEvents((current) => [{ id: `create-${id}`, task: id, title: `林晓创建任务：${task.title}`, source: '本人操作记录 · 刚刚', quote: `负责人：${task.owner}；截止日期：${DAYS[task.end]}` }, ...current]); setSelectedId(id); return id }
  const confirmEvent = (id: string, accepted: boolean) => { setEvents((current) => current.map((event) => event.id === id ? { ...event, pending: false, decision: accepted ? '林晓已确认' : '林晓已忽略' } : event)); if (accepted && id === 'delay') setTasks((current) => current.map((task) => task.id === 'api' ? { ...task, end: 2 } : task)) }
  const updateStatus = (id: string, status: TaskStatus) => { const previous = tasks.find((task) => task.id === id)?.status; setTasks((current) => current.map((task) => task.id === id ? { ...task, status, completedAt:status==='已完成'?(task.completedAt??new Date().toISOString()):undefined } : task)); setEvents((current) => [{ id: `update-${Date.now()}`, task: id, title: `${previous} → ${status}`, source: '林晓手动更新 · 刚刚', quote: `原状态：${previous}；新状态：${status}` }, ...current]) }
  const updateTask = (id: string, input: Pick<Task, 'title' | 'owner' | 'parent' | 'deps' | 'end'>) => {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, ...input } : task))
    setEvents((current) => [{ id: `edit-${Date.now()}`, task: id, title: `任务信息已更新：${input.title}`, source: '林晓手动更新 · 刚刚', quote: `负责人：${input.owner}；截止日期：${DAYS[input.end]}` }, ...current])
  }
  const deleteTask = (id: string) => {
    const removed = new Set([id])
    let changed = true
    while (changed) { changed = false; tasks.forEach(task => { if (task.parent && removed.has(task.parent) && !removed.has(task.id)) { removed.add(task.id); changed = true } }) }
    setTasks(current => current.filter(task => !removed.has(task.id)).map(task => ({ ...task, deps: task.deps.filter(dep => !removed.has(dep)) })))
    setEvents(current => current.filter(event => !removed.has(event.task)))
    if (selectedId && removed.has(selectedId)) setSelectedId(null)
  }
  const updateSchedules = (changes: Array<{ id: string; start: number; end: number }>) => {
    setTasks((current) => current.map((task) => { const change = changes.find((item) => item.id === task.id); return change ? { ...task, ...change } : task }))
    setEvents((current) => changes.map((change, index) => { const task = tasks.find((item) => item.id === change.id); return { id: `schedule-${Date.now()}-${index}`, task: change.id, title: `排期已调整：${task?.title}`, source: '甘特图拖拽更新 · 刚刚', quote: `${DAYS[change.start]}—${DAYS[change.end]}` } }).concat(current))
  }
  const commitProject=(projectName:string, updated:Task[], members:string[])=>{
    setAiDraft(null)
    setProjectMembers(current=>({...current,[projectName]:members}))
    setTasks(current=>current.filter(t=>t.project!==projectName).concat(updated.map(t=>{const old=current.find(item=>item.id===t.id);return {...t,baselineEnd:t.baselineEnd??old?.end??t.end,completedAt:t.status==='已完成'?(t.completedAt??new Date().toISOString()):undefined}})))
    const ids=new Set(updated.map(t=>t.id)),previous=tasks.filter(t=>t.project===projectName)
    setEvents(current=>current.filter(event=>!previous.some(t=>t.id===event.task)||ids.has(event.task)).concat(updated.filter(t=>JSON.stringify(previous.find(old=>old.id===t.id))!==JSON.stringify(t)).map(t=>({id:'batch-'+crypto.randomUUID(),task:t.id,title:'项目编辑已保存：'+t.title,source:'林晓统一提交 · 刚刚',quote:t.aiChange || '任务名称、排期、层级与依赖已更新'}))))
    if(selectedId&&!ids.has(selectedId)&&previous.some(t=>t.id===selectedId))setSelectedId(null)
  }
  const pendingCount = visibleEvents.filter((event) => event.pending).length
  return { aiActivity, aiDraft, cancelAiDraft:()=>setAiDraft(null), aiEditingIds, aiRunning, projectMembers, commitProject, tasks, events, projects, project, selected, visibleProjects, visibleEvents, pendingCount, onlyPending, dialog, drawerOpen, setProject, selectTask: setSelectedId, setOnlyPending, setDialog, setDrawerOpen, createProject, createTask, updateTask, deleteTask, updateSchedules, confirmEvent, updateStatus }
}
