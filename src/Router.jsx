import React,{Suspense,useCallback,useEffect,useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import HomePage from './pages/HomePage.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import SourceButton from './components/SourceButton.jsx';
import {Monkey} from './components/Artwork.jsx';
import useEyes from './useEyes.js';
import HooksPage,{AddressPage,hookTitle} from './pages/HookPages.jsx';
import routeIndex from './data/route-index.json';
import {PROJECTS} from './data.js';
import './pages/site-pages.css';

const ArchivePage=React.lazy(()=>import('./pages/ArchivePages.jsx'));
const ResourcePage=React.lazy(()=>import('./pages/ArchivePages.jsx').then(module=>({default:module.ResourcePage})));
const LabPage=React.lazy(()=>import('./pages/ResearchPages.jsx').then(module=>({default:module.LabPage})));
const JournalPage=React.lazy(()=>import('./pages/ResearchPages.jsx').then(module=>({default:module.JournalPage})));
const ProjectPage=React.lazy(()=>import('./pages/ResearchPages.jsx').then(module=>({default:module.ProjectPage})));
const StakingPage=React.lazy(()=>import('./pages/CommunityPages.jsx').then(module=>({default:module.StakingPage})));
const ClubPage=React.lazy(()=>import('./pages/CommunityPages.jsx').then(module=>({default:module.ClubPage})));
const archivePages=routeIndex.pages,archiveResources=routeIndex.resources;

const aliases={'/Home':'/','/Staking':'/Staking/Token','/Splash':'/Staking/Token','/Staking/CLAUS':'/Staking/Token','/Staking/NFTs':'/Staking/NFT','/Hooks/NFTs':'/Staking/NFT','/nfts':'/Staking/NFT'};
function normalize(path){return aliases[path.replace(/\/$/,'')]||path.replace(/\/$/,'')||'/';}
function current(){return normalize(location.pathname)+location.search+location.hash;}

function SiteHeader({title,navigate}){
  return <header className="site-header"><a className="site-home" href="/" aria-label="Claus home" onClick={event=>navigate('/',event)}><Monkey/></a>{title&&<h1 className="site-page-title" id="route-title">{title}</h1>}</header>;
}
function RouteReady({path,title,route}){
  useEffect(()=>{
    const heading=document.querySelector('#route-title,#research-entry-title,main h1')||document.querySelector('.archive-page')?.shadowRoot?.querySelector('main h1');
    document.title=path==='/'?'Claus — Monkey edition':`${heading?.textContent||title||archivePages[path]?.heading||'Claus'} — Claus`;
    const shadow=document.querySelector('.archive-page')?.shadowRoot;
    let anchor=null;
    try{const id=decodeURIComponent(location.hash.slice(1));if(id)anchor=document.getElementById(id)||shadow?.getElementById(id);}catch{}
    const focus=anchor||heading;
    if(path!=='/'&&focus){focus.setAttribute('tabindex','-1');focus.focus({preventScroll:true});}
    if(anchor)anchor.scrollIntoView({block:'start',behavior:'instant'});
  },[path,title,route]);
  return null;
}
export default function Router(){
  const [route,setRoute]=useState(current);
  const routeRef=useRef(route);
  routeRef.current=route;
  const busy=useRef(false);
  const navigationGeneration=useRef(0);
  const pendingHistoryRoute=useRef(null);
  useEyes();
  const navigate=useCallback((href,event)=>{
    if(event&&(event.defaultPrevented||event.button>0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey))return;
    const url=new URL(href,location.href);
    if(url.origin!==location.origin&&url.hostname!=='claus.si')return;
    if(/\.(zip|png|woff2)$/i.test(url.pathname))return;
    event?.preventDefault();
    const destination=normalize(url.pathname)+url.search+url.hash;
    if(destination===current()||busy.current)return;
    if(normalize(url.pathname)===normalize(location.pathname)&&url.search===location.search){
      history.pushState({},'',destination);setRoute(destination);if(!url.hash)window.scrollTo({top:0,behavior:'instant'});return;
    }
    const box=event?.currentTarget?.getBoundingClientRect?.();
    const origin=box?{x:box.x+box.width/2,y:box.y+box.height/2}:{x:innerWidth/2,y:innerHeight/2};
    const swap=()=>{history.pushState({},'',destination);window.scrollTo({top:0,behavior:'instant'});flushSync(()=>setRoute(destination));};
    if(matchMedia('(prefers-reduced-motion:reduce)').matches||!window.ClausInk){swap();return;}
    busy.current=true;
    const generation=++navigationGeneration.current;
    window.ClausInk.mount().play(origin,swap,'both',()=>{
      const heading=document.querySelector('#route-title,main h1');
      const r=heading?.getBoundingClientRect();
      return r?{x:r.x+r.width/2,y:r.y+r.height/2}:{x:innerWidth/2,y:innerHeight/2};
    }).finally(()=>{if(generation===navigationGeneration.current)busy.current=false;});
  },[]);
  useEffect(()=>{
    function pop(){
      const destination=current();
      const generation=++navigationGeneration.current;
      window.ClausInk?.instance?.cancel();
      const landmark=document.querySelector('#route-title,main h1,.site-home,.world-core');
      const box=landmark?.getBoundingClientRect();
      const origin=box?{x:box.x+box.width/2,y:box.y+box.height/2}:{x:innerWidth/2,y:innerHeight/2};
      const swap=()=>{pendingHistoryRoute.current=null;window.scrollTo({top:0,behavior:'instant'});flushSync(()=>setRoute(destination));};
      pendingHistoryRoute.current=destination;
      if(destination.split('#')[0]===routeRef.current.split('#')[0]){swap();busy.current=false;return;}
      if(matchMedia('(prefers-reduced-motion:reduce)').matches||!window.ClausInk){swap();busy.current=false;return;}
      busy.current=true;
      window.ClausInk.mount().play(origin,swap,'both',()=>{
        const target=document.querySelector('.world-core,#route-title,main h1');
        const r=target?.getBoundingClientRect();
        return r?{x:r.x+r.width/2,y:r.y+r.height/2}:{x:innerWidth/2,y:innerHeight/2};
      }).finally(()=>{if(generation===navigationGeneration.current)busy.current=false;});
    }
    function escape(event){if(event.key==='Escape'){
      navigationGeneration.current++;
      window.ClausInk?.instance?.cancel();
      if(pendingHistoryRoute.current){setRoute(pendingHistoryRoute.current);pendingHistoryRoute.current=null;}
      busy.current=false;
    }}
    window.addEventListener('popstate',pop);window.addEventListener('keydown',escape);
    return()=>{window.removeEventListener('popstate',pop);window.removeEventListener('keydown',escape);};
  },[]);
  const path=route.split(/[?#]/)[0];
  let title='',content=null;
  if(path==='/')content=<HomePage navigate={navigate}/>;
  else if(path==='/Hooks'||path.startsWith('/Hooks/')){const key=path.split('/')[2];title=hookTitle(key);content=<HooksPage section={key} navigate={navigate}/>;}
  else if(path==='/Staking/Token'||path==='/Staking/NFT'){title='Staking';content=<StakingPage mode={path.endsWith('/NFT')?'nft':'token'} navigate={navigate}/>;}
  else if(path==='/Club'){title='Claus Club';content=<ClubPage navigate={navigate}/>;}
  else if(path==='/Lab'||path.startsWith('/Lab/')||path==='/Posts'){title='Lab';content=<LabPage navigate={navigate} ideaId={path.split('/').slice(2).filter(Boolean).pop()}/>;}
  else if(path==='/Journal'||path.startsWith('/Journal/')){title=path==='/Journal'?'Journal':'';content=<JournalPage navigate={navigate} entryId={decodeURIComponent(path.split('/').slice(2).join('/'))}/>;}
  else if(path.startsWith('/p/')){title=PROJECTS.find(project=>project.slug===path.split('/')[2])?.name||'Project';content=<ProjectPage slug={path.split('/')[2]} navigate={navigate}/>;}
  else if(path==='/Contract'||path==='/Wallet'||path==='/Token'){title=path==='/Wallet'?'Wallet':path==='/Token'?'Token':'Contract';content=<AddressPage kind={path==='/Wallet'?'wallet':'contract'}/>;}
  else if(archivePages[path]){title='';content=<ArchivePage path={path} navigate={navigate}/>;}
  else if(archiveResources[path]){title=path.split('/').pop();content=<ResourcePage path={path}/>;}
  else{title='Page unavailable';content=<main className="reader-panel"><p>This destination is not part of the downloaded public website.</p><SourceButton asChild><a href="/" onClick={event=>navigate('/',event)}>Back to the network</a></SourceButton></main>;}
  function captureLink(event){
    const anchor=event.target.closest?.('a[href]');
    if(!anchor||anchor.target==='_blank'||anchor.hasAttribute('download')||event.defaultPrevented)return;
    if(anchor.getAttribute('href').startsWith('#'))return;
    if(anchor.href.startsWith(location.origin)||anchor.href.startsWith('https://claus.si/'))navigate(anchor.href,event);
  }
  if(path==='/')return <div onClick={captureLink}>{content}<RouteReady path={path} title={title} route={route}/></div>;
  return <div className={`site-page-shell ${path.startsWith('/docs')?'docs-shell':''}`} onClick={captureLink}>
    <a className="skip-link" href="#page-content">Skip to content</a>
    <SiteHeader title={title} navigate={navigate}/>
    <div className="site-page-body" id="page-content" key={`body:${path}`}><Suspense fallback={<main className="reader-panel" aria-busy="true"><p role="status">Loading {title||'page'}…</p></main>}>{content}<RouteReady path={path} title={title} route={route}/></Suspense></div>
    <SiteFooter key={`footer:${path}`}/>
  </div>;
}
