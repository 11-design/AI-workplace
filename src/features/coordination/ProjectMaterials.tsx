import { useRef, useState } from 'react'
import { Upload, Link2, FileText, X } from 'lucide-react'

export type ProjectMaterial = { id:string; name:string; project:string; kind:'file'|'link'; url?:string }
export const readMaterials = ():ProjectMaterial[] => {
  try { return JSON.parse(localStorage.getItem('workbase-project-materials') || '[]') } catch { return [] }
}
export async function saveMaterials(project:string, files:File[], linked:ProjectMaterial[]) {
  const added:ProjectMaterial[] = files.map(file=>({id:crypto.randomUUID(),name:file.name,project,kind:'file'}))
  if (files.length) await new Promise<void>((resolve,reject)=>{
    const request=indexedDB.open('workbase-project-files',1)
    request.onupgradeneeded=()=>request.result.createObjectStore('files')
    request.onerror=()=>reject(request.error)
    request.onsuccess=()=>{
      const db=request.result,tx=db.transaction('files','readwrite')
      files.forEach((file,i)=>tx.objectStore('files').put(file,added[i].id))
      tx.oncomplete=()=>{db.close();resolve()}
      tx.onerror=()=>{db.close();reject(tx.error)}
      tx.onabort=()=>{db.close();reject(tx.error)}
    }
  })
  localStorage.setItem('workbase-project-materials',JSON.stringify([...readMaterials(),...added,...linked.map(item=>({...item,project}))]))
}
export function ProjectMaterials({files,linked,onFiles,onLinked}:{files:File[];linked:ProjectMaterial[];onFiles:(files:File[])=>void;onLinked:(items:ProjectMaterial[])=>void}) {
  const input=useRef<HTMLInputElement>(null)
  const [open,setOpen]=useState(false),[search,setSearch]=useState(''),[url,setUrl]=useState(''),[error,setError]=useState('')
  const available=[...new Map(readMaterials().map(item=>[item.id,item])).values()].filter(item=>!linked.some(link=>link.id===item.id)&&`${item.name}${item.project}`.includes(search))
  return <section className="project-materials"><div className="project-materials-heading"><span>项目资料</span><small>添加需求、方案等资料，帮助小W理解项目。</small></div>
    <input ref={input} type="file" multiple hidden onChange={e=>{const next=Array.from(e.target.files??[]);onFiles([...files,...next.filter(file=>!files.some(old=>old.name===file.name&&old.size===file.size&&old.lastModified===file.lastModified))]);e.target.value=''}}/>
    <div className="project-material-actions"><button type="button" onClick={()=>input.current?.click()}><Upload size={15}/>上传资料</button><button type="button" aria-expanded={open} onClick={()=>setOpen(!open)}><Link2 size={15}/>关联项目资料</button></div>
    {open&&<div className="project-material-picker"><input aria-label="搜索项目资料" placeholder="搜索已有项目资料" value={search} onChange={e=>setSearch(e.target.value)}/><div className="project-material-options">{available.map(item=><button type="button" key={item.id} onClick={()=>onLinked([...linked,item])}><FileText size={15}/><span>{item.name}<small>{item.project}</small></span><span>关联</span></button>)}{!available.length&&<p>暂无可关联资料，也可以添加文档链接</p>}</div><div className="project-material-link"><input aria-label="项目资料链接" placeholder="粘贴文档链接" value={url} onChange={e=>{setUrl(e.target.value);setError('')}}/><button type="button" onClick={()=>{try{const parsed=new URL(url);if(!['https:','http:'].includes(parsed.protocol))throw new Error();onLinked([...linked,{id:crypto.randomUUID(),name:parsed.hostname+parsed.pathname,project:'文档链接',kind:'link',url:parsed.href}]);setUrl('');setOpen(false)}catch{setError('请输入有效的 http 或 https 链接')}}}>添加</button></div>{error&&<p role="alert">{error}</p>}</div>}
    {!!(files.length+linked.length)&&<ul className="project-material-list">{files.map((file,i)=><li key={file.name+i}><FileText size={15}/><span title={file.name}>{file.name}<small>{Math.max(1,Math.round(file.size/1024))} KB · 本地文件</small></span><button type="button" aria-label={'移除'+file.name} onClick={()=>onFiles(files.filter((_,index)=>index!==i))}><X size={14}/></button></li>)}{linked.map(item=><li key={item.id}><Link2 size={15}/><span title={item.name}>{item.name}<small>关联自 {item.project}</small></span><button type="button" aria-label={'取消关联'+item.name} onClick={()=>onLinked(linked.filter(link=>link.id!==item.id))}><X size={14}/></button></li>)}</ul>}
  </section>
}
