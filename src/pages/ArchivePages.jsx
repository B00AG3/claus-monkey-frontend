import React from 'react';
import archive from '../data/archive-runtime.json';
import SourceButton from '../components/SourceButton.jsx';
import {ArrowRight,ExternalLink} from 'lucide-react';

export const archivePages=archive.pages;
export const archiveResources=archive.resources;
function resolveAssets(value){return String(value||'').replace(/archive-asset:([a-f0-9]+)/g,(match,id)=>archive.assets[id]?.dataUri||'');}
function brandedCss(value){
  return resolveAssets(value).replace(/@font-face\s*\{[^}]*\}/gi,'')
    .replace(/#ec673a\b/gi,'var(--color-yellow)').replace(/#f68859\b/gi,'var(--color-yellow-light)')
    .replace(/#fff2d8\b/gi,'var(--color-cream)').replace(/#fff3dd\b/gi,'var(--color-cream)')
    .replace(/(?:Claus UI|ClausUI)/g,'Bricolage Grotesque');
}
export default function ArchivePage({path,navigate}){
  const host=React.useRef(null);
  const page=archive.pages[path];
  React.useEffect(()=>{
    if(!page||!host.current)return;
    const shadow=host.current.shadowRoot||host.current.attachShadow({mode:'open'});
    const css=page.styleIds.map(id=>brandedCss(archive.styles[id])).join('\n');
    const style=document.createElement('style');
    style.textContent=css+`\n:host{display:block;font-family:var(--font-body);color:var(--color-ink);min-width:0}html,body{background:var(--color-yellow)}header{position:absolute;right:clamp(20px,5vw,72px);top:30px;padding:0;z-index:5}header .brand{display:none}main{background:var(--color-cream);font-family:var(--font-body)}h1,h2,h3{overflow-wrap:anywhere;min-width:0}a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid var(--color-ink);outline-offset:4px}.plain-fallback{display:block}.plain-fallback nav{display:flex;gap:16px;flex-wrap:wrap}a[download]{cursor:pointer}@media(max-width:700px){header{position:static;padding:0 20px 16px;justify-content:flex-end}header nav{justify-content:flex-end;gap:14px}main{margin-top:0}h1{font-size:34px}}`;
    const content=document.createElement('div');
    // HTML is produced by the archive sanitizer, which removes executable nodes and handlers.
    content.innerHTML=resolveAssets((page.headerHtml||'')+(page.mainHtml||page.fallbackHtml));
    content.querySelectorAll('.header-socials,header>a[href="/Home"],header>a[href="/"]').forEach(element=>element.remove());
    for(const link of content.querySelectorAll('a[download]')){
      if(link.getAttribute('href')?.startsWith('/downloads/'))link.href='https://claus.si'+link.getAttribute('href');
    }
    for(const link of content.querySelectorAll('a[href]')){
      if(!link.getAttribute('href')?.startsWith('/')&&!link.getAttribute('href')?.startsWith('#')){link.target='_blank';link.rel='noopener noreferrer';}
    }
    shadow.replaceChildren(style,content);
    function click(event){
      const link=event.target.closest?.('a[href]');
      if(!link||link.target==='_blank'||link.hasAttribute('download'))return;
      navigate(link.getAttribute('href'),event);
    }
    shadow.addEventListener('click',click);
    return()=>shadow.removeEventListener('click',click);
  },[page,navigate]);
  return <div className="archive-page" ref={host}/>;
}
export function ResourcePage({path}){
  const resource=archive.resources[path];
  const [copied,setCopied]=React.useState(false);
  if(resource?.kind==='json'){
    const text=JSON.stringify(resource.data,null,2);
    return <main className="reader-panel json-reader"><SourceButton onClick={async()=>{try{await navigator.clipboard.writeText(text);setCopied(true);}catch{setCopied(false);}}}>{copied?'Copied':'Copy JSON'}</SourceButton><pre><code>{text}</code></pre></main>;
  }
  return <main className="reader-panel"><h2>Original download</h2><p>The website archive did not preserve the binary bytes for this file.</p><SourceButton asChild><a href={`https://claus.si${path}`} target="_blank" rel="noopener noreferrer">Open original file<ExternalLink size={16} aria-hidden="true"/></a></SourceButton></main>;
}
