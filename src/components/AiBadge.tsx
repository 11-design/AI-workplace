import { FigmaIcon } from './FigmaIcon'

export function AiBadge({label='AI识别',title}:{label?:string;title?:string}) {
 return <span className="event-ai-badge" title={title}><FigmaIcon file="activity-ai/1cef9.svg"/><span>{label}</span></span>
}
