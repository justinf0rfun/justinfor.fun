import { forwardRef, type ReactNode } from "react";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import { finds, findDrawers, type Find } from "../data/finds";
import { cardSpring, drawerSpring } from "../lib/finds-motion";
import "./finds/FindsReader.css";

const date = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
const paragraphs = (text: string) => text.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>);

const ReadingNote = forwardRef<HTMLElement, { id: string; reduced: boolean; children: ReactNode }>(({ id, reduced, children }, ref) => {
  const present = useIsPresent();
  return <motion.article ref={ref} className="finds-reader-note" data-finds-article={id} inert={!present} aria-hidden={!present}
    style={{ pointerEvents: present ? "auto" : "none" }}
    initial={{ opacity: 0, x: reduced ? 0 : 36 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduced ? 0 : -36 }}
    transition={reduced ? { duration: 0 } : drawerSpring}>{children}</motion.article>;
});

const FindsReader = forwardRef<HTMLElement, { note: Find; trail: string[]; reduced: boolean; onClose: () => void; onFollow: (id: string) => void }>(({ note, trail, reduced, onClose, onFollow }, ref) => {
  const present = useIsPresent();
  return <motion.section ref={ref} className="finds-reader" data-finds-reader tabIndex={-1} aria-label={`Reading ${note.title}`} inert={!present}
    style={{ pointerEvents: present ? "auto" : "none" }}
    initial={{ opacity: 0, y: reduced ? 0 : 72, scale: reduced ? 1 : .94, rotate: reduced ? 0 : 3 }}
    animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }} exit={{ opacity: 0, y: reduced ? 0 : 72, scale: reduced ? 1 : .94, rotate: reduced ? 0 : 3 }}
    transition={reduced ? { duration: 0 } : cardSpring}>
    <div className="finds-reader-toolbar">
      <button type="button" className="finds-reader-back" onClick={onClose}>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m7 4-4 4 4 4M3 8h10" /></svg>Back to drawer
      </button>
      <span className="finds-reader-address"><i aria-hidden="true" />Card {note.number}</span>
    </div>
    <div className="finds-reader-content">
      {trail.length > 1 && <nav className="finds-trail" aria-label="Reading path">
        <span className="finds-trail-label" aria-hidden="true">Path</span>
        {trail.map((id, index) => {
          const item = finds.find(item => item.id === id);
          return item && <span key={id} className="finds-trail-step">
            {index > 0 && <span aria-hidden="true">/</span>}
            <button type="button" aria-current={id === note.id ? "step" : undefined} aria-label={`Card ${item.number}: ${item.title}`} title={item.title} onClick={() => onFollow(id)}>{item.number}</button>
          </span>;
        })}
      </nav>}
      <AnimatePresence initial={false} mode="popLayout">
        <ReadingNote key={note.id} id={note.id} reduced={reduced}>
          <header className="finds-note-header">
            <h2>{note.title}</h2>
            <div className="finds-note-meta">
              <p className="finds-note-category">{note.topics.map(id => findDrawers.find(item => item.id === id)?.label).join(" / ")}</p>
              {note.mock && <span className="finds-sample-label">Sample note</span>}
            </div>
          </header>
          {note.thought && <section className="finds-take" aria-label="My take"><h3>My take</h3><div className="finds-note-body">{paragraphs(note.thought)}</div></section>}
          {note.mock ? <div className="finds-note-body finds-source-text">{paragraphs(note.snapshot.text)}</div> : <section className="finds-source" aria-label="Saved excerpt">
            <h3>Saved excerpt</h3>
            <div className="finds-source-head">
              <img src={note.snapshot.avatarUrl} alt="" width="28" height="28" />
              <a href={note.snapshot.authorUrl} target="_blank" rel="noreferrer">{note.snapshot.authorName}<span>@{note.snapshot.authorHandle}</span></a>
              <time dateTime={note.snapshot.publishedAt}>{date(note.snapshot.publishedAt)}</time>
            </div>
            {note.snapshot.text.startsWith("https://t.co/") ? <p className="finds-source-text finds-media-note">This saved post contains media. View the original on X.</p>
              : <blockquote className="finds-source-text finds-note-body" cite={note.url}>{paragraphs(note.snapshot.text)}</blockquote>}
            <div className="finds-source-footer">
              <a className="finds-source-link" href={note.url} target="_blank" rel="noreferrer">Open original on X<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8" /></svg></a>
              <span className="finds-saved">Saved <time dateTime={note.savedAt}>{date(note.savedAt)}</time></span>
            </div>
          </section>}
          {note.links.length > 0 && <section className="finds-connections" aria-label="Connected notes">
            <h3>Connected notes</h3>
            {note.links.map(link => {
              const target = finds.find(item => item.id === link.id);
              return target && <button key={link.id} type="button" className="finds-related-link" data-find-follow={link.id} aria-label={`Card ${target.number}: ${target.title}. ${link.reason}`} onClick={() => onFollow(link.id)}>
                <span className="finds-related-number" aria-hidden="true">{target.number}</span>
                <span className="finds-related-copy"><span className="finds-related-title">{target.title}</span><small>{link.reason}</small></span>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m9 4 4 4-4 4M3 8h10" /></svg>
              </button>;
            })}
          </section>}
        </ReadingNote>
      </AnimatePresence>
    </div>
  </motion.section>;
});

export default FindsReader;
