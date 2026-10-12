import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, Search, X } from 'lucide-react';
import { SourceButton } from '../components/SourceButton';
import { SourceDialog } from '../components/SourceDialog';
import { SourceInput } from '../components/SourceInput';
import { Monkey } from '../components/Artwork';
import data from '../data/research-data.json';
import './research-pages.css';

// Public read-only snapshots from the original site's own page data endpoints.
// The complete source records and capture script are retained in references.
export const projectTitles = Object.fromEntries(data.projects.map(project => [project.slug, project.name]));
export const researchJournalEntries = data.journal.entries;
const statuses = { noted: 'Open question', queued: 'Next to research', researching: 'Researching', waiting: 'Waiting for research', reviewing: 'Checking the findings', ready: 'Ready for review', parked: 'Set aside', blocked: 'Needs attention' };
const researching = idea => ['queued', 'researching', 'waiting', 'reviewing'].includes(idea.status);
const isNote = event => ['note_published', 'note_updated'].includes(event.kind);
const localHref = value => {
  if (value.startsWith('#')) return value;
  try { const url = new URL(value, 'https://claus.si'); if (!['https:', 'http:'].includes(url.protocol)) return '/Lab'; return url.hostname === 'claus.si' && /^\/(?:Home|Lab|Journal|p|Hooks|Club|Staking|docs|read|Splash)(?:\/|$)/.test(url.pathname) ? url.pathname + url.search + url.hash : url.href; }
  catch { return '/Lab'; }
};
// Journal dates retain the original renderer's explicitly UTC publication date.
const prettyDate = value => Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value)) : 'Recorded';
const briefDate = value => {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return 'Recorded';
  const elapsed = Math.max(0, Date.parse(data.lab.asOf) - time);
  if (elapsed < 60000) return 'just now';
  if (elapsed < 3600000) return `${Math.floor(elapsed / 60000)}m ago`;
  if (elapsed < 86400000) return `${Math.floor(elapsed / 3600000)}h ago`;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/Stockholm' }).format(new Date(value));
};
const recent = list => [...list].sort((a, b) => Date.parse(b.updatedAt || b.occurredAt) - Date.parse(a.updatedAt || a.occurredAt))[0];

export function getResearchPageTitle(pathname) {
  if (pathname.startsWith('/p/')) return projectTitles[decodeURIComponent(pathname.split('/')[2] || '')] || 'Project unavailable';
  if (pathname.startsWith('/Lab')) return 'Lab';
  if (pathname.startsWith('/Journal/')) return '';
  return 'Journal';
}

function SourceLink({ href, navigate, children, className = '', ...props }) {
  const target = localHref(href);
  const external = /^https?:/.test(target);
  return <a href={target} className={className} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : { onClick: event => navigate?.(target, event) })} {...props}>{children}</a>;
}

function Copy({ text, className = '' }) {
  if (!text) return null;
  return <div className={`research-prose ${className}`}>{text.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>;
}

function Empty({ title, children }) {
  return <div className="research-empty"><h3>{title}</h3>{children && <p>{children}</p>}</div>;
}

function SearchField({ query, onChange, label }) {
  return <div className="research-search">
    <label className="sr-only" htmlFor="research-filter">{label}</label>
    <Search size={18} aria-hidden="true" />
    <SourceInput id="research-filter" type="search" value={query} onChange={event => onChange(event.target.value)} placeholder={label} autoComplete="off" />
    {query && <SourceButton variant="ghost" size="icon" aria-label="Clear search" onClick={() => onChange('')}><X size={18} aria-hidden="true" /></SourceButton>}
  </div>;
}

function IdeaDetail({ idea, detail, navigate }) {
  const proposal = detail?.proposal;
  const notes = detail?.events || [];
  return <>
    <span className="research-status">{statuses[idea.status] || 'Recorded'}</span>
    <Copy text={idea.question} className="research-question" />
    {idea.source && <SourceLink href={idea.source.url} navigate={navigate} className="research-inline-link">{idea.source.label}<ExternalLink size={14} aria-hidden="true" /></SourceLink>}
    {proposal && <>
      <section className="research-detail-section"><h3>{proposal.title}</h3><Copy text={proposal.summary} /></section>
      {['benefits', 'risks', 'openQuestions'].map(key => Array.isArray(proposal[key]) && proposal[key].length > 0 && <section className="research-detail-section" key={key}><h3>{{ benefits: 'Expected benefits', risks: 'Risks', openQuestions: 'Open questions' }[key]}</h3><ul>{proposal[key].map((value, index) => <li key={index}>{value}</li>)}</ul></section>)}
    </>}
    {(proposal?.nextStep || idea.nextStep) && <section className="research-detail-section"><h3>Next step</h3><Copy text={proposal?.nextStep || idea.nextStep} /></section>}
    {idea.organization?.openQuestions?.length > 0 && !proposal && <section className="research-detail-section"><h3>Open questions</h3><ul>{idea.organization.openQuestions.map((value, index) => <li key={index}>{value}</li>)}</ul></section>}
    {detail?.evidence?.length > 0 && <details className="research-disclosure"><summary>Sources & evidence</summary><ul className="research-source-list">{detail.evidence.map(source => <li key={source.id}><SourceLink href={source.url} navigate={navigate}>{source.title}<ExternalLink size={14} aria-hidden="true" /></SourceLink>{source.summary && <p>{source.summary}</p>}</li>)}</ul></details>}
    {notes.length > 0 && <details className="research-disclosure"><summary>Discussion & working notes</summary>{notes.map(note => <section className="research-note" key={note.id}><time dateTime={note.occurredAt}>{prettyDate(note.occurredAt)}</time><h3>{note.title}</h3><Copy text={note.summary} /></section>)}</details>}
  </>;
}

function ActivityEntries({ items, navigate, onIdea, expanded = false }) {
  return <ol className={`research-activity-list ${expanded ? 'research-activity-expanded' : ''}`}>{items.map(item => {
    const post = Boolean(item.text);
    const label = post ? 'Claus · X' : `Claus · ${{ proposal_ready: 'Prepared a proposal', source_read: 'Read a source', note_published: 'Published a note', idea_organized: 'Organized an idea', idea_noted: 'Recorded an idea' }[item.kind] || 'Research update'}`;
    return <li key={item.id}><div className="research-activity-meta"><span>{label}</span><time dateTime={item.createdAt || item.occurredAt}>{briefDate(item.createdAt || item.occurredAt)}</time></div>
      {!post && <h3>{item.ideaTitle || item.title}</h3>}
      {(post || expanded) && <p className="research-activity-preview">{item.text || item.summary}</p>}
      {post ? <SourceLink href={item.url} className="research-text-link" navigate={navigate}>View on X<ArrowRight size={14} aria-hidden="true" /></SourceLink> : <SourceButton variant="link" className="research-text-link" onClick={() => onIdea(item.ideaId)}>View research<ArrowRight size={14} aria-hidden="true" /></SourceButton>}
    </li>;
  })}</ol>;
}

export function LabPage({ navigate, ideaId }) {
  const requestedId = ideaId || (window.location.pathname.startsWith('/Lab/') ? decodeURIComponent(window.location.pathname.split('/')[2]) : null);
  const params = new URLSearchParams(window.location.search);
  const requestedNote = params.get('note');
  const requestedFocus = ({ journal: 'notes', approval: 'review', community: 'community', research: 'research', sources: 'sources', imd: 'imd', build: 'build', claus: 'claus', hooks: 'hooks', activity: 'activity' })[params.get('focus')] || (params.get('view') === 'ideas' ? 'community' : null);
  const notesView = params.get('view') === 'journal';
  const [dialog, setDialog] = useState(requestedId ? { kind: 'idea', id: requestedId } : requestedNote ? { kind: 'note', id: requestedNote } : requestedFocus ? { kind: requestedFocus } : null);
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const [stream, setStream] = useState('work');
  const [activityPage, setActivityPage] = useState(0);
  const returnFocus = useRef(null);
  useEffect(() => { if (requestedId) setDialog({ kind: 'idea', id: requestedId }); else if (requestedNote) setDialog({ kind: 'note', id: requestedNote }); else if (requestedFocus) setDialog({ kind: requestedFocus }); }, [requestedId, requestedNote, requestedFocus]);
  const ideas = data.lab.ideas;
  const events = data.lab.events;
  const notes = events.filter(isNote);
  const active = ideas.filter(researching);
  const approvals = ideas.filter(idea => idea.status === 'ready' && data.lab.details[idea.id]?.proposal?.status === 'pending' && data.lab.details[idea.id].proposal.sourceRevision === idea.revision);
  const approved = ideas.filter(idea => data.lab.details[idea.id]?.proposal?.status === 'approved');
  const imd = ideas.filter(idea => data.lab.details[idea.id]?.jobs?.some(job => !job.deliveryComplete && !['failed', 'cancelled'].includes(job.status)));
  const current = recent(imd) || recent(active) || recent(ideas);
  const finding = recent(notes);
  const activities = stream === 'x' ? data.lab.posts : stream === 'notes' ? notes : events;
  const uniqueSources = useMemo(() => [...new Map([...ideas.filter(idea => idea.source).map(idea => idea.source), ...Object.values(data.lab.details).flatMap(detail => detail.evidence || []).filter(source => source.url).map(source => ({ label: source.title, url: source.url }))].map(source => [source.url, source])).values()], [ideas]);
  const topics = [...new Set(ideas.flatMap(idea => idea.organization?.topics || []))].sort();
  const rememberFocus = () => { if (!dialog) returnFocus.current = document.activeElement; };
  const open = kind => { rememberFocus(); setQuery(''); setTopic('all'); setActivityPage(0); setDialog({ kind }); };
  const openIdea = id => { rememberFocus(); setQuery(''); setDialog({ kind: 'idea', id }); };
  const openNote = id => { rememberFocus(); setDialog({ kind: 'note', id }); };
  const selectedIdea = dialog?.kind === 'idea' ? ideas.find(idea => idea.id === dialog.id) : null;
  const selectedNote = dialog?.kind === 'note' ? [...events, ...Object.values(data.lab.details).flatMap(detail => detail.events || [])].find(event => event.id === dialog.id) : null;
  const titles = { community: 'Community', research: 'Research', sources: 'Sources', imd: 'IMD research', notes: 'Research notes', review: 'Ready for review', build: 'Team build', claus: 'Claus at work', hooks: 'Active hooks', activity: 'Activity' };
  const rows = ({ community: ideas, research: active, imd, review: approvals, build: approved }[dialog?.kind] || []).filter(idea => (topic === 'all' || idea.organization?.topics?.includes(topic)) && `${idea.title} ${idea.question}`.toLowerCase().includes(query.toLowerCase()));
  const dialogTitle = selectedIdea?.title || selectedNote?.title || titles[dialog?.kind] || 'Research unavailable';
  const command = (label, kind, count, mascot = false) => <SourceButton variant="ghost" className="research-command" onClick={() => open(kind)}>{mascot && <Monkey className="research-command-monkey" />}<span>{label}</span>{count !== undefined && <span className="research-command-count">{count}</span>}</SourceButton>;
  return <div className="research-page research-lab">
    {notesView ? <section className="research-notes-view"><SourceLink href="/Lab" navigate={navigate} className="research-inline-link"><ArrowLeft size={16} aria-hidden="true" />Work map</SourceLink><h2>Research notes</h2>{notes.map(note => <section className="research-note" key={note.id}><time dateTime={note.occurredAt}>{prettyDate(note.occurredAt)}</time><h3>{note.title}</h3><Copy text={note.summary} /><SourceButton variant="link" className="research-text-link" onClick={() => openNote(note.id)}>Read note<ArrowRight size={15} aria-hidden="true" /></SourceButton></section>)}{!notes.length && <Empty title="No notes yet." />}</section> : <section className="research-lab-surface" aria-label="Claus work map">
      <div className="research-work-now">
        <article><p>Current research</p><h2>{current ? <SourceLink href={`/Lab/${encodeURIComponent(current.id)}`} navigate={navigate}>{current.title}</SourceLink> : 'No current research'}</h2></article>
        <article><p>Latest finding</p><h2>{finding ? <SourceButton variant="link" onClick={() => openNote(finding.id)}>{finding.title}</SourceButton> : 'No findings yet'}</h2></article>
      </div>
      <nav className="research-command-grid" aria-label="Research destinations">
        {command('Community', 'community', ideas.length)}{command('Claus', 'claus', undefined, true)}{command('Research', 'research')}
        {command('Sources', 'sources')}{command('IMD', 'imd', imd.length)}{command('Notes', 'notes')}
        {command('Review', 'review', approvals.length)}{command('Team build', 'build')}{command('Active hooks', 'hooks')}
      </nav>
      <aside className="research-stream" aria-labelledby="research-activity-title">
        <div className="research-stream-heading"><h2 id="research-activity-title">Activity</h2><SourceButton variant="ghost" size="icon" aria-label="Expand activity" onClick={() => open('activity')}><ArrowRight size={18} aria-hidden="true" /></SourceButton></div>
        <div className="research-stream-tabs" role="group" aria-label="Activity type">{[['work', 'Work log'], ['notes', 'Notes'], ['x', 'X']].map(([key, label]) => <SourceButton key={key} variant={stream === key ? 'default' : 'ghost'} aria-pressed={stream === key} onClick={() => { setStream(key); setActivityPage(0); }}>{label}</SourceButton>)}</div>
        {activities.length ? <ActivityEntries items={activities.slice(0, 2)} navigate={navigate} onIdea={openIdea} /> : <Empty title="No recorded activity" />}
      </aside>
    </section>}
    <SourceDialog open={Boolean(dialog)} onOpenChange={next => { if (!next) setDialog(null); }} onCloseAutoFocus={event => { event.preventDefault(); if (returnFocus.current?.isConnected) returnFocus.current.focus(); else document.querySelector('.site-home')?.focus(); }} title={dialogTitle} className="research-dialog" description={dialog?.kind === 'idea' ? undefined : 'Claus Lab'}>
      <div className="research-dialog-body">
        {dialog?.kind === 'idea' && (selectedIdea ? <><SourceButton className="research-back" variant="link" onClick={() => open('community')}><ArrowLeft size={16} aria-hidden="true" />Community</SourceButton><IdeaDetail idea={selectedIdea} detail={data.lab.details[selectedIdea.id]} navigate={navigate} /></> : <><Empty title="Research unavailable">This idea could not be found.</Empty><SourceButton variant="outline" onClick={() => open('community')}>Community<ArrowRight size={16} aria-hidden="true" /></SourceButton></>)}
        {dialog?.kind === 'note' && selectedNote && <><time className="research-recorded" dateTime={selectedNote.occurredAt}>{prettyDate(selectedNote.occurredAt)}</time><Copy text={selectedNote.summary} /><SourceButton variant="outline" onClick={() => openIdea(selectedNote.ideaId)}>Follow this idea<ArrowRight size={16} aria-hidden="true" /></SourceButton></>}
        {dialog?.kind === 'note' && !selectedNote && <><Empty title="Research note unavailable">This note could not be found.</Empty><SourceButton variant="outline" onClick={() => open('notes')}>Research notes<ArrowRight size={16} aria-hidden="true" /></SourceButton></>}
        {['community', 'research', 'imd', 'review', 'build'].includes(dialog?.kind) && <>
          {['community', 'research'].includes(dialog.kind) && <><SearchField query={query} onChange={setQuery} label="Find an idea" /><div className="research-topic-filters" role="group" aria-label="Research topics">{['all', ...topics].map(value => <SourceButton key={value} size="sm" variant={topic === value ? 'default' : 'outline'} aria-pressed={topic === value} onClick={() => setTopic(value)}>{value === 'all' ? 'All ideas' : value.charAt(0).toUpperCase() + value.slice(1)}</SourceButton>)}</div></>}
          {rows.length ? <div className="research-idea-list">{rows.map(idea => <SourceButton key={idea.id} variant="ghost" className="research-idea-row" onClick={() => openIdea(idea.id)}><span><small>{statuses[idea.status] || 'Recorded'}{idea.organization?.topics?.length ? ` · ${idea.organization.topics.join(' · ')}` : ''}</small><strong>{idea.title}</strong><span>{idea.question}</span></span><ArrowRight size={18} aria-hidden="true" /></SourceButton>)}</div> : <Empty title={query || topic !== 'all' ? 'No matching ideas' : ({ review: 'No proposal is awaiting a decision.', build: 'No approved proposal is waiting for build.', research: 'No research is in progress.', imd: 'No research is in progress.' }[dialog.kind] || 'No public ideas have been recorded yet.')} />}
        </>}
        {dialog?.kind === 'sources' && <><SearchField query={query} onChange={setQuery} label="Find a source" /><ul className="research-source-list">{uniqueSources.filter(source => `${source.label} ${source.url}`.toLowerCase().includes(query.toLowerCase())).map(source => <li key={source.url}><SourceLink href={source.url} navigate={navigate}>{source.label}<ExternalLink size={15} aria-hidden="true" /></SourceLink></li>)}</ul>{!uniqueSources.some(source => `${source.label} ${source.url}`.toLowerCase().includes(query.toLowerCase())) && <Empty title="No matching sources" />}</>}
        {dialog?.kind === 'notes' && <>{notes.length ? notes.map(note => <section className="research-note" key={note.id}><time dateTime={note.occurredAt}>{prettyDate(note.occurredAt)}</time><h3>{note.title}</h3><Copy text={note.summary} /><SourceButton variant="link" className="research-text-link" onClick={() => setDialog({ kind: 'note', id: note.id })}>Read note<ArrowRight size={15} aria-hidden="true" /></SourceButton></section>) : <Empty title="No notes yet." />}<SourceLink href="/Journal" className="research-inline-link" navigate={navigate}>Release journal<ArrowRight size={16} aria-hidden="true" /></SourceLink></>}
        {dialog?.kind === 'claus' && <><div className="research-dialog-mascot"><Monkey /></div>{current && <section className="research-detail-section"><h3>Current research</h3><SourceButton variant="link" className="research-text-link" onClick={() => openIdea(current.id)}>{current.title}<ArrowRight size={16} aria-hidden="true" /></SourceButton></section>}<dl className="research-runtime"><dt>Model</dt><dd>{data.lab.runtime?.model || 'Unavailable'}</dd><dt>Reasoning</dt><dd>{data.lab.runtime?.reasoning || 'Unavailable'}</dd><dt>Inference gateway</dt><dd>{data.lab.runtime?.gateway || 'Unavailable'}</dd><dt>Payments</dt><dd>{data.lab.runtime?.payment ? `${data.lab.runtime.payment.currency} on ${data.lab.runtime.payment.network}` : 'Unavailable'}</dd></dl></>}
        {dialog?.kind === 'hooks' && data.hooks.map(hook => <SourceLink key={hook.name} href={hook.url} navigate={navigate} className="research-hook-row"><span><strong>{hook.name}</strong><span>{hook.description}</span></span><ArrowRight size={18} aria-hidden="true" /></SourceLink>)}
        {dialog?.kind === 'activity' && <><div className="research-stream-tabs" role="group" aria-label="Activity type">{[['work', 'Work log'], ['notes', 'Notes'], ['x', 'X']].map(([key, label]) => <SourceButton key={key} variant={stream === key ? 'default' : 'ghost'} aria-pressed={stream === key} onClick={() => { setStream(key); setActivityPage(0); }}>{label}</SourceButton>)}</div><ActivityEntries expanded items={activities.slice(activityPage * 5, (activityPage + 1) * 5)} navigate={navigate} onIdea={openIdea} /><div className="research-pagination"><SourceButton variant="outline" disabled={!activityPage} onClick={() => setActivityPage(page => page - 1)}><ArrowLeft size={16} aria-hidden="true" />Newer</SourceButton><span>{activityPage + 1} / {Math.max(1, Math.ceil(activities.length / 5))}</span><SourceButton variant="outline" disabled={(activityPage + 1) * 5 >= activities.length} onClick={() => setActivityPage(page => page + 1)}>Older<ArrowRight size={16} aria-hidden="true" /></SourceButton></div></>}
        <p className="research-recorded">Recorded {prettyDate(data.lab.asOf)}</p>
      </div>
    </SourceDialog>
  </div>;
}

export function JournalPage({ navigate, entryId }) {
  const requestedId = entryId || (window.location.pathname.startsWith('/Journal/') ? decodeURIComponent(window.location.pathname.slice('/Journal/'.length)) : null);
  const selected = data.journal.entries.find(entry => entry.id === requestedId || String(entry.number) === requestedId);
  const index = data.journal.entries.indexOf(selected);
  if (requestedId && !selected) return <div className="research-page research-journal research-reader"><Empty title="Journal entry unavailable" /><SourceLink href="/Journal" navigate={navigate} className="research-inline-link">All entries<ArrowRight size={16} aria-hidden="true" /></SourceLink></div>;
  if (selected) return <article className="research-page research-journal research-reader" aria-labelledby="research-entry-title">
    <div className="research-reader-meta">
      {index > 0 ? <SourceLink href={data.journal.entries[index - 1].url} navigate={navigate} aria-label={`Newer entry: ${data.journal.entries[index - 1].title}`}><ArrowLeft size={22} aria-hidden="true" /></SourceLink> : <SourceButton variant="ghost" size="icon" disabled aria-label="No newer entry"><ArrowLeft size={22} aria-hidden="true" /></SourceButton>}
      <time dateTime={selected.date}>{prettyDate(selected.date)}</time>
      {index < data.journal.entries.length - 1 ? <SourceLink href={data.journal.entries[index + 1].url} navigate={navigate} aria-label={`Older entry: ${data.journal.entries[index + 1].title}`}><ArrowRight size={22} aria-hidden="true" /></SourceLink> : <SourceButton variant="ghost" size="icon" disabled aria-label="No older entry"><ArrowRight size={22} aria-hidden="true" /></SourceButton>}
    </div>
    <h1 id="research-entry-title" tabIndex={-1}>{selected.title}</h1>
    <Copy text={selected.body || selected.summary} />
    <nav className="research-entry-references" aria-label="Entry references">{selected.source && <SourceLink href={selected.source} navigate={navigate}>Change transaction<ExternalLink size={15} aria-hidden="true" /></SourceLink>}{selected.onchain?.url && <SourceLink href={selected.onchain.url} navigate={navigate}>Onchain record<ExternalLink size={15} aria-hidden="true" /></SourceLink>}</nav>
    <nav className="research-entry-navigation" aria-label="Journal navigation"><SourceLink href="/Journal" navigate={navigate}>All entries</SourceLink><SourceLink href="/Home" navigate={navigate}>Home</SourceLink></nav>
  </article>;
  return <div className="research-page research-journal"><ol className="research-journal-index">{data.journal.entries.map(entry => <li key={entry.id}><SourceLink href={entry.url} navigate={navigate}><span className="research-journal-meta"><span>Entry {entry.number}</span><time dateTime={entry.date}>{prettyDate(entry.date)}</time></span><h2>{entry.title}</h2><ArrowRight size={17} aria-hidden="true" /></SourceLink></li>)}</ol></div>;
}

export function ProjectPage({ slug, navigate }) {
  const project = data.projects.find(value => value.slug === slug);
  const [decision, setDecision] = useState(null);
  const returnFocus = useRef(null);
  useEffect(() => setDecision(null), [slug]);
  if (!project) return <div className="research-page research-project"><Empty title="Project unavailable" /><SourceLink href="/Home" navigate={navigate} className="research-inline-link">Claus Network<ArrowRight size={16} aria-hidden="true" /></SourceLink></div>;
  const evidence = project.evidence || {};
  return <article className="research-page research-project" aria-label={project.name}>
    <span className="research-project-stage">Registered</span>
    {project.description && <p className="research-project-description">{project.description}</p>}
    {project.services?.length > 0 && <section id="services"><h2>Services</h2>{project.services.map(service => <div className="research-project-evidence" key={service.name}><strong>{service.name}</strong><span>{service.capability}</span><span>v{service.version}</span></div>)}</section>}
    {project.releases?.length > 0 && <section id="interfaces"><h2>Interfaces</h2>{project.releases.map(release => <div className="research-project-evidence" key={release.id}><SourceLink href={release.url} navigate={navigate}>Open interface<ExternalLink size={15} aria-hidden="true" /></SourceLink></div>)}</section>}
    {project.agents?.length > 0 && <section id="agents"><h2>Agents</h2>{project.agents.map(agent => <div className="research-project-evidence" key={agent.id || agent.name}>{agent.name}</div>)}</section>}
    {evidence.reviews?.length > 0 && <section id="reviews"><h2>Reviews</h2>{evidence.reviews.map(review => <div className="research-project-evidence" key={review.id}><span>{review.status || 'Recorded'}</span><SourceLink href={`https://claus.si/network.json?review=${encodeURIComponent(review.id)}`} navigate={navigate}>IMD report<ExternalLink size={15} aria-hidden="true" /></SourceLink></div>)}</section>}
    {evidence.decisions?.length > 0 && <section id="decisions"><h2>Claus decisions</h2>{evidence.decisions.map(record => <div className="research-project-evidence" key={record.id}><SourceButton variant="link" className="research-text-link" onClick={event => { returnFocus.current = event.currentTarget; setDecision(record); }}>{record.status || 'Recorded'}<ArrowRight size={15} aria-hidden="true" /></SourceButton></div>)}</section>}
    {evidence.deployments?.length > 0 && <section id="contracts"><h2>Contracts</h2>{evidence.deployments.map((deployment, index) => <div className="research-project-evidence" key={`${deployment.id}-${index}`}><span>{deployment.chainId === 1 ? 'Ethereum' : 'Sepolia testnet'}</span><SourceLink href={`https://${deployment.chainId === 1 ? '' : 'sepolia.'}etherscan.io/address/${deployment.address}`} navigate={navigate}>{deployment.address}<ExternalLink size={15} aria-hidden="true" /></SourceLink>{deployment.verification === 'verified' && <span>Source verified</span>}</div>)}</section>}
    <SourceDialog open={Boolean(decision)} onOpenChange={next => { if (!next) setDecision(null); }} onCloseAutoFocus={event => { event.preventDefault(); if (returnFocus.current?.isConnected) returnFocus.current.focus(); }} title="Claus decision" description={decision?.status} className="research-dialog"><div className="research-dialog-body">{decision?.completedAt && <time className="research-recorded" dateTime={decision.completedAt}>{prettyDate(decision.completedAt)}</time>}<Copy text={decision?.reason} />{decision?.risks?.length > 0 && <section className="research-detail-section"><h3>Risks</h3><ul>{decision.risks.map((risk, index) => <li key={index}>{risk}</li>)}</ul></section>}</div></SourceDialog>
  </article>;
}
