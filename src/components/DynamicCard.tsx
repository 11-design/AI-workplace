import type { ReactNode } from 'react'
import { FigmaIcon } from './FigmaIcon'

export type DynamicEntityType = '任务' | '会议' | '项目' | '讨论' | '文件' | '消息'
const ICONS: Record<DynamicEntityType, string> = { 任务: '✓', 会议: '◷', 项目: '▣', 讨论: '◌', 文件: '▤', 消息: '▱' }

export function DynamicCard({ type, entity, actor, verb, time, project, people, change, source, status, action, onEntityClick, onProjectClick, children, variant = 'card', current = false }: { type: DynamicEntityType; entity: string; actor: string; verb: string; time: string; project: string; people: string[]; change: string; source: string; status?: string; action?: ReactNode; onEntityClick?: () => void; onProjectClick?: () => void; children?: ReactNode; variant?: 'card' | 'timeline'; current?: boolean }) {
  if (variant === 'timeline') {
    const initial = ({ 林晓: 'L', 苏禾: 'S', 陈宇: 'C', 王敏: 'W', 评审会议: 'M' } as Record<string, string>)[actor] || actor.slice(0, 1)
    return <article className="coordination-event">
      <div className="event-time" title={time}>
        <div className="event-time-label"><FigmaIcon file={current ? 'fffbc.svg' : '2d603.svg'} className={current ? 'watching-icon' : ''} /><span>{current ? '当前' : time.startsWith('10/28') ? '此前' : time}</span></div>
        <div className="event-time-line"><FigmaIcon file={current ? '1c97f.svg' : '2c725.svg'} /></div>
      </div>
      <div className="event-content">
        <h3 className="event-sentence">
          <span className="event-person"><span className="event-person-avatar">{initial}</span>{actor}</span>
          <span>{verb}</span>
          <button type="button" className="event-entity" onClick={onEntityClick} title={change}>{entity}</button>
        </h3>
        <dl><dt>来源</dt><dd>{source}</dd></dl>
        {children}
      </div>
    </article>
  }
  return <article className="space-y-3 border-b border-line-soft p-5 last:border-b-0">
    <div className="flex items-center justify-between gap-3 text-xs text-black/45"><span>{time}</span>{status && <span className="shrink-0">{status}</span>}</div>
    <div className="flex items-start gap-2"><span aria-label={type} title={type} className="grid size-7 shrink-0 place-items-center rounded-md bg-zinc-100 text-sm text-zinc-700">{ICONS[type]}</span><h3 className="min-w-0 text-sm font-medium leading-7"><span className="dynamic-inline-tag">{actor}</span><span className="mx-1.5">{verb}</span><button type="button" onClick={onEntityClick} className="dynamic-inline-tag align-baseline hover:border-zinc-400">{entity}</button></h3></div>
    <div className="rounded-lg bg-fill p-3 text-xs leading-5 text-black/80">{change}</div>
    <dl className="grid grid-cols-[56px_minmax(0,1fr)] gap-y-1.5 text-xs"><dt className="text-black/40">关联实体</dt><dd className="min-w-0"><button type="button" onClick={onProjectClick} className="text-left text-zinc-700 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-700">项目 · {project}</button></dd><dt className="text-black/40">关联人员</dt><dd className="text-black/65">{[...new Set(people)].join('、')}</dd></dl>
    {children}
    <div className="flex items-start justify-between gap-3 border-t border-line-soft pt-3"><span className="min-w-0 text-xs leading-5 text-black/45">来源：{source}</span>{action}</div>
  </article>
}
