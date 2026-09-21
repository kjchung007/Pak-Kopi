'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from '@/components/PreviewLink';
import Image from 'next/image';
import { brand } from '@coffee/brand';
import { useEditingPreview } from '@/components/useEditingPreview';
import type { SiteDocument } from '@coffee/brand/website';

function CategoryIcon({ category }: { category: string }) {
  const lower = category.toLowerCase();
  if (lower.includes('kopi') || lower.includes('coffee')) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        <line x1="6" y1="2" x2="6" y2="4" />
        <line x1="10" y1="2" x2="10" y2="4" />
        <line x1="14" y1="2" x2="14" y2="4" />
      </svg>
    );
  }
  if (lower.includes('tea') || lower.includes('teh')) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6" />
      </svg>
    );
  }
  if (lower.includes('choc') || lower.includes('cocoa')) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="4" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="9" y1="4" x2="9" y2="20" />
        <line x1="15" y1="4" x2="15" y2="20" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function MenuView({ initial, editing, orderUrl }: { initial: SiteDocument; editing: boolean; orderUrl: string }) {
  const site = useEditingPreview(initial, editing);
  const products = site.products || [];
  
  const { groups, categoryKeys } = useMemo(() => {
    const grps = products.reduce<Record<string, typeof products>>((all, item) => {
      (all[item.category] ||= []).push(item);
      return all;
    }, {});
    return { groups: grps, categoryKeys: Object.keys(grps) };
  }, [products]);

  const [activeCategory, setActiveCategory] = useState<string>(categoryKeys[0] || 'Local Kopi');
  const activeCategoryRef = useRef(activeCategory);
  activeCategoryRef.current = activeCategory;

  const trackRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isClickingRef = useRef(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuSectionsRef = useRef<HTMLDivElement>(null);
  const navWrapperRef = useRef<HTMLDivElement>(null);

  // Direct DOM update of indicator to avoid any React setState depth recursion
  const updateIndicator = useCallback(() => {
    if (!trackRef.current || !indicatorRef.current) return;
    const currentBtn = tabRefs.current[activeCategoryRef.current];
    if (!currentBtn) return;
    indicatorRef.current.style.transform = `translateX(${currentBtn.offsetLeft}px)`;
    indicatorRef.current.style.width = `${currentBtn.offsetWidth}px`;
    indicatorRef.current.style.opacity = '1';
  }, []);

  useEffect(() => {
    updateIndicator();
    let frameId: number;
    const start = performance.now();
    const tick = (time: number) => {
      updateIndicator();
      if (time - start < 400) {
        frameId = requestAnimationFrame(tick);
      }
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [activeCategory, updateIndicator]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  // Initial hash resolution on mount ONLY (never re-run on render or scroll)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const matched = categoryKeys.find((c) => c.toLowerCase().replaceAll(' ', '-') === hash);
      if (matched) {
        activeCategoryRef.current = matched;
        setActiveCategory(matched);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll limit at bottom border of navigation bar (Zero UI Bleed)
  const updateScrollLimit = useCallback(() => {
    const navEl = document.querySelector('.category-jump');
    const sectionsEl = menuSectionsRef.current;
    if (!navEl || !sectionsEl) return;

    const navBottom = navEl.getBoundingClientRect().bottom;
    const sectionsTop = sectionsEl.getBoundingClientRect().top;
    // Allow 4px overlap under the solid opaque beige navbar to guarantee zero gap / zero hero bleed
    const bleed = Math.max(0, Math.floor(navBottom - sectionsTop - 4));

    if (bleed > 0) {
      sectionsEl.style.clipPath = `inset(${bleed}px 0 0 0)`;
      (sectionsEl.style as unknown as { webkitClipPath: string }).webkitClipPath = `inset(${bleed}px 0 0 0)`;
    } else {
      sectionsEl.style.clipPath = 'none';
      (sectionsEl.style as unknown as { webkitClipPath: string }).webkitClipPath = 'none';
    }
  }, []);

  // Automatic section scroll spy as user scrolls down/up
  useEffect(() => {
    const updateSpy = () => {
      if (isClickingRef.current) return;
      const navEl = document.querySelector('.category-jump');
      const header = document.querySelector('.site-header');
      const headerH = header ? header.getBoundingClientRect().height : (window.innerWidth <= 760 ? 82 : 108);
      const navH = navEl ? navEl.getBoundingClientRect().height : (window.innerWidth <= 760 ? 68 : 78);
      const totalOffset = headerH + navH;

      const viewTop = navEl ? Math.max(totalOffset, navEl.getBoundingClientRect().bottom) : totalOffset;
      const viewBottom = window.innerHeight;

      // Bottom of page trigger
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 50) {
        if (categoryKeys.length > 0) {
          const lastCat = categoryKeys[categoryKeys.length - 1];
          const current = activeCategoryRef.current;
          if (lastCat !== current) {
            activeCategoryRef.current = lastCat;
            setActiveCategory(lastCat);
          }
        }
        return;
      }

      const current = activeCategoryRef.current;
      let bestCat = current;
      let maxScore = -1;

      for (const cat of categoryKeys) {
        const id = cat.toLowerCase().replaceAll(' ', '-');
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const visibleHeight = Math.max(0, Math.min(rect.bottom, viewBottom) - Math.max(rect.top, viewTop));
        // Whichever section occupies the largest visible height in the viewport wins
        // Included 25px hysteresis to prevent borderline jitter
        const score = visibleHeight + (cat === current ? 25 : 0);
        if (score > maxScore && visibleHeight > 0) {
          maxScore = score;
          bestCat = cat;
        }
      }

      if (bestCat && bestCat !== current) {
        activeCategoryRef.current = bestCat;
        setActiveCategory(bestCat);
      }
    };

    const handleScroll = () => {
      updateScrollLimit();
      updateSpy();
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    const lenis = (window as unknown as { __lenis?: { on?: (evt: string, cb: () => void) => void; off?: (evt: string, cb: () => void) => void } }).__lenis;
    if (lenis?.on) {
      lenis.on('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (lenis?.off) {
        lenis.off('scroll', handleScroll);
      }
    };
  }, [categoryKeys, updateScrollLimit]);

  const handleTabClick = (categoryName: string) => {
    activeCategoryRef.current = categoryName;
    setActiveCategory(categoryName);
    isClickingRef.current = true;
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      isClickingRef.current = false;
    }, 900);

    const id = categoryName.toLowerCase().replaceAll(' ', '-');
    const el = document.getElementById(id);
    if (!el) return;

    const navWrapper = document.querySelector('.category-jump-wrapper');
    const header = document.querySelector('.site-header');
    const headerH = header ? header.getBoundingClientRect().height : (window.innerWidth <= 760 ? 82 : 108);
    const navH = navWrapper ? navWrapper.getBoundingClientRect().height : (window.innerWidth <= 760 ? 68 : 78);
    const totalOffset = headerH + navH;
    const targetY = Math.max(0, el.getBoundingClientRect().top + window.scrollY - totalOffset);

    const lenis = (window as unknown as { __lenis?: { scrollTo: (target: number) => void } }).__lenis;
    if (lenis) {
      lenis.scrollTo(targetY);
    } else {
      window.scrollTo({
        top: targetY,
        behavior: 'smooth',
      });
    }
    window.history.replaceState(null, '', `#${id}`);
    requestAnimationFrame(updateScrollLimit);
  };

  return (
    <main className="inner-page">
      <header className="page-hero menu-hero">
        <div className="menu-hero-copy">
          <h1>{site.copy["menu-1"]}<br /><em>{site.copy["menu-2"]}</em></h1>
          <p>{site.copy["menu-3"]}</p>
        </div>
        <div className="menu-hero-cup">
          <Image
            src={site.images.menuHeroImage || brand.HeroImage5 || brand.heroImage}
            alt="Enhanced Pak Kopi iced coffee isolated on white"
            width={1024}
            height={1536}
            sizes="(max-width: 760px) 110vw, 65vw"
            priority
          />
        </div>
      </header>

      <div className="menu-overlay">
        <div className="category-jump-wrapper" ref={navWrapperRef}>
          <nav className="category-jump" aria-label="Menu categories">
            <div className="category-jump-track" ref={trackRef}>
              <div className="category-pill-indicator" ref={indicatorRef} />
              {categoryKeys.map((name) => {
                const isActive = name === activeCategory;
                return (
                  <button
                    key={name}
                    type="button"
                    ref={(el) => { tabRefs.current[name] = el; }}
                    className={`category-tab ${isActive ? 'active' : ''}`}
                    onClick={() => handleTabClick(name)}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={name}
                  >
                    <span className="category-tab-icon">
                      <CategoryIcon category={name} />
                    </span>
                    <span className="category-tab-label">
                      {name}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
        <div className="menu-content-backdrop">
          <div className="menu-sections" id="menu-list" ref={menuSectionsRef}>
            {Object.entries(groups).map(([category, items]) => (
              <section id={category.toLowerCase().replaceAll(" ", "-")} key={category} data-reveal>
                <div className="menu-category-heading">
                  <h2>{category}</h2>
                  <span>{items.length}{site.copy["menu-4"]}</span>
                </div>
                <div className="menu-grid">
                  {items.map((item) => (
                    <article key={item.id}>
                      <div>
                        <img src={item.image} alt={item.name} loading="lazy" />
                      </div>
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      <a href={orderUrl}>{site.copy["menu-5"]}</a>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
