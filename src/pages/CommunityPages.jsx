import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, ExternalLink, Filter, History, Info, LockKeyhole, Plus, RefreshCw, Search, Wallet, X } from 'lucide-react';
import SourceButton from '../components/SourceButton.jsx';
import SourceDialog from '../components/SourceDialog.jsx';
import SourceInput from '../components/SourceInput.jsx';
import SourcePopover from '../components/SourcePopover.jsx';
import { Banana, DropArt, Monkey } from '../components/Artwork.jsx';
import data from '../data/community-data.json';
import './community-pages.css';

const SOURCE = 'https://claus.si';
const displayNumber = (value, decimals = 0, maximumFractionDigits = 4) => {
  const number = Number(value || 0) / (10 ** decimals);
  return Number.isFinite(number) ? number.toLocaleString('en-GB', { maximumFractionDigits }) : '—';
};
const eth = value => `${displayNumber(value, 18, 4)} ETH`;
const shortAddress = address => address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '—';
const captured = value => value ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Stockholm', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }).format(new Date(value)) : 'Capture time unavailable';
const utcTime = timestamp => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(Number(timestamp) * 1000));
const names = new Map(data.identities.map(identity => [identity.id, identity.name]));

function RouteLink({ to, navigate, children, ...props }) {
  return <a href={to} onClick={event => navigate?.(to, event)} {...props}>{children}</a>;
}

function Tabs({ value, onChange, options, label, prefix, className = '', panels = true }) {
  function keyboard(event) {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const buttons = [...event.currentTarget.parentElement.querySelectorAll('[role="tab"]')];
    const index = buttons.indexOf(event.currentTarget);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    onChange(options[next].value);
    buttons[next].focus();
  }
  return <><div className={`cp-tabs ${className}`} role={panels ? 'tablist' : 'group'} aria-label={label}>
    {options.map(option => <SourceButton key={option.value} id={`${prefix}-tab-${option.value}`} role={panels ? 'tab' : undefined} aria-selected={panels ? value === option.value : undefined} aria-pressed={!panels ? value === option.value : undefined} aria-controls={panels ? `${prefix}-panel-${option.value}` : undefined} tabIndex={panels ? value === option.value ? 0 : -1 : undefined} variant="ghost" onClick={() => onChange(option.value)} onKeyDown={panels ? keyboard : undefined}>{option.label}</SourceButton>)}
  </div>{panels && options.filter(option => option.value !== value).map(option => <div key={option.value} id={`${prefix}-panel-${option.value}`} role="tabpanel" aria-labelledby={`${prefix}-tab-${option.value}`} hidden />)}</>;
}

function ConnectDialog({ action, onClose, children }) {
  const lastTrigger = useRef(null);
  const lastAction = useRef(null);
  if (action) lastAction.current = action;
  if (action?.returnTo) lastTrigger.current = action.returnTo;
  const displayAction = action || lastAction.current;
  const route = displayAction?.route || '/Club';
  return <SourceDialog open={Boolean(action)} onOpenChange={open => { if (!open) onClose(); }} title={displayAction?.title || 'Connect wallet'} description={displayAction?.description || 'Continue on Claus to connect your wallet.'} className="cp-connect-dialog" onCloseAutoFocus={event => { event.preventDefault(); const target = lastTrigger.current?.isConnected ? lastTrigger.current : document.querySelector('.cp-club-workspace [role="tab"][aria-selected="true"], .cp-personal .cp-entry-actions button'); target?.focus(); }}>
    <div className="cp-connect-note"><Wallet size={24} aria-hidden="true" /><p>Wallet connection and transactions are handled by the original Claus service. Your wallet is currently disconnected here.</p></div>
    <p className="cp-wallet-list">The original wallet menu supports MetaMask, Phantom, and Rabby.</p>
    <SourceButton asChild className="cp-wide-button"><a href={`${SOURCE}${route}`} target="_blank" rel="noopener noreferrer">Continue on Claus <ExternalLink size={17} aria-hidden="true" /></a></SourceButton>
    {children}
  </SourceDialog>;
}

function usePublicStats(asset) {
  const [value, setValue] = useState(data.stats[asset]);
  const [state, setState] = useState('snapshot');
  const controller = useRef(null);
  useEffect(() => {
    controller.current?.abort();
    setValue(data.stats[asset]);
    setState('snapshot');
    return () => controller.current?.abort();
  }, [asset]);
  async function refresh() {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    const timeout = setTimeout(() => request.abort(), 8000);
    setState('loading');
    try {
      const response = await fetch(`${SOURCE}/api/staking-stats?asset=${asset}`, { signal: request.signal });
      if (!response.ok) throw new Error('Stats unavailable');
      const next = await response.json();
      if (next.asset !== asset || !next.metrics || !next.observedAt) throw new Error('Invalid stats');
      if (controller.current !== request) return;
      setValue(next);
      setState('updated');
    } catch {
      if (controller.current === request) setState('error');
    } finally {
      clearTimeout(timeout);
    }
  }
  return { value, state, refresh };
}

function StakingHistory({ open, onClose, asset, returnFocus }) {
  const [range, setRange] = useState('7');
  const [metric, setMetric] = useState('staked');
  const [history, setHistory] = useState(data.history[asset]['7']);
  const [state, setState] = useState('snapshot');
  const request = useRef(null);
  const prefix = useId();
  useEffect(() => {
    setHistory(data.history[asset][range]);
    setState('snapshot');
    request.current?.abort();
    return () => request.current?.abort();
  }, [asset, range]);
  async function refresh() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timer = setTimeout(() => controller.abort(), 8000);
    setState('loading');
    try {
      const response = await fetch(`${SOURCE}/api/staking-stats?asset=${asset}&view=history&days=${range}`, { signal: controller.signal });
      if (!response.ok) throw new Error('History unavailable');
      const next = await response.json();
      if (next.asset !== asset || !Array.isArray(next.points)) throw new Error('Invalid history');
      if (request.current !== controller) return;
      setHistory(next);
      setState('updated');
    } catch {
      if (request.current === controller) setState('error');
    } finally { clearTimeout(timer); }
  }
  const points = history?.points || [];
  const key = metric === 'paid' ? 'totalPaid' : asset === 'nft' ? 'staked' : 'claus';
  const decimals = key === 'staked' ? 0 : 18;
  const values = points.map(point => Number(point[key] || 0) / (10 ** decimals));
  const max = Math.max(1, ...values);
  const start = Number(points[0]?.timestamp || 0);
  const end = Number(points.at(-1)?.timestamp || start + 1);
  const polyline = values.map((value, index) => `${24 + ((Number(points[index].timestamp) - start) / Math.max(1, end - start)) * 592},${194 - value / max * 160}`).join(' ');
  const label = metric === 'paid' ? 'Total paid (ETH)' : asset === 'nft' ? 'NFTs staked' : 'CLAUS in liquidity';
  return <SourceDialog open={open} onOpenChange={next => { if (!next) onClose(); }} title={asset === 'nft' ? 'NFT staking' : 'Liquidity staking'} description="Public staking vault history, shown from captured source data." className="cp-history-dialog" onCloseAutoFocus={event => { event.preventDefault(); returnFocus.current?.focus(); }}>
    <div className="cp-history-controls">
      <Tabs value={metric} onChange={setMetric} options={[{ value: 'staked', label: 'Staked' }, { value: 'paid', label: 'Total paid' }]} label="History metric" prefix={`${prefix}-metric`} />
      <Tabs value={range} onChange={setRange} options={[{ value: '7', label: '7D' }, { value: '30', label: '30D' }]} label="History range" prefix={`${prefix}-range`} panels={false} />
    </div>
    <div id={`${prefix}-metric-panel-${metric}`} role="tabpanel" aria-labelledby={`${prefix}-metric-tab-${metric}`}>
      <div className="cp-chart-value"><span>{label}</span><strong>{points.length ? displayNumber(points.at(-1)[key], decimals, decimals ? 4 : 0) : '—'}</strong></div>
      {points.length ? <>
        <svg className="cp-history-chart" viewBox="0 0 640 220" role="img" aria-label={`${label} history; ${points.length} observations. Latest ${displayNumber(points.at(-1)[key], decimals, 4)}.`}><text x="24" y="22">{max.toLocaleString('en-GB', { maximumFractionDigits: decimals ? 4 : 0 })}</text><path d="M24 34H616M24 114H616M24 194H616" className="cp-chart-grid" /><polyline points={polyline} /><text x="24" y="211">0</text></svg>
        <div className="cp-chart-dates"><span>{utcTime(points[0].timestamp)} UTC</span><span>{utcTime(points.at(-1).timestamp)} UTC</span></div>
        <p className="cp-capture-note">Available history since {utcTime(points[0].timestamp)} UTC. Captured {captured(history.observedAt)}.</p>
      </> : <p className="cp-empty">No history was available in this capture.</p>}
    </div>
    <p className="cp-fetch-status" role="status">{state === 'error' ? 'Live history unavailable. The captured history remains visible.' : state === 'loading' ? 'Updating history…' : state === 'updated' ? 'History updated from Claus.' : ''}</p>
    <div className="cp-history-links"><SourceButton variant="ghost" onClick={refresh} disabled={state === 'loading'}><RefreshCw size={16} aria-hidden="true" />{state === 'loading' ? 'Updating…' : 'Refresh history'}</SourceButton><a href={`https://etherscan.io/address/${history?.vault}#readContract`} target="_blank" rel="noopener noreferrer">View contract <ExternalLink size={15} aria-hidden="true" /></a></div>
    <details className="cp-data-table"><summary>View data</summary><div className="cp-table-scroll"><table><thead><tr><th scope="col">Time (UTC)</th><th scope="col">{asset === 'nft' ? 'NFTs staked' : 'CLAUS in liquidity'}</th><th scope="col">Total paid (ETH)</th></tr></thead><tbody>{points.map(point => <tr key={point.timestamp}><td>{utcTime(point.timestamp)}</td><td>{displayNumber(point[asset === 'nft' ? 'staked' : 'claus'], asset === 'nft' ? 0 : 18, 2)}</td><td>{displayNumber(point.totalPaid, 18, 4)}</td></tr>)}</tbody></table></div></details>
  </SourceDialog>;
}

function PublicOverview({ asset }) {
  const { value, state, refresh } = usePublicStats(asset);
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyTrigger = useRef(null);
  const metrics = value.metrics;
  const columns = asset === 'nft'
    ? [['NFTs staked', displayNumber(metrics.staked), `of ${metrics.supply}`], ['Collection staked', `${displayNumber(metrics.shareBps, 2, 2)}%`], ['Staking wallets', displayNumber(metrics.activeStakers)]]
    : [['CLAUS in liquidity', `${displayNumber(metrics.claus, 24, 3)}M`, `${metrics.positions} positions`], ['ETH in liquidity', displayNumber(metrics.eth, 18, 4)], ['Staking wallets', displayNumber(metrics.activeStakers)]];
  return <section className="cp-summary" aria-label="Public staking overview">
    <div className="cp-overview-heading"><div><h2>Overview</h2>{asset === 'nft' && <p>Next payout {captured(value.periodEndsAt)}</p>}</div><SourceButton ref={historyTrigger} variant="ghost" onClick={() => setHistoryOpen(true)} aria-haspopup="dialog"><History size={16} aria-hidden="true" />History</SourceButton></div>
    <div className="cp-public-grid"><dl className="cp-metrics">{columns.map(([label, number, note]) => <div key={label}><dt>{label}</dt><dd>{number}</dd>{note && <small>{note}</small>}</div>)}</dl><dl className="cp-reward-metrics"><div><dt>Today's pool</dt><dd>{eth(metrics.currentPool)}</dd></div><div><dt>Total paid</dt><dd>{eth(metrics.totalPaid)}</dd></div></dl></div>
    <div className="cp-data-note"><p className="cp-capture-note">Read-only · Captured {captured(value.observedAt)}</p><SourceButton variant="ghost" size="sm" onClick={refresh} disabled={state === 'loading'} aria-label="Refresh public staking statistics"><RefreshCw size={14} aria-hidden="true" />{state === 'loading' ? 'Updating…' : 'Refresh'}</SourceButton></div>
    {state === 'error' && <p className="cp-fetch-status" role="status">Live statistics unavailable. Captured values remain visible. <a href={`${SOURCE}/api/staking-stats?asset=${asset}`} target="_blank" rel="noopener noreferrer">Open source data</a></p>}
    {state === 'updated' && <p className="cp-fetch-status" role="status">Updated from the public Claus service.</p>}
    <StakingHistory open={historyOpen} onClose={() => setHistoryOpen(false)} asset={asset} returnFocus={historyTrigger} />
  </section>;
}

function LiquidityActions({ connect }) {
  const [tab, setTab] = useState('provide');
  const [amount, setAmount] = useState('');
  const prefix = useId();
  const invalid = amount !== '' && !/^\d+(\.\d*)?$/.test(amount);
  return <details className="cp-liquidity-actions"><summary>Liquidity actions <ChevronDown size={16} aria-hidden="true" /></summary>
    <Tabs value={tab} onChange={setTab} options={[{ value: 'provide', label: 'Provide Liquidity' }, { value: 'withdraw', label: 'Withdraw' }]} label="Liquidity action" prefix={prefix} />
    <div id={`${prefix}-panel-${tab}`} role="tabpanel" aria-labelledby={`${prefix}-tab-${tab}`}>
      {tab === 'provide' ? <form className="cp-liquidity-form" onSubmit={event => { event.preventDefault(); if (!invalid) connect('Add liquidity'); }}>
        <div className="cp-form-field"><div className="cp-field-heading"><label htmlFor={`${prefix}-amount`}>CLAUS</label><span>Balance —</span></div><SourceInput id={`${prefix}-amount`} name="claus-amount" inputMode="decimal" placeholder="0" autoComplete="off" value={amount} onChange={event => setAmount(event.target.value)} aria-invalid={invalid} aria-describedby={`${prefix}-amount-note`} /><div className="cp-fractions"><SourceButton variant="ghost" size="sm" onClick={() => connect('Use 50% of your balance')}>50%</SourceButton><SourceButton variant="ghost" size="sm" onClick={() => connect('Use your maximum balance')}>Max</SourceButton></div></div>
        <div className="cp-eth-required"><span>ETH required</span><small>Balance —</small><strong>—</strong></div>
        <p id={`${prefix}-amount-note`} className={invalid ? 'cp-input-error' : 'cp-form-note'} role="status">{invalid ? 'Enter a valid non-negative decimal amount.' : 'Connect your wallet on Claus to see your balances and required ETH.'}</p>
        <SourceButton type="submit" disabled={invalid}>Add liquidity <ArrowRight size={17} aria-hidden="true" /></SourceButton>
        <p className="cp-form-note">Ethereum Mainnet · ETH + CLAUS · Full range · 0.5% slippage</p>
      </form> : <div className="cp-withdraw"><p>Back to your wallet</p><strong>— ETH</strong><p>— CLAUS</p><SourceButton onClick={() => connect('Withdraw liquidity')}>Withdraw liquidity <ArrowRight size={17} aria-hidden="true" /></SourceButton><p className="cp-form-note">Earned rewards will still be paid automatically. Connect on Claus to view your position.</p></div>}
    </div>
  </details>;
}

function CollectionBrowser({ connect }) {
  const [collection, setCollection] = useState(data.collection);
  const [fetchState, setFetchState] = useState('snapshot');
  const [tab, setTab] = useState('collection');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('number');
  const [visible, setVisible] = useState(12);
  const [selected, setSelected] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const request = useRef(null);
  const detailTrigger = useRef(null);
  const lastSelected = useRef(null);
  if (selected) lastSelected.current = selected;
  const displaySelected = selected || lastSelected.current;
  const prefix = useId();
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => setVisible(12), [query, filter, sort]);
  const filters = [{ value: 'all', label: 'All NFTs' }, { value: 'staked', label: 'Staked' }, { value: 'unstaked', label: 'Not staked' }, { value: 'listed', label: 'Listed' }];
  const filtered = useMemo(() => collection.items.filter(item => {
    const match = `${item.id} ${names.get(item.id) || ''}`.toLowerCase().includes(query.trim().replace(/^#/, '').toLowerCase());
    return match && (filter === 'all' || (filter === 'staked' && item.staked) || (filter === 'unstaked' && !item.staked) || (filter === 'listed' && item.listing));
  }).sort((a, b) => sort === 'reverse' ? b.id - a.id : sort === 'name' ? (names.get(a.id) || '').localeCompare(names.get(b.id) || '') : a.id - b.id), [collection, query, filter, sort]);
  async function refresh() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timer = setTimeout(() => controller.abort(), 8000);
    setFetchState('loading');
    try {
      const response = await fetch(`${SOURCE}/nfts.json`, { signal: controller.signal });
      if (!response.ok) throw new Error('Collection unavailable');
      const next = await response.json();
      if (!Array.isArray(next.items) || !next.observedAt || !next.config?.collection) throw new Error('Invalid collection');
      if (request.current !== controller) return;
      setCollection(next);
      setFetchState('updated');
    } catch { if (request.current === controller) setFetchState('error'); } finally { clearTimeout(timer); }
  }
  return <section className="cp-collection" aria-label="Browse Claus NFTs">
    <Tabs value={tab} onChange={setTab} options={[{ value: 'collection', label: 'Collection' }, { value: 'mine', label: 'Your NFTs' }]} label="NFT collection view" prefix={prefix} />
    <div id={`${prefix}-panel-${tab}`} role="tabpanel" aria-labelledby={`${prefix}-tab-${tab}`}>
      {tab === 'mine' ? <div className="cp-wallet-empty"><LockKeyhole size={26} aria-hidden="true" /><h2>Your NFTs</h2><p>Connect your wallet on Claus to see your NFTs, staking positions, and rewards.</p><SourceButton onClick={() => connect('View your NFTs')}>Connect wallet <ArrowRight size={17} aria-hidden="true" /></SourceButton></div> : <>
        <div className="cp-collection-intro"><div><h2>Meet the collection</h2><p>300 characters. 50,000 $CLAUS inside each one.</p></div><SourceButton variant="ghost" onClick={refresh} disabled={fetchState === 'loading'}><RefreshCw size={16} aria-hidden="true" />{fetchState === 'loading' ? 'Updating…' : 'Refresh'}</SourceButton></div>
        <p className="cp-edition-note">Monkey edition artwork · Original Claus NFT names and identifiers</p>
        <div className="cp-collection-toolbar"><div className="cp-search-field"><Search size={18} aria-hidden="true" /><label htmlFor={`${prefix}-search`} className="sr-only">Search NFTs by name or number</label><SourceInput id={`${prefix}-search`} type="search" name="nft-search" placeholder="Name or number…" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off" />{query && <SourceButton variant="ghost" size="icon" aria-label="Clear NFT search" onClick={() => setQuery('')}><X size={16} aria-hidden="true" /></SourceButton>}</div><SourcePopover open={filterOpen} onOpenChange={setFilterOpen} className="cp-filter-menu" align="end" trigger={<SourceButton variant="secondary"><Filter size={17} aria-hidden="true" />{filters.find(item => item.value === filter).label}<ChevronDown size={16} aria-hidden="true" /></SourceButton>}><fieldset><legend className="sr-only">Filter collection</legend>{filters.map(item => <label key={item.value}><input type="radio" name="collection-filter" checked={filter === item.value} onChange={() => { setFilter(item.value); setFilterOpen(false); }} />{item.label}</label>)}</fieldset></SourcePopover><label className="cp-sort-label"><span className="sr-only">Sort collection</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="number">Number: low to high</option><option value="reverse">Number: high to low</option><option value="name">Name: A–Z</option></select></label></div>
        <div className="cp-collection-meta"><span role="status">{filtered.length} {filtered.length === 1 ? 'NFT' : 'NFTs'}</span><span>Captured {captured(collection.observedAt)}</span></div>
        {fetchState === 'error' && <p className="cp-fetch-status" role="status">Live collection unavailable. Captured records remain visible. <a href={`${SOURCE}/nfts.json`} target="_blank" rel="noopener noreferrer">Open source data</a></p>}
        {filtered.length ? <div className="cp-nft-grid">{filtered.slice(0, visible).map(item => <SourceButton variant="secondary" className="cp-nft-card" key={item.id} onClick={event => { detailTrigger.current = event.currentTarget; setSelected(item); }} aria-label={`View Claus #${item.id}, ${names.get(item.id) || 'Claus'}, ${item.staked ? 'staked' : 'not staked'}`}><span className="cp-nft-art"><Monkey /><span className="cp-nft-number">#{item.id}</span></span><span className="cp-nft-card-copy"><strong>{names.get(item.id) || `Claus #${item.id}`}</strong><span>Claus #{item.id} <span>{item.staked ? 'Staked' : 'Not staked'}</span></span></span></SourceButton>)}</div> : <div className="cp-wallet-empty"><Search size={25} aria-hidden="true" /><h3>No matching NFTs</h3><p>{filter === 'listed' ? 'No listed NFTs appear in this collection capture.' : 'Try another name, number, or filter.'}</p><SourceButton variant="outline" onClick={() => { setQuery(''); setFilter('all'); }}>Reset filters</SourceButton></div>}
        {visible < filtered.length && <SourceButton variant="secondary" className="cp-show-more" onClick={() => setVisible(value => value + 12)}>Show more <span>{Math.min(12, filtered.length - visible)}</span><ArrowRight size={17} aria-hidden="true" /></SourceButton>}
        <div className="cp-collection-bottom"><p>Stake an NFT for daily ETH rewards. Unstake to redeem the tokens inside.</p><a href={`${SOURCE}/read/Hooks/NFTs`} target="_blank" rel="noopener noreferrer">Read the NFT guide <ExternalLink size={15} aria-hidden="true" /></a></div>
      </>}
    </div>
    <SourceDialog open={Boolean(selected)} onOpenChange={next => { if (!next) setSelected(null); }} title={displaySelected ? `Claus #${displaySelected.id}` : 'NFT'} description={displaySelected ? names.get(displaySelected.id) || 'Claus collection record' : ''} className="cp-nft-detail-dialog" onCloseAutoFocus={event => { event.preventDefault(); detailTrigger.current?.focus(); }}>
      {displaySelected && <><div className="cp-nft-detail-art"><Monkey /><Banana className="cp-nft-detail-banana" /></div><dl className="cp-nft-record"><div><dt>Staking status</dt><dd>{displaySelected.staked ? 'Staked' : 'Not staked'}</dd></div><div><dt>Owner</dt><dd><a href={`https://etherscan.io/address/${displaySelected.owner}`} target="_blank" rel="noopener noreferrer" title={displaySelected.owner}>{shortAddress(displaySelected.owner)}<ExternalLink size={14} aria-hidden="true" /></a></dd></div><div><dt>Backing</dt><dd>{collection.config.backingTokens} CLAUS</dd></div></dl><p className="cp-capture-note">Original NFT record, captured {captured(collection.observedAt)}. This artwork is the local monkey edition.</p><div className="cp-dialog-actions"><SourceButton onClick={() => { setSelected(null); connect(displaySelected.staked ? 'Manage NFT staking' : 'Stake an NFT'); }}>{displaySelected.staked ? 'Manage staking' : 'Stake'}<ArrowRight size={16} aria-hidden="true" /></SourceButton><SourceButton variant="outline" asChild><a href={`https://opensea.io/assets/ethereum/${collection.config.collection}/${displaySelected.id}`} target="_blank" rel="noopener noreferrer">View original NFT <ExternalLink size={16} aria-hidden="true" /></a></SourceButton></div></>}
    </SourceDialog>
  </section>;
}

export function StakingPage({ mode = 'token', navigate }) {
  const asset = /nft/i.test(mode) ? 'nft' : 'token';
  const [action, setAction] = useState(null);
  useEffect(() => setAction(null), [asset]);
  function connect(title = 'Connect wallet') { setAction({ title, description: asset === 'nft' ? 'Connect on Claus to stake NFTs and view personal rewards.' : 'Connect on Claus to provide or withdraw ETH + CLAUS liquidity.', route: asset === 'nft' ? '/Staking/NFT' : '/Staking/Token', returnTo: document.activeElement }); }
  return <div className={`community-page cp-staking-page cp-staking-${asset}`}>
    <nav className="cp-staking-navigation" aria-label="Staking asset"><RouteLink to="/Staking/Token" navigate={navigate} aria-current={asset === 'token' ? 'page' : undefined}>Token</RouteLink><RouteLink to="/Staking/NFT" navigate={navigate} aria-current={asset === 'nft' ? 'page' : undefined}>NFT</RouteLink></nav>
    <div className="cp-staking-shell"><section className="cp-personal"><div className="cp-entry-row"><div><h2>{asset === 'nft' ? 'Your NFTs' : 'Your liquidity'}</h2>{asset === 'token' && <p>ETH + CLAUS</p>}</div><div className="cp-entry-actions">{asset === 'nft' && <a href="https://opensea.io/collection/contractclaus" target="_blank" rel="noopener noreferrer">Buy one NFT now</a>}<SourceButton onClick={() => connect(asset === 'nft' ? 'Stake NFTs' : 'Connect wallet')}>{asset === 'nft' ? 'Stake' : 'Connect wallet'}</SourceButton></div></div>{asset === 'token' && <LiquidityActions connect={connect} />}</section><PublicOverview key={asset} asset={asset} /></div>
    {asset === 'nft' && <CollectionBrowser connect={connect} />}
    <ConnectDialog action={action} onClose={() => setAction(null)} />
  </div>;
}

export function ClubPage({ navigate }) {
  const [entered, setEntered] = useState(false);
  const [room, setRoom] = useState('chat');
  const [chatTab, setChatTab] = useState('chat');
  const [communityTab, setCommunityTab] = useState('voting');
  const [topicFilter, setTopicFilter] = useState('all');
  const [sort, setSort] = useState('liked');
  const [action, setAction] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchTrigger = useRef(null);
  const gateTrigger = useRef(null);
  const previousEntered = useRef(false);
  const prefix = useId();
  useEffect(() => {
    if (entered) document.getElementById(`${prefix}-tab-${room}`)?.focus();
    else if (previousEntered.current) gateTrigger.current?.focus();
    previousEntered.current = entered;
  }, [entered, prefix, room]);
  function connect(title = 'Enter Claus Club') { setAction({ title, description: 'The original club checks your wallet, NFT access, and linked X account.', route: '/Club', returnTo: document.activeElement }); }
  const emptyRoom = room === 'updates' ? ['Updates', 'Connect on Claus to read member updates.'] : room === 'community' ? [communityTab === 'voting' ? 'Voting' : 'Ideas', communityTab === 'voting' ? 'Member voting is available inside the original Claus Club.' : 'Connect on Claus to read, post, and support community ideas.'] : chatTab === 'topics' ? ['Topics', 'Connect on Claus to browse or follow member topics.'] : ['Message the club', 'Connect on Claus to read and send club messages.'];
  return <div className="community-page cp-club-page">
    {!entered ? <section className="cp-club-gate"><div className="cp-gate-art"><Monkey /></div><h2>Welcome to the Claus Club</h2><SourceButton ref={gateTrigger} size="lg" onClick={() => connect()}>Enter <ArrowRight size={18} aria-hidden="true" /></SourceButton><SourceButton variant="ghost" onClick={() => setEntered(true)}>Preview the club</SourceButton></section> : <section className="cp-club-workspace" aria-label="Claus Club public layout preview">
      <div className="cp-club-context"><div className="cp-guest-context"><LockKeyhole size={17} aria-hidden="true" /><span>Guest preview</span></div><div><SourceButton ref={searchTrigger} variant="ghost" onClick={() => { setQuery(''); setSearchOpen(true); }}><Search size={17} aria-hidden="true" />Search</SourceButton><SourceButton variant="ghost" onClick={() => connect('Catch up with the club')}>Catch up</SourceButton></div></div>
      <div className="cp-club-access"><p>Connect your wallet and X on Claus to access member rooms.</p><SourceButton onClick={() => connect('Connect wallet')}>Connect wallet <ArrowRight size={16} aria-hidden="true" /></SourceButton></div>
      <Tabs value={room} onChange={setRoom} options={[{ value: 'updates', label: 'Updates' }, { value: 'chat', label: 'Chat' }, { value: 'community', label: 'Community' }]} label="Club rooms" prefix={prefix} className="cp-room-tabs" />
      <div id={`${prefix}-panel-${room}`} role="tabpanel" aria-labelledby={`${prefix}-tab-${room}`} className="cp-room-panel">
        {room === 'updates' ? <div className="cp-room-heading"><h2>Updates</h2><SourceButton variant="ghost" size="icon" onClick={() => connect('Post an update')} aria-label="Post an update"><Plus size={20} aria-hidden="true" /></SourceButton></div> : room === 'chat' ? <><Tabs value={chatTab} onChange={setChatTab} options={[{ value: 'chat', label: 'Chat' }, { value: 'topics', label: 'Topics' }]} label="Chat view" prefix={`${prefix}-chat`} className="cp-small-tabs" panels={false} />{chatTab === 'topics' && <div className="cp-topic-filters"><SourceButton variant={topicFilter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setTopicFilter('all')} aria-pressed={topicFilter === 'all'}>All</SourceButton><SourceButton variant={topicFilter === 'following' ? 'default' : 'ghost'} size="sm" onClick={() => setTopicFilter('following')} aria-pressed={topicFilter === 'following'}>Following</SourceButton></div>}</> : <div className="cp-community-heading"><Tabs value={communityTab} onChange={setCommunityTab} options={[{ value: 'voting', label: 'Voting' }, { value: 'ideas', label: 'Ideas' }]} label="Community view" prefix={`${prefix}-community`} className="cp-small-tabs" panels={false} /><div>{communityTab === 'voting' ? <SourcePopover className="cp-voting-info" trigger={<SourceButton variant="ghost" size="icon" aria-label="About club voting"><Info size={18} aria-hidden="true" /></SourceButton>}><p>Voting and proposal actions require access to the original member club. This preview does not cast votes.</p></SourcePopover> : <label className="cp-sort-label"><span className="sr-only">Sort ideas</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="liked">Most liked</option><option value="newest">Newest</option><option value="oldest">Oldest</option></select></label>}<SourceButton variant="ghost" size="icon" onClick={() => connect(communityTab === 'voting' ? 'Create a vote' : 'Share an idea')} aria-label={communityTab === 'voting' ? 'Create a vote' : 'Share an idea'}><Plus size={20} aria-hidden="true" /></SourceButton></div></div>}
        <div className="cp-private-empty"><div className="cp-private-art">{room === 'chat' ? <Monkey /> : room === 'community' ? <Banana /> : <DropArt />}</div><h3>{emptyRoom[0]}</h3><p>{emptyRoom[1]}</p><SourceButton variant="outline" onClick={() => connect(`Open ${emptyRoom[0].toLowerCase()}`)}>Continue on Claus <ExternalLink size={16} aria-hidden="true" /></SourceButton></div>
        {room === 'chat' && chatTab === 'chat' && <div className="cp-composer"><SourceButton variant="ghost" size="icon" aria-label="Attach an image" onClick={() => connect('Attach an image')}><Plus size={20} aria-hidden="true" /></SourceButton><label className="sr-only" htmlFor={`${prefix}-message`}>Message the club</label><SourceInput id={`${prefix}-message`} name="club-message" placeholder="Connect on Claus to message the club…" disabled /><SourceButton variant="ghost" size="icon" aria-label="Connect to send a message" onClick={() => connect('Message the club')}><ArrowRight size={21} aria-hidden="true" /></SourceButton></div>}
      </div>
      <div className="cp-club-bottom"><SourceButton variant="ghost" onClick={() => setEntered(false)}>Back to welcome</SourceButton><RouteLink to="/Staking/NFT" navigate={navigate}>NFT staking <ArrowRight size={15} aria-hidden="true" /></RouteLink></div>
    </section>}
    <ConnectDialog action={action} onClose={() => setAction(null)}><SourceButton variant="ghost" className="cp-wide-button" onClick={() => { setAction(null); setEntered(true); }}>Preview the club layout</SourceButton></ConnectDialog>
    <SourceDialog open={searchOpen} onOpenChange={setSearchOpen} title="Search the club" description="Member content is available after signing in on the original Claus Club." className="cp-club-search-dialog" onCloseAutoFocus={event => { event.preventDefault(); searchTrigger.current?.focus(); }}><label className="sr-only" htmlFor={`${prefix}-club-search`}>Search messages, topics, updates, and ideas</label><SourceInput id={`${prefix}-club-search`} type="search" name="club-search" placeholder="Search messages, topics, updates…" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off" /><div className="cp-search-private" role="status"><LockKeyhole size={22} aria-hidden="true" /><p>{query ? `Search for “${query}” in the original member club.` : 'Connect on Claus to search private club content.'}</p></div><SourceButton className="cp-wide-button" onClick={() => { setSearchOpen(false); connect('Search the club'); }}>Continue on Claus <ExternalLink size={16} aria-hidden="true" /></SourceButton></SourceDialog>
  </div>;
}







