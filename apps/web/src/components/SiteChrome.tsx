"use client";
import { brand } from "@coffee/brand";
import Link from "@/components/PreviewLink";
import { List, X, Bag } from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const links = [["/", "Home"], ["/menu", "Menu"], ["/story", "About us"], ["/stores", "Stores"]] as const;
export function SiteHeader({ orderUrl }: { orderUrl:string }) {
  const router = useRouter();
  const path = usePathname().replace(/^\/preview(?=\/|$)/,'') || '/';
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const [activeTab, setActiveTab] = useState(path);
  const [hasMounted, setHasMounted] = useState(false);
  const [indicator, setIndicator] = useState({ left: 0, top: 0, width: 0, visible: false });

  useEffect(() => {
    links.forEach(([href]) => {
      try { router.prefetch(href); } catch {}
    });
  }, [router]);

  useEffect(() => {
    setActiveTab(path);
  }, [path]);

  const updateIndicator = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;

    const activeIndex = links.findIndex(([href]) => {
      if (href === '/') return activeTab === '/' || activeTab === '';
      return activeTab.startsWith(href);
    });

    const linkEls = nav.querySelectorAll<HTMLAnchorElement>('a:not(.nav-order)');
    const activeEl = linkEls[activeIndex];

    if (activeEl) {
      const left = activeEl.offsetLeft;
      const top = activeEl.offsetTop + activeEl.offsetHeight + 5;
      const width = activeEl.offsetWidth;
      setIndicator({ left, top, width, visible: width > 0 });
    } else {
      setIndicator(prev => ({ ...prev, visible: false }));
    }
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();
    const frame = requestAnimationFrame(() => {
      updateIndicator();
      setTimeout(() => setHasMounted(true), 50);
    });

    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => updateIndicator());
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateIndicator]);

  return (
    <>
      <header className={`site-header home-header${path === "/story" ? " about-overlay-header" : ""}`}>
        <Link className="site-brand" href="/" onClick={()=>setOpen(false)} onMouseEnter={() => router.prefetch('/')}>
          <img src={brand.logo} alt={brand.name}/>
          <span><strong>{brand.name}</strong><small>{brand.tagline}</small></span>
        </Link>
        <button className="menu-toggle" aria-label="Toggle navigation" aria-expanded={open} onClick={()=>setOpen(!open)}>
          {open ? <X size={24} aria-hidden/> : <List size={24} aria-hidden/>}
        </button>
        <nav ref={navRef} className={open ? "open" : ""} aria-label="Primary navigation">
          {links.map(([href, label]) => (
            <Link
              key={href}
              aria-current={path === href ? "page" : undefined}
              className={path === href ? "active" : ""}
              href={href}
              prefetch={true}
              onClick={() => {
                setOpen(false);
                setActiveTab(href);
              }}
              onMouseEnter={() => { try { router.prefetch(href); } catch {} }}
            >
              {label}
            </Link>
          ))}
          <span
            className="nav-tab-indicator"
            style={{
              transform: `translate3d(${indicator.left}px, ${indicator.top}px, 0)`,
              width: `${indicator.width}px`,
              opacity: indicator.visible ? 1 : 0,
              transition: hasMounted
                ? 'transform 0.32s cubic-bezier(0.2, 0.9, 0.3, 1.15), width 0.32s cubic-bezier(0.2, 0.9, 0.3, 1.15), opacity 0.2s ease, background-color 0.25s ease'
                : 'none',
            }}
            aria-hidden="true"
          />
          <a className="nav-order" href={orderUrl}><Bag size={18} aria-hidden/>Order pickup</a>
        </nav>
      </header>
      {open && <button className="nav-backdrop" type="button" aria-label="Close navigation" onClick={()=>setOpen(false)}/>}
    </>
  );
}
export function MotionInit(){const path=usePathname();useEffect(()=>{let observer:IntersectionObserver|undefined;const frame=requestAnimationFrame(()=>{const nodes=[...document.querySelectorAll<HTMLElement>("[data-reveal]")];if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){nodes.forEach(node=>node.dataset.visible="true");return}observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){(entry.target as HTMLElement).dataset.visible="true";observer?.unobserve(entry.target)}}),{threshold:.08,rootMargin:"0px 0px 4%"});nodes.forEach(node=>observer?.observe(node))});return()=>{cancelAnimationFrame(frame);observer?.disconnect()}},[path]);return null}
export function SiteFooter({orderUrl}:{orderUrl:string}){return <footer className="site-footer home-footer"><div><img src={brand.logo} alt=""/><div><strong>{brand.tagline}</strong><p>{brand.description}</p></div></div><nav>{links.slice(1).map(([href,label])=><Link key={href} href={href}>{label}</Link>)}<a href={orderUrl}>Order online</a></nav><small>© {new Date().getFullYear()} {brand.name}. {brand.photoNote}</small></footer>}
