import React from 'react';
import buildArt from '../art/build.svg?raw';
import labArt from '../art/lab.svg?raw';

// Original Claus Build/Lab artwork is adapted to the requested yellow identity.
export function BuildArt() {
  return <div className="native-art build-art" dangerouslySetInnerHTML={{ __html: buildArt }} />;
}
export function LabArt() {
  return <div className="native-art lab-art" dangerouslySetInnerHTML={{ __html: labArt }} />;
}

export function Banana({ className = '', ...props }) {
  return <svg className={`banana ${className}`} viewBox="0 0 100 100" aria-hidden="true" {...props}>
    <path d="M78 14c7 20-2 46-20 58-18 13-39 12-48-2-4-6 1-12 7-9 19 10 44-8 47-26l3-16c1-5 7-9 11-5Z" fill="var(--color-yellow)" stroke="var(--color-ink)" strokeWidth="6" strokeLinejoin="round" />
    <path d="M16 69c20 13 52-10 55-34" fill="none" stroke="var(--color-cream)" strokeWidth="4" strokeLinecap="round" />
    <path d="m66 20 3-10q5-7 10-2l-2 12" fill="var(--color-yellow-deep)" stroke="var(--color-ink)" strokeWidth="5" strokeLinejoin="round" />
    <path d="M22 71c19 7 42-8 50-28" fill="none" stroke="var(--color-yellow-deep)" strokeWidth="3" strokeLinecap="round" />
  </svg>;
}

export function NftArt() {
  return <div className="nft-stack" aria-hidden="true">
    <span className="nft-card nft-back" />
    <span className="nft-card nft-middle" />
    <span className="nft-card nft-front"><Banana /></span>
  </div>;
}

export function TokenArt() {
  return <div className="token-art" aria-hidden="true">
    <svg className="token-coin" viewBox="0 0 250 250">
      <defs>
        <linearGradient id="coin-edge" x2="0.3" y2="1"><stop stopColor="var(--color-ink-soft)" /><stop offset="1" stopColor="var(--color-black)" /></linearGradient>
        <linearGradient id="coin-face" x2="0.8" y2="1"><stop stopColor="var(--color-ink-soft)" /><stop offset="1" stopColor="var(--color-ink)" /></linearGradient>
      </defs>
      <ellipse cx="119" cy="132" rx="95" ry="98" fill="url(#coin-edge)" />
      <circle cx="116" cy="121" r="95" fill="url(#coin-face)" stroke="var(--color-ink)" strokeWidth="3" />
      <circle cx="116" cy="121" r="80" fill="none" stroke="var(--color-yellow)" strokeWidth="5" />
      <circle cx="116" cy="121" r="73" fill="none" stroke="var(--color-cream)" strokeWidth="1" opacity=".45" />
      <path d="M49 98a73 73 0 0 1 94-44" fill="none" stroke="var(--color-cream)" strokeWidth="3" opacity=".6" strokeLinecap="round" />
      <g className="coin-hook-emblem" transform="translate(-7 3)" fill="none" stroke="var(--color-cream)" strokeLinecap="round" strokeLinejoin="round">
        <path d="M145 81v50a26 26 0 0 1-52 0v-15l13 13" strokeWidth="11" />
        <circle cx="145" cy="78" r="10" fill="var(--color-ink)" strokeWidth="6" />
      </g>
    </svg>
    <svg className="token-hook" viewBox="0 0 70 78">
      <rect x="6" y="10" width="58" height="60" rx="17" fill="var(--color-ink)" />
      <rect x="3" y="5" width="58" height="60" rx="17" fill="var(--color-yellow)" stroke="var(--color-ink)" strokeWidth="3" />
      <g fill="none" stroke="var(--color-ink)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="m23 23-9 12 9 12m19-24 9 12-9 12" />
      </g>
    </svg>
  </div>;
}

export function Monkey({ className = '', footer = false }) {
  const [failed, setFailed] = React.useState(false);
  return <div className={`monkey ${className} ${footer ? 'monkey-footer' : ''} ${failed ? 'monkey-failed' : ''}`} aria-hidden="true">
    {failed ? <svg viewBox="0 0 100 100" className="monkey-fallback"><circle cx="32" cy="43" r="14" fill="var(--color-ink)" /><circle cx="80" cy="43" r="14" fill="var(--color-ink)" /><ellipse cx="58" cy="37" rx="28" ry="31" fill="var(--color-ink)" /><ellipse cx="60" cy="41" rx="23" ry="20" fill="var(--color-tan)" /><path d="M37 47q23 23 46 0v10q-23 21-46 0Z" fill="var(--color-cream)" /><path d="M44 62q14 9 25 0l9 29H33Z" fill="var(--color-ink)" /><path d="M38 70C4 75 7 49 21 58" fill="none" stroke="var(--color-ink)" strokeWidth="10" strokeLinecap="round" /></svg>
      : <img src="/assets/monkey.png" width="1254" height="1254" alt="" draggable="false" fetchPriority={footer ? 'auto' : 'high'} onError={() => setFailed(true)} />}
    <span className="monkey-eye monkey-eye-left" data-eye data-range="5"><i className="pupil" /></span>
    <span className="monkey-eye monkey-eye-right" data-eye data-range="5"><i className="pupil" /></span>
  </div>;
}

export function ClubArt() {
  return <div className="club-art" aria-hidden="true">
    <Monkey className="club-monkey" />
    <svg className="club-message" viewBox="0 0 260 190">
      <path d="M35 63h171a20 20 0 0 1 20 20v62a20 20 0 0 1-20 20H86l-30 23-1-23H35a20 20 0 0 1-20-20V83a20 20 0 0 1 20-20Z" fill="var(--color-ink)" transform="translate(4 5) rotate(-8 130 120)" />
      <g transform="rotate(-8 130 120)">
        <path d="M35 63h171a20 20 0 0 1 20 20v62a20 20 0 0 1-20 20H86l-30 23-1-23H35a20 20 0 0 1-20-20V83a20 20 0 0 1 20-20Z" fill="var(--color-cream)" stroke="var(--color-ink)" strokeWidth="4" />
        <g fill="var(--color-ink)"><circle cx="80" cy="114" r="8" /><circle cx="116" cy="114" r="8" /><circle cx="152" cy="114" r="8" /></g>
      </g>
    </svg>
  </div>;
}

export function DropArt() {
  return <div className="drop-art" aria-hidden="true">
    <svg viewBox="0 0 160 190">
      <defs><linearGradient id="drop-ink" x2=".8" y2="1"><stop stopColor="var(--color-ink-soft)" /><stop offset=".6" stopColor="var(--color-ink)" /><stop offset="1" stopColor="var(--color-black)" /></linearGradient></defs>
      <path d="M80 7c-6 1-63 64-67 96-9 49 20 78 63 78s77-24 69-70C139 76 88 8 80 7Z" fill="url(#drop-ink)" />
    </svg>
    <span className="drop-eye drop-eye-left" data-eye data-range="5"><i className="pupil" /></span>
    <span className="drop-eye drop-eye-right" data-eye data-range="4"><i className="pupil" /></span>
  </div>;
}
