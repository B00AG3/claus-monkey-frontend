import React, {useRef,useState,useEffect} from 'react';
import {Copy,Check,ExternalLink} from 'lucide-react';
import SourceButton from './SourceButton.jsx';
import SourcePopover from './SourcePopover.jsx';
import {Monkey} from './Artwork.jsx';
import {CONTRACT} from '../data.js';

export default function SiteFooter({onOpenChange}){
  const [onchainOpen,setOpen]=useState(false);
  const [copyStatus,setCopyStatus]=useState('');
  const copyTimer=useRef(null);
  function setOnchainOpen(value){setOpen(value);onOpenChange?.(value);}
  useEffect(()=>()=>clearTimeout(copyTimer.current),[]);
  async function copyAddress(){
    try{await navigator.clipboard.writeText(CONTRACT);setCopyStatus('Contract address copied');}
    catch{setCopyStatus('Copy unavailable. Select the address below.');}
    clearTimeout(copyTimer.current);copyTimer.current=setTimeout(()=>setCopyStatus(''),3500);
  }
  return (    <footer className="ink-footer">
      <div className="footer-peek"><Monkey footer /><span className="peek-mark peek-mark-one" /><span className="peek-mark peek-mark-two" /></div>
      <svg className="footer-wave" viewBox="0 0 1440 200" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-30 53C168-31 333 19 538 71C730 123 842 125 1002 93C1181 53 1250 49 1399 107L1480 115V220H-30Z" />
      </svg>
      <nav className="footer-links" aria-label="Claus links">
        <a className="social-link" href="https://x.com/contractclaus" target="_blank" rel="noopener noreferrer" aria-label="Claus on X" title="X">
          <img src="/brand/x.svg" width="50" height="45" alt="" onError={event => { event.currentTarget.hidden = true; event.currentTarget.nextElementSibling.hidden = false; }} /><span hidden>X</span>
        </a>
        <a className="social-link" href="https://opensea.io/collection/contractclaus" target="_blank" rel="noopener noreferrer" aria-label="Claus on OpenSea" title="OpenSea">
          <img src="/brand/opensea.svg" width="100" height="100" alt="" onError={event => { event.currentTarget.hidden = true; event.currentTarget.nextElementSibling.hidden = false; }} /><span hidden>OpenSea</span>
        </a>
        <SourcePopover open={onchainOpen} onOpenChange={value => { setOnchainOpen(value); setCopyStatus(''); }} side="top" sideOffset={16} className="onchain-panel" trigger={
          <SourceButton variant="ghost" size="icon" className="social-link ethereum-link" aria-label="Claus on Ethereum" title="Onchain data on Etherscan">
            {/* Brandfetch has no matching ivory variant; original supplied mark is the documented fallback. */}
            <svg viewBox="0 0 18 28" aria-hidden="true"><path d="M9 0 0 15.6 9 20.9 18 15.6 9 0ZM0 17.6 9 28l9-10.4-9 5.3L0 17.6Z" /><path d="m.5 15.5 8.5-4 8.5 4M9 .7v19.5" fill="none" stroke="var(--color-black)" strokeWidth=".65" /></svg>
          </SourceButton>
        } aria-labelledby="onchain-heading">
          <h2 id="onchain-heading">Onchain</h2>
          <SourceButton variant="ghost" className="contract-copy" onClick={copyAddress}>
            Contract address {copyStatus === 'Contract address copied' ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
          </SourceButton>
          <code className="contract-address">{CONTRACT}</code>
          <p className="copy-status" role="status">{copyStatus}</p>
          <nav aria-label="Claus on Etherscan">
            {[
              ['Token contract', `https://etherscan.io/address/${CONTRACT}#code`],
              ['Hook contract', 'https://etherscan.io/address/0x37Bfb8AC7C960E558657871D41Ca70E07e7DbfFf#code'],
              ['Onchain journal', 'https://etherscan.io/idm?addresses=0xbb145ca83272c3806d4ddc75ca1d5514789cf1c5,0x0000000000000000000000000000000000000000&type=1'],
              ['Wallet activity', 'https://etherscan.io/address/0xBb145cA83272c3806D4dDc75cA1D5514789cF1C5'],
            ].map(([label, url]) => <a key={label} href={url} target="_blank" rel="noopener noreferrer">{label}<ExternalLink size={15} aria-hidden="true" /></a>)}
          </nav>
        </SourcePopover>
      </nav>
    </footer>);
}
