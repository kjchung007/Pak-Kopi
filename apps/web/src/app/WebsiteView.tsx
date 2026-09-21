'use client';
import Link from '@/components/PreviewLink';
import Image from 'next/image';
import {brand} from '@coffee/brand';
import {useEditingPreview} from '@/components/useEditingPreview';
import type {SiteDocument} from '@coffee/brand/website';
import {useEffect, useRef, useState} from 'react';

function DrinksTypewriterHeading({ rawText }: { rawText?: string }) {
  const fullText = (rawText || 'More than a coffee break...').trim();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [displayedCount, setDisplayedCount] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const hasTriggeredRef = useRef(false);

  const hasDots = fullText.endsWith('.');
  const baseText = hasDots ? fullText.slice(0, -1) : fullText;
  const totalLength = fullText.length;

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayedCount(totalLength);
      setIsDone(true);
      return;
    }

    const el = headingRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        observer.disconnect();

        let count = 0;
        const tick = () => {
          count++;
          setDisplayedCount(count);
          if (count < totalLength) {
            const nextChar = fullText[count];
            const delay = nextChar === '.' ? 95 : 38;
            setTimeout(tick, delay);
          } else {
            setIsDone(true);
          }
        };

        setTimeout(tick, 120);
      }
    }, { threshold: 0.35 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [fullText, totalLength]);

  if (isDone) {
    return (
      <h2 ref={headingRef} aria-label={fullText}>
        <span>{baseText}</span>
        <span className="pulse-dot" aria-hidden="true">.</span>
      </h2>
    );
  }

  const currentStr = fullText.slice(0, displayedCount);

  return (
    <h2 ref={headingRef} aria-label={fullText}>
      <span>{currentStr}</span>
    </h2>
  );
}

export function HomeView({initial,editing,orderUrl}:{initial:SiteDocument;editing:boolean;orderUrl:string}){
 const site=useEditingPreview(initial,editing);
 const stores=site.stores||[]; const products=site.products||[];
 const explicitFeatured = stores.filter(store => store.featured);
 const preferred = stores.filter(store =>
  /Bandar Sandakan|Prima Sandakan|Prima Square|Batu 6|Kuching Town/i.test(store.name)
 );
 const pool = [
  ...explicitFeatured,
  ...preferred,
  ...stores.filter(s => s.image && !s.image.includes('placeholder'))
 ];
 const seen = new Set<number>();
 const branches = pool.filter(s => {
  if (seen.has(s.id)) return false;
  seen.add(s.id);
  return true;
 }).slice(0, 2);

  // Intro scroll animation trigger - triggers when section is substantially in view
  const introRef = useRef<HTMLElement>(null);
  const [introVisible, setIntroVisible] = useState(false);

  useEffect(() => {
   const el = introRef.current;
   if (!el) return;
   const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
     setIntroVisible(true);
    } else if (entry.boundingClientRect.top > (window.innerHeight || document.documentElement.clientHeight) * 0.7) {
     // If user scrolls back up, reset so they can re-experience the transition
     setIntroVisible(false);
    }
   }, { threshold: 0.42 });
   observer.observe(el);
   return () => observer.disconnect();
  }, []);

  // Isolated Physics Pendulum Simulation (Touch Drag & Tap Impulse)
  const leftCardRef = useRef<HTMLDivElement>(null);
  const rightCardRef = useRef<HTMLDivElement>(null);

  const physicsRef = useRef({
    left: {
      angle: -4.5,
      rest: -4.5,
      velocity: 0,
      isDragging: false,
      dragStartX: 0,
      dragStartAngle: 0,
      lastMoveX: 0,
      lastMoveTime: 0,
      flickVelocity: 0,
    },
    right: {
      angle: 4.5,
      rest: 4.5,
      velocity: 0,
      isDragging: false,
      dragStartX: 0,
      dragStartAngle: 0,
      lastMoveX: 0,
      lastMoveTime: 0,
      flickVelocity: 0,
    },
    animating: false,
    reqId: 0,
  });

  const runPhysics = () => {
    const p = physicsRef.current;
    let active = false;

    // Harmonic spring constants: natural period ~1.1s, smooth air damping
    const stiffness = 0.009;
    const damping = 0.978;

    for (const side of ['left', 'right'] as const) {
      const card = p[side];

      if (card.isDragging) {
        // While user is dragging this card, direct finger control remains active
        active = true;
      } else {
        const targetRest = card.rest;
        const displacement = card.angle - targetRest;

        // Harmonic spring-damper equation
        card.velocity += -stiffness * displacement;
        card.velocity *= damping;
        card.angle += card.velocity;

        if (Math.abs(card.velocity) > 0.002 || Math.abs(displacement) > 0.012) {
          active = true;
        } else {
          card.angle = targetRest;
          card.velocity = 0;
        }
      }
    }

    if (leftCardRef.current) {
      leftCardRef.current.style.transform = `rotate(${p.left.angle.toFixed(2)}deg)`;
    }
    if (rightCardRef.current) {
      rightCardRef.current.style.transform = `rotate(${p.right.angle.toFixed(2)}deg)`;
    }

    if (active) {
      p.reqId = requestAnimationFrame(runPhysics);
    } else {
      p.animating = false;
    }
  };

  const startAnimation = () => {
    const p = physicsRef.current;
    if (!p.animating) {
      p.animating = true;
      p.reqId = requestAnimationFrame(runPhysics);
    }
  };

  const handlePointerDown = (side: 'left' | 'right', e: React.PointerEvent<HTMLDivElement>) => {
    const p = physicsRef.current;
    const card = p[side];

    card.isDragging = true;
    card.dragStartX = e.clientX;
    card.dragStartAngle = card.angle;
    card.lastMoveX = e.clientX;
    card.lastMoveTime = performance.now();
    card.flickVelocity = 0;
    card.velocity = 0;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (side: 'left' | 'right', e: React.PointerEvent<HTMLDivElement>) => {
    const p = physicsRef.current;
    const card = p[side];
    if (!card.isDragging) return;

    // Inverted drag direction as requested by user
    const deltaX = e.clientX - card.dragStartX;
    const sensitivity = 0.18; // 100px drag = 18 degrees tilt
    const newAngle = card.dragStartAngle - deltaX * sensitivity;

    // Clamp angle to realistic physical range [-32°, +32°]
    card.angle = Math.max(-32, Math.min(32, newAngle));

    // Direct synchronous transform update for zero-latency tracking
    const targetRef = side === 'left' ? leftCardRef : rightCardRef;
    if (targetRef.current) {
      targetRef.current.style.transform = `rotate(${card.angle.toFixed(2)}deg)`;
    }

    // Track flick velocity (inverted to match drag direction)
    const now = performance.now();
    const dt = now - card.lastMoveTime;
    if (dt > 10) {
      card.flickVelocity = -((e.clientX - card.lastMoveX) / dt) * 0.45;
      card.lastMoveX = e.clientX;
      card.lastMoveTime = now;
    }
  };

  const handlePointerUp = (side: 'left' | 'right', e: React.PointerEvent<HTMLDivElement>) => {
    const p = physicsRef.current;
    const card = p[side];
    if (!card.isDragging) return;

    card.isDragging = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const totalDragDistance = Math.abs(e.clientX - card.dragStartX);

    // Quick tap (< 6px movement) applies a swing impulse to THIS card only
    if (totalDragDistance < 6) {
      const impulse = side === 'left' ? -2.2 : 2.2;
      card.velocity += impulse;
    } else {
      // Released from drag: apply any flick velocity, then harmonic spring oscillates from current pulled angle
      const clampedFlick = Math.max(-5, Math.min(5, card.flickVelocity));
      card.velocity = clampedFlick;
    }

    startAnimation();
  };

  useEffect(() => {
    const p = physicsRef.current;

    // Initialize resting positions
    if (leftCardRef.current) leftCardRef.current.style.transform = `rotate(${p.left.rest}deg)`;
    if (rightCardRef.current) rightCardRef.current.style.transform = `rotate(${p.right.rest}deg)`;

    return () => {
      if (p.reqId) cancelAnimationFrame(p.reqId);
    };
  }, []);

   return <main className="pak-home">
      <section className="home-banner" aria-labelledby="home-heading">
        <Image className="home-banner-image home-banner-desktop" src={site.images.homeBannerImage || "/brand/home-coffee-concept.png"} alt="Illustrative Pak Kopi iced coffee and milk tea concept" fill sizes="72vw" priority draggable={false} />
        <Image className="home-banner-image home-banner-mobile" src={(site.images as any).homeBannerMobileImage || "/brand/hero-drinks-final.png"} alt="Illustrative Pak Kopi iced coffee and milk tea concept" fill sizes="100vw" priority draggable={false} />
        <div className="home-banner-copy">
         <h1 id="home-heading">{site.copy["home-1"]}<br />{site.copy["home-2"]}</h1>
         <p>{site.copy["home-3"]}</p>
         <Link className="home-button" href="/menu">{site.copy["home-4"]}</Link>
       </div>
     </section>

     <section className="home-brew" aria-labelledby="brew-heading">
       <div className="home-brew-photos">
         <div
           ref={leftCardRef}
           className="home-polaroid polaroid-left"
           onPointerDown={(e) => handlePointerDown('left', e)}
           onPointerMove={(e) => handlePointerMove('left', e)}
           onPointerUp={(e) => handlePointerUp('left', e)}
           onPointerCancel={(e) => handlePointerUp('left', e)}
           onDragStart={(e) => e.preventDefault()}
           title="Tap to swing or drag to tilt"
           role="button"
           tabIndex={0}
           onKeyDown={(e) => {
             if (e.key === 'Enter' || e.key === ' ') {
               physicsRef.current.left.velocity += 1.85;
               startAnimation();
             }
           }}
         >
           <div className="photo-pin" aria-hidden="true" />
           <Image draggable={false} src={site.images.HeroImage4 || brand.heroImage} alt="Hot kopi being poured into a Pak Kopi cup" width={447} height={447} sizes="(max-width: 760px) 46vw, 380px" />
         </div>
         <div
           ref={rightCardRef}
           className="home-polaroid polaroid-right"
           onPointerDown={(e) => handlePointerDown('right', e)}
           onPointerMove={(e) => handlePointerMove('right', e)}
           onPointerUp={(e) => handlePointerUp('right', e)}
           onPointerCancel={(e) => handlePointerUp('right', e)}
           onDragStart={(e) => e.preventDefault()}
           title="Tap to swing or drag to tilt"
           role="button"
           tabIndex={0}
           onKeyDown={(e) => {
             if (e.key === 'Enter' || e.key === ' ') {
               physicsRef.current.right.velocity -= 1.85;
               startAnimation();
             }
           }}
         >
           <div className="photo-pin" aria-hidden="true" />
           <Image draggable={false} src={site.images.HeroImage5 || brand.heroImage} alt="Kopi poured over ice and milk in a Pak Kopi cup" width={447} height={447} sizes="(max-width: 760px) 46vw, 380px" />
         </div>
       </div>
      <div className="home-brew-copy">
        <h2 id="brew-heading">{site.copy["home-11"]}<br />{site.copy["home-12"]}</h2>
        <p>{site.copy["home-13"]}</p>
      </div>
    </section>

    <section className="home-drinks">
      <div><DrinksTypewriterHeading rawText={site.copy["home-15"]} /><p>{site.copy["home-16"]}</p></div>
      <Image src={site.images.websiteLineupImage || brand.secondaryHeroImage || brand.heroImage} alt="A selection of Pak Kopi iced drinks" width={1448} height={1086} sizes="(max-width: 760px) 90vw, 515px" />
    </section>

    <section className="home-branches">
      <div className="home-section-title"><h2>{site.copy["home-18"]}</h2><p>{site.copy["home-19"]}</p></div>
      <div className="home-branch-grid">{branches.map(store => (
        <Link href="/stores" className="home-branch" key={store.id} aria-label="View branch locator">
          <div><img src={store.image || brand.storePlaceholder} alt="Pak Kopi storefront" loading="lazy" width={680} height={510} onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=brand.storePlaceholder}} /></div>
        </Link>
      ))}</div>
    </section>

    <section ref={introRef} className={`home-intro home-intro-animated${introVisible ? ' is-visible' : ''}`}>
      <div className="home-intro-backdrop" aria-hidden="true">
        <video
          className="home-intro-video"
          autoPlay
          loop
          muted
          playsInline
          poster="/brand/coffee-swirl.jpg"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        >
          <source src={site.images.introVideo || '/brand/coffee-swirl.mp4'} type="video/mp4" />
          <source src="/brand/coffee-swirl.webm" type="video/webm" />
        </video>
        <div className="home-intro-overlay" />
      </div>
      <div className="home-intro-content">
        <h2>
          <span className="intro-line intro-line-1">{site.copy["home-5"]}</span>
          <span className="intro-line intro-line-2">{site.copy["home-6"]}</span>
          <span className="intro-line intro-line-3">{site.copy["home-7"]}</span>
        </h2>
        <p className="intro-description">{site.copy["home-8"]}<br />{site.copy["home-9"]}</p>
      </div>
    </section>

    <section className="home-pickup"><h2>{site.copy["home-21"]}</h2><p>{site.copy["home-22"]}</p><a className="home-button" href={orderUrl}>{site.copy["home-23"]}</a></section>
    <p className="home-image-note">{site.copy["home-24"]}</p>
  </main>;
}
