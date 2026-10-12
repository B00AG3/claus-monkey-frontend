import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import SourceButton from '../components/SourceButton.jsx';
import SourceInput from '../components/SourceInput.jsx';
import SourceDialog from '../components/SourceDialog.jsx';
import { BuildArt, LabArt, NftArt, TokenArt, ClubArt, DropArt, Monkey } from '../components/Artwork.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import { PROJECTS, WORLDS } from '../data.js';

const ARTWORK = { build: BuildArt, lab: LabArt, nft: NftArt, hooks: TokenArt, club: ClubArt, staking: DropArt };

export default function HomePage({navigate}) {
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [onchainOpen, setOnchainOpen] = useState(false);
  const [highlightedWorld, setHighlightedWorld] = useState(null);
  const browseRef = useRef(null);
  const highlightTimer = useRef(null);


  useEffect(() => {
    function reset() {
      clearTimeout(highlightTimer.current);
      setHighlightedWorld(null);
      window.ClausInk?.instance?.cancel();
    }
    function key(event) {
      if (event.key === 'Escape') reset();
    }
    window.addEventListener('pageshow', reset);
    window.addEventListener('keydown', key);
    window.addEventListener('blur', reset);
    return () => {
      clearTimeout(highlightTimer.current);
      window.removeEventListener('pageshow', reset);
      window.removeEventListener('keydown', key);
      window.removeEventListener('blur', reset);
    };
  }, []);

  useEffect(() => {
    if (directoryOpen || onchainOpen) {
      clearTimeout(highlightTimer.current);
      setHighlightedWorld(null);
    }
  }, [directoryOpen, onchainOpen]);

  function highlightWorld(id) {
    clearTimeout(highlightTimer.current);
    if (!directoryOpen && !onchainOpen) setHighlightedWorld(id);
  }
  function releaseWorld() {
    clearTimeout(highlightTimer.current);
    // Match the original's 70ms grace when crossing between neighboring objects.
    highlightTimer.current = setTimeout(() => {
      setHighlightedWorld(document.querySelector('.world:focus-visible')?.dataset.world || null);
    }, 70);
  }
  function worldEvents(id) {
    return {
      'data-world': id,
      onPointerEnter: event => { if (event.pointerType !== 'touch') highlightWorld(id); },
      onPointerLeave: releaseWorld,
      onFocus: event => { if (event.currentTarget.matches(':focus-visible')) highlightWorld(id); },
      onBlur: releaseWorld,
    };
  }

  function follow(event) {
    clearTimeout(highlightTimer.current);
    setHighlightedWorld(null);
    navigate(event.currentTarget.getAttribute('href'), event);
  }


  const filtered = PROJECTS.filter(project => `${project.name} ${project.slug} ${project.detail}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <>
    <a className="skip-link" href="#main">Skip to the network</a>
    <main className="network-main" id="main">
      <h1 className="sr-only">Claus Network — Monkey edition</h1>
      <section className="scene" aria-label="Explore Claus Network">
        <div className="illustrated-map">
          <a className="world world-core" href="/Journal" onClick={follow} aria-label="Claus Journal" {...worldEvents('core')}>
            <span className="object"><Monkey /><span className="mascot-ground" /></span>
            <span className="world-name">Journal <ArrowRight size={14} aria-hidden="true" /></span>
          </a>
          {WORLDS.map(({ id, label, path }) => {
            const Artwork = ARTWORK[id];
            return <a key={id} className={`world world-${id}${highlightedWorld && highlightedWorld !== id ? ' world-dim' : ''}`} href={path} aria-label={label} onClick={follow} {...worldEvents(id)}>
              <span className="object"><Artwork /></span>
              <span className="world-name">{label} <ArrowRight size={14} aria-hidden="true" /></span>
            </a>;
          })}
        </div>

        <nav className="project-rails" aria-label="Registered projects">
          {[0, 1].map(column => <div key={column} className={`project-rail rail-${column ? 'right' : 'left'}`}>
            {PROJECTS.filter((_, index) => index % 2 === column).map(project => <SourceButton key={project.slug} asChild variant="secondary" className="project-link">
              <a href={`/p/${project.slug}`} onClick={follow} aria-label={project.name}>
                <project.Icon className="project-icon" size={27} strokeWidth={2.1} aria-hidden="true" />
                <span>{project.label}</span>
                <ArrowRight className="button-arrow" size={21} strokeWidth={1.7} aria-hidden="true" />
              </a>
            </SourceButton>)}
          </div>)}
        </nav>

        <SourceButton ref={browseRef} className="browse-projects" aria-label="Browse all 10 projects" aria-haspopup="dialog" onClick={() => { setQuery(''); setDirectoryOpen(true); }}>
          <span>Projects</span><span className="browse-count">{PROJECTS.length}</span><ArrowRight className="button-arrow" size={21} aria-hidden="true" />
        </SourceButton>
      </section>
    </main>

    <SiteFooter onOpenChange={setOnchainOpen} />

    <SourceDialog open={directoryOpen} onOpenChange={setDirectoryOpen} title="Projects" description="Explore the 10 registered projects." closeLabel="Close projects" className="projects-dialog" onCloseAutoFocus={event => { event.preventDefault(); browseRef.current?.focus(); }}>
      <div className="project-search">
        <Search size={19} aria-hidden="true" />
        <label className="sr-only" htmlFor="project-search">Find a project</label>
        <SourceInput id="project-search" name="project-search" type="search" placeholder="Find a project…" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off" spellCheck={false} />
        {query && <SourceButton variant="ghost" size="icon" aria-label="Clear search" className="clear-search" onClick={() => { setQuery(''); document.getElementById('project-search')?.focus(); }}><X size={17} aria-hidden="true" /></SourceButton>}
      </div>
      <p className="search-result-count" aria-live="polite">{query ? `${filtered.length} ${filtered.length === 1 ? 'project' : 'projects'} found` : 'All projects'}</p>
      <div className="directory-list">
        {filtered.length ? filtered.map(project => <a className="directory-project" key={project.slug} href={`/p/${project.slug}`} onClick={follow}>
          <project.Icon size={24} strokeWidth={1.8} aria-hidden="true" />
          <span><strong>{project.name}</strong><small>{project.detail}</small></span>
          <ArrowRight size={19} aria-hidden="true" />
        </a>) : <div className="empty-search"><Search size={30} aria-hidden="true" /><h3>No projects found</h3><p>Try another name or clear your search.</p><SourceButton variant="outline" onClick={() => setQuery('')}>Clear search</SourceButton></div>}
      </div>
    </SourceDialog>
  </>;
}

