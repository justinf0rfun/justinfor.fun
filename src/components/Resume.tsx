import { useEffect, useRef, useState, type ReactNode } from "react";
import { LayoutGroup, motion, useAnimationFrame, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, type MotionValue } from "motion/react";
import { didiProjects, earlierPoints, expertise, resumeSections } from "../data/resume";
import { currentSection, indicatorSpring, lerp, majorTick, MINIMAP_COUNT, minimapProgress, progressSpring, tickScale, tickSpring } from "../lib/resume-scroll";
import "./Resume.css";

function Tick({ index, progress, mouseY, reduced }: { index: number; progress: MotionValue<number>; mouseY: MotionValue<number>; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const scale = useSpring(1, tickSpring);
  useEffect(() => { if (reduced) scale.jump(1); }, [reduced, scale]);
  useMotionValueEvent(mouseY, "change", value => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) scale.set(reduced ? 1 : tickScale(value - rect.top - rect.height / 2));
  });
  useMotionValueEvent(progress, "change", value => {
    const target = tickScale(value - (9 * index + .5));
    scale.set(reduced ? 1 : lerp(1, target, Math.min(1, Math.abs(progress.getVelocity()) / 300)));
  });
  return <motion.div ref={ref} className={majorTick(index) ? "resume-tick is-major" : "resume-tick"} style={{ scaleX: scale }} />;
}

function Minimap() {
  const reduced = !!useReducedMotion();
  const progress = useSpring(0, progressSpring);
  const target = useRef(0);
  const mouseY = useMotionValue(0);
  const { scrollY } = useScroll();
  const update = (value: number) => {
    target.current = minimapProgress(value, document.documentElement.scrollHeight, window.innerHeight);
    if (reduced) progress.jump(target.current);
  };
  useMotionValueEvent(scrollY, "change", update);
  useEffect(() => {
    const measure = () => update(window.scrollY);
    const observer = new ResizeObserver(measure);
    observer.observe(document.documentElement);
    window.addEventListener("resize", measure);
    measure();
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [reduced]);
  useAnimationFrame(() => {
    if (reduced) return;
    const before = progress.get(), next = lerp(before, target.current, .5);
    if (Math.abs(next - before) > .01) progress.set(next);
  });
  return <div className="resume-minimap" aria-hidden="true" data-resume-minimap>
    <div className="resume-ticks" onMouseMove={event => mouseY.set(event.clientY)} onMouseLeave={() => mouseY.set(0)}>
      {Array.from({ length: MINIMAP_COUNT }, (_, index) => <Tick key={index} index={index} progress={progress} mouseY={mouseY} reduced={reduced} />)}
    </div>
    <motion.div className="resume-scanline" style={{ y: progress }}>
      <svg width="10" height="8" viewBox="0 0 7 6" fill="none"><path d="M3.54688 6L0.515786 0.75L6.57796 0.75L3.54688 6Z" fill="currentColor" /></svg>
    </motion.div>
  </div>;
}

function Indicator({ hero = false }: { hero?: boolean }) {
  const reduced = useReducedMotion();
  return <motion.span layoutId="resume-indicator" className={`resume-indicator${hero ? " is-hero" : ""}`} aria-hidden="true" data-resume-indicator
    transition={reduced ? { duration: 0 } : indicatorSpring} />;
}

function Points({ children }: { children: readonly string[] }) {
  return <ul className="resume-points">{children.map(point => <li key={point}>{point}</li>)}</ul>;
}

export default function Resume() {
  const [active, setActive] = useState(-1);
  const sections = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const update = () => setActive(currentSection(sections.current.map(section => section?.getBoundingClientRect().top ?? Infinity), window.innerHeight, window.scrollY));
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);

  const chapter = (index: number, title: string, content: ReactNode) => {
    const { id } = resumeSections[index];
    return <section key={id} id={id} className="resume-chapter" ref={node => { sections.current[index] = node; }} aria-labelledby={`${id}-title`} data-resume-section>
      <div className="resume-chapter-label"><h2 id={`${id}-title`}>{active === index && <Indicator />}{title}</h2><span className="resume-chapter-number">0{index + 1}</span></div>
      <div className="resume-chapter-body">{content}</div>
    </section>;
  };

  return <LayoutGroup id="resume">
    <Minimap />
    <main id="resume-content" className="resume-content" tabIndex={-1}>
      <section className="resume-hero" aria-labelledby="resume-title" data-enter>
        <div className="resume-hero-top"><span className="resume-hero-mark">{active === -1 && <Indicator hero />}</span><span className="resume-eyebrow">Professional experience</span></div>
        <h1 id="resume-title">Senior backend<br />engineer.</h1>
        <p className="resume-hero-lead">10 years building core business systems, from early-stage products to growth platforms at DiDi.</p>
        <nav className="resume-index" aria-label="Resume sections">{resumeSections.map(({ id, label }, index) => <a key={id} href={`#${id}`} aria-current={active === index ? "location" : undefined}><span>0{index + 1}</span>{label}<span aria-hidden="true">↗</span></a>)}</nav>
        <div className="resume-hero-foot"><span>Go / Python</span><span>Scroll to read ↓</span></div>
      </section>

      {chapter(0, "Profile", <>
        <p className="resume-lede">Backend design, platform evolution and reliability for complex business systems.</p>
        <p>Experience spans building core systems at early-stage companies and evolving large, complex systems at an internet company. Led DiDi Alliance and Chengxin Youxuan’s Daily Cash Rewards, alongside referral-platform upgrades, standardized campaign orchestration and real-time data migrations. Also contributed to commerce, membership and benefits systems.</p>
        <p>Led a backend team of five at peak, supporting more than 2,000 merchants and 10,000 campaigns, reaching 10 million users and processing over 1 million orders on peak days. Balanced shared capabilities with individual business needs through reusable architecture and standardized integrations.</p>
        <p>Led the team’s transition to AI-native development, connecting individual AI tools with shared workflows, engineering context and an observable process that can be reviewed and improved.</p>
      </>)}

      {chapter(1, "Expertise", <dl className="resume-expertise">{expertise.map(([label, detail]) => <div key={label}><dt>{label}</dt><dd>{detail}</dd></div>)}</dl>)}

      {chapter(2, "DiDi", <>
        <header className="resume-role"><p className="resume-date">May 2020 — Present</p><h3>Senior Software Engineer<br /><span>Technical Lead, DiDi Alliance</span></h3></header>
        <p>Owned core growth and marketing systems. Led a five-person backend team at peak across Alliance, the referral platform, campaign orchestration and data migrations: technical design, task planning, cross-team delivery, release quality and reliability.</p>
        <div className="resume-projects">{didiProjects.map((project, index) => <article key={project.title} className="resume-project"><div className="resume-project-top"><span className="resume-project-number">0{index + 1}</span><h4>{project.title}</h4></div><p className="resume-project-description">{project.description}</p><Points>{project.points}</Points></article>)}</div>
      </>)}

      {chapter(3, "Earlier experience", <>
        <header className="resume-role"><p className="resume-date">Nov 2015 — May 2020</p><h3>Backend Lead<br /><span>Beijing Xin Gong Chang<br />Investment Consulting Co., Ltd.</span></h3></header>
        <p>Joined as an early core team member and later led backend engineering. Defined business domains, built core systems and established development practices across trading, employee benefits and messaging services.</p>
        <Points>{earlierPoints}</Points>
      </>)}

      {chapter(4, "Education & recognition", <>
        <div className="resume-education"><p className="resume-date">2011 — 2015</p><h3>Shandong University<br />of Science and Technology</h3><p>Bachelor’s degree<br />Computer Science and Technology</p></div>
        <div className="resume-recognition"><h3>Recognition</h3><ul><li>Promotion and A-rated performance recognition</li><li>Outstanding Team, Ride-Hailing Technology Department</li><li>“Champion Team,” Operations Engine</li></ul></div>
      </>)}

      {chapter(5, "Independent work", <>
        <p className="resume-lede">AI-native experiments.</p>
        <div className="resume-experiments">{["huoban.dev", "gson.ing", "letpeek.app"].map((domain, index) => <a key={domain} href={`https://${domain}`} target="_blank" rel="noopener noreferrer"><span className="resume-date">0{index + 1}</span><span>{domain}</span><span aria-hidden="true">↗</span></a>)}</div>
      </>)}
      <footer className="resume-footer"><span>End of resume</span><a href="https://devouringdetails.com/home#structure" target="_blank" rel="noopener noreferrer">Scroll interactions · Devouring Details ↗</a></footer>
    </main>
  </LayoutGroup>;
}
