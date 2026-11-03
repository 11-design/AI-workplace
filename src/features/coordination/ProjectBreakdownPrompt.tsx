import { openProjectBreakdown } from '../../components/ProjectBreakdownConversation'
import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { FigmaIcon } from '../../components/FigmaIcon'

const PROMPT = '试试让小W帮你快速拆解项目'

export function ProjectBreakdownPrompt({project}:{project:string}) {
  const [length, setLength] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLength(PROMPT.length)
      return
    }
    const timer = window.setInterval(() => {
      setLength(current => {
        if (current >= PROMPT.length - 1) window.clearInterval(timer)
        return Math.min(current + 1, PROMPT.length)
      })
    }, 90)
    return () => window.clearInterval(timer)
  }, [])

  return <div className="project-breakdown-empty">
    <button type="button" className="project-breakdown-prompt" aria-label={PROMPT} onClick={()=>openProjectBreakdown(project)}>
      <FigmaIcon file="my-items/fc9a4.svg"/>
      <span className="project-breakdown-copy" aria-hidden="true">
        <span className="project-breakdown-measure">{PROMPT}</span>
        <span className="project-breakdown-typed">{PROMPT.slice(0, length)}{length < PROMPT.length && <i/>}</span>
      </span>
      <ArrowUpRight className="project-breakdown-arrow" aria-hidden="true"/>
    </button>
  </div>
}
