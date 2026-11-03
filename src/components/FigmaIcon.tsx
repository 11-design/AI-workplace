/** Original Figma exports. Preserve each SVG's intrinsic proportions. */
export function FigmaIcon({ file, className = '' }: { file: string; className?: string }) {
  return <img className={`figma-icon ${className}`} src={`${import.meta.env.BASE_URL}figma/${file}`} alt="" draggable={false} />
}
