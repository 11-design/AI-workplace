export type TaskStatus = '待开始' | '进行中' | '已完成' | '挂起'
export type Task = { id: string; project: string; title: string; owner: string; participants: string[]; status: TaskStatus; start: number; end: number; parent?: string; deps: string[]; aiChange?: string; baselineEnd?:number; completedAt?:string }
export type CoordinationEvent = { id: string; task: string; title: string; source: string; quote: string; pending?: boolean; decision?: string }
export type DialogMode = 'project' | 'task' | null
