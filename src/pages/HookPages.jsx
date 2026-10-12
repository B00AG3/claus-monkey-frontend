import React from 'react';
import {ArrowRight,ExternalLink,Copy,Check} from 'lucide-react';
import SourceButton from '../components/SourceButton.jsx';
import data from '../data/hook-guides.json';
import './hook-pages.css';

const keys=['NFTs','Funding','Burn','Liquidity','Name'];
const names={NFTs:'NFT Vaults',Funding:'Project Funding',Burn:'Buyback & Burn',Liquidity:'LP Rewards',Name:'Token Identity'};
export const hookTitle=key=>names[key]||data.guides[key]?.title||key||'Hooks';
export default function HooksPage({section,navigate}){
  const guide=data.guides[section];
  if(!section)return <main className="reader-panel hooks-panel" aria-label="Hook functions">
    <ol className="hook-links">{keys.map((key,index)=><li key={key}><SourceButton asChild variant="ghost" className="hook-index-link"><a href={key==='NFTs'?'/Staking/NFT':`/Hooks/${key}`} onClick={event=>navigate(event.currentTarget.href,event)}><span className="hook-index-number">{String(index+1).padStart(2,'0')}</span><strong>{names[key]}</strong><ArrowRight size={18} aria-hidden="true"/></a></SourceButton></li>)}</ol>
  </main>;
  if(!guide)return <main className="reader-panel"><h2>Hook unavailable</h2><p>This hook is not in the captured public edition.</p><SourceButton asChild><a href="/Hooks" onClick={event=>navigate('/Hooks',event)}>All hooks</a></SourceButton></main>;
  return <main className="reader-panel hook-article" aria-label={hookTitle(section)}>
    {guide.retired&&<p className="hook-retired">Retired function</p>}
    <div className="article-prose"><p className="hook-lead">{guide.intro}</p></div>
    {section==='Name'&&<section className="hook-identity"><span>Current token</span><strong>{data.token?.name||'Claus'} <small>{data.token?.symbol||'CLAUS'}</small></strong></section>}
    <details className="hook-details"><summary>Details</summary><div className="article-prose">{guide.body.map((paragraph,index)=><p key={index}>{typeof paragraph==='string'?paragraph:paragraph.text}</p>)}</div></details>
    <nav className="hook-source-links" aria-label="Hook references">
      {(guide.links||[]).filter(([href])=>href!==`/Hooks/${section}`).map(([href,label])=>href.startsWith('/')?<a key={href} href={href} onClick={event=>navigate(href,event)}>{label}<ArrowRight size={16} aria-hidden="true"/></a>:<a key={href} href={href} target="_blank" rel="noopener noreferrer">{label}<ExternalLink size={16} aria-hidden="true"/></a>)}
      <a href={(guide.contract||['https://etherscan.io/address/0x37Bfb8AC7C960E558657871D41Ca70E07e7DbfFf#code'])[0]} target="_blank" rel="noopener noreferrer">{guide.contract?.[1]||'Hook contract'}<ExternalLink size={16} aria-hidden="true"/></a>
      <a href="/Journal" onClick={event=>navigate('/Journal',event)}>Journal<ArrowRight size={16} aria-hidden="true"/></a>
    </nav>
    <SourceButton asChild variant="outline" className="hook-back"><a href="/Hooks" onClick={event=>navigate('/Hooks',event)}>All hooks</a></SourceButton>
  </main>;
}

export function AddressPage({kind='contract'}){
  const [copied,setCopied]=React.useState(false);
  const address=kind==='wallet'?(data.wallets?.project||data.wallets?.owner||'0xBb145cA83272c3806D4dDc75cA1D5514789cF1C5'):(data.token?.address||'0x1b54E762aa34CF6E28E9C082F2848e28E45DA6b8');
  const value=typeof address==='string'?address:address.address;
  async function copy(){try{await navigator.clipboard.writeText(value);setCopied(true);}catch{setCopied(false);}}
  return <main className="reader-panel address-reader"><h2>{kind==='wallet'?'Project wallet':'Token contract'}</h2><p className="public-address">{value}</p><div className="address-actions"><SourceButton onClick={copy}>{copied?<Check size={18} aria-hidden="true"/>:<Copy size={18} aria-hidden="true"/>}{copied?'Copied':'Copy address'}</SourceButton><SourceButton asChild variant="outline"><a href={`https://etherscan.io/address/${value}${kind==='contract'?'#code':''}`} target="_blank" rel="noopener noreferrer">View on Etherscan<ExternalLink size={16} aria-hidden="true"/></a></SourceButton></div></main>;
}
