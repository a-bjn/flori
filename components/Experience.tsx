"use client";

import { useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Bouquet from "./Bouquet";
import Ambient from "./Ambient";
import { config } from "@/lib/config";

gsap.registerPlugin(useGSAP);

const PETAL_COLORS = ["#ff8fab", "#ffb3c7", "#ffd6e0", "#f48fb1", "#fff1f5", "#e8456b"];

/* numele din link: ?pentru=Maria (fără re-render inutil, fără mismatch la hidratare) */
const noopSubscribe = () => () => {};
const readName = () => {
  const q = new URLSearchParams(window.location.search);
  return (q.get("pentru") ?? q.get("name") ?? config.recipient).trim().slice(0, 40);
};
const serverName = () => config.recipient;

/** Încearcă fullscreen real (Android/desktop). Pe iOS Safari nu există; acolo ajută „Adaugă pe ecranul principal”. */
function goFullscreen() {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => void;
  };
  try {
    if (el.requestFullscreen) {
      el.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }
  } catch {
    /* ignorăm */
  }
  try {
    (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })
      ?.lock?.("portrait")
      ?.catch(() => {});
  } catch {
    /* ignorăm */
  }
}

/** Nu lăsa „într-o”, „într-un” etc. să se rupă la capăt de rând. */
function nowrapHyphens(text: string) {
  return text.split(/(\S+-\S+)/).map((part, i) =>
    i % 2 ? (
      <span key={i} style={{ whiteSpace: "nowrap" }}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export default function Experience() {
  const name = useSyncExternalStore(noopSubscribe, readName, serverName);

  const root = useRef<HTMLDivElement>(null);
  const fx = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const flags = useRef({ started: false, hintGone: false });
  const api = useRef<{
    start: () => void;
    burst: (x: number, y: number, n: number) => void;
    wiggle: (f: Element) => void;
  } | null>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const el = root.current!;
      const $ = (sel: string) => gsap.utils.toArray<Element>(sel, el);

      /* ---------- stări inițiale ---------- */
      gsap.set(".bouquet", { autoAlpha: 1 });
      gsap.set(".stem, .twig", { strokeDashoffset: 1 });
      gsap.set(".leaf", { scale: 0, transformOrigin: "50% 100%" });
      gsap.set(".petal", { scale: 0, transformOrigin: "50% 100%" });
      gsap.set(".head", { autoAlpha: 0, transformOrigin: "50% 50%" });
      gsap.set(".paper", { autoAlpha: 0 });
      gsap.set(".ribbon-band", { scaleX: 0, transformOrigin: "50% 50%" });
      gsap.set(".bow-l", { scale: 0, transformOrigin: "100% 60%" });
      gsap.set(".bow-r", { scale: 0, transformOrigin: "0% 60%" });
      gsap.set(".bow-tail", { scaleY: 0, transformOrigin: "50% 0%" });
      gsap.set(".knot", { scale: 0, transformOrigin: "50% 50%" });
      gsap.set(".sparkle", { opacity: 0, scale: 0, transformOrigin: "50% 50%" });

      /* ---------- ecranul de început ---------- */
      gsap.from(".intro-in", {
        autoAlpha: 0,
        y: 24,
        filter: "blur(8px)",
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.25,
        delay: 0.2,
      });
      gsap.to(".bud-svg", { y: -8, duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.fromTo(
        ".ring",
        { scale: 0.55, opacity: 0.7 },
        { scale: 1.5, opacity: 0, duration: 2.6, ease: "power1.out", repeat: -1, stagger: 1.3 },
      );
      gsap.fromTo(
        ".intro-hint",
        { opacity: 0.35 },
        { opacity: 1, duration: 1.4, ease: "sine.inOut", yoyo: true, repeat: -1 },
      );

      /* ---------- mișcări continue (pornesc după înflorire) ---------- */
      const idle: gsap.core.Tween[] = [];
      idle.push(
        gsap.fromTo(
          ".sway-all",
          { rotation: -1.3, svgOrigin: "200 478" },
          { rotation: 1.3, svgOrigin: "200 478", duration: 3.6, ease: "sine.inOut", yoyo: true, repeat: -1, paused: true },
        ),
      );
      $(".sway").forEach((s) => {
        const a = gsap.utils.random(1.5, 3.5);
        idle.push(
          gsap.fromTo(
            s,
            { rotation: -a },
            {
              rotation: a,
              duration: gsap.utils.random(2.2, 3.8),
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
              paused: true,
              transformOrigin: "50% 50%",
            },
          ),
        );
      });
      idle.push(
        gsap.to(".glow", {
          scale: 1.08,
          opacity: 0.8,
          duration: 2.6,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          paused: true,
        }),
      );
      $(".sparkle").forEach((s) => {
        idle.push(
          gsap.fromTo(
            s,
            { opacity: 0, scale: 0, rotation: 0 },
            {
              opacity: 1,
              scale: gsap.utils.random(0.7, 1.5),
              rotation: 90,
              duration: gsap.utils.random(0.8, 1.4),
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
              repeatDelay: gsap.utils.random(0.6, 2.6),
              delay: gsap.utils.random(0, 2),
              paused: true,
            },
          ),
        );
      });

      /* ---------- mesajele care se schimbă ---------- */
      const msgs = $(".msg");
      const msgTl = gsap.timeline({ paused: true, repeat: -1 });
      msgs.forEach((m) => {
        msgTl
          .fromTo(
            m,
            { autoAlpha: 0, y: 16, filter: "blur(8px)" },
            { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 1.1, ease: "power2.out" },
          )
          .to(m, { autoAlpha: 0, y: -12, filter: "blur(8px)", duration: 0.9, ease: "power1.in" }, "+=3.8");
      });

      /* ---------- secvența principală ---------- */
      const tl = gsap.timeline({ paused: true });

      tl.to(".intro", { autoAlpha: 0, scale: 1.12, duration: 0.8, ease: "power2.in" }, 0)
        .to(".glow", { opacity: 1, duration: 3, ease: "power2.out" }, 0.3)
        // hârtia urcă
        .fromTo(
          ".paper",
          { y: 150, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 1.2, ease: "power3.out" },
          0.5,
        )
        // tulpinile cresc din hârtie
        .to(
          ".stem",
          {
            strokeDashoffset: 0,
            duration: 1.5,
            ease: "power1.inOut",
            stagger: { each: 0.06, from: "random" },
          },
          1.1,
        )
        .to(
          ".leaf",
          {
            scale: 1,
            duration: 0.7,
            ease: "back.out(2.4)",
            stagger: { amount: 1.4, from: "random" },
          },
          1.8,
        );

      // florile înfloresc pe rând, din spate spre față
      $(".flower").forEach((fl, i) => {
        const at = 2.3 + i * 0.09;
        const head = fl.querySelector(".head");
        const petals = fl.querySelectorAll(".petal");
        const twigs = fl.querySelectorAll(".twig");
        tl.fromTo(
          head,
          { scale: 0.3, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 0.45, ease: "power2.out" },
          at,
        );
        tl.fromTo(
          petals,
          { scale: 0, rotation: -18 },
          { scale: 1, rotation: 0, duration: 0.85, ease: "back.out(1.7)", stagger: { amount: 0.45 } },
          at,
        );
        if (twigs.length) {
          tl.to(twigs, { strokeDashoffset: 0, duration: 0.5, stagger: { amount: 0.3 } }, at);
        }
      });

      // fundița
      tl.addLabel("ribbon", 4.1)
        .to(".ribbon-band", { scaleX: 1, duration: 0.7, ease: "power3.out" }, "ribbon")
        .to(".knot", { scale: 1, duration: 0.5, ease: "back.out(3)" }, "ribbon+=0.45")
        .to(".bow-l, .bow-r", { scale: 1, duration: 1, ease: "elastic.out(1, 0.45)", stagger: 0.08 }, "ribbon+=0.5")
        .to(".bow-tail", { scaleY: 1, duration: 0.8, ease: "elastic.out(1, 0.55)", stagger: 0.1 }, "ribbon+=0.7");

      // titlul
      tl.addLabel("title", 4.4)
        .fromTo(
          ".kicker",
          { autoAlpha: 0, y: -12, letterSpacing: "0.5em" },
          { autoAlpha: 1, y: 0, letterSpacing: "0.18em", duration: 1.6, ease: "power3.out" },
          "title",
        )
        .fromTo(
          ".name",
          { autoAlpha: 0, y: 26, scale: 0.88, filter: "blur(14px)" },
          { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.6, ease: "power3.out" },
          "title+=0.25",
        );

      // totul e gata: pornim mișcările continue + mesajele
      tl.call(() => idle.forEach((t) => t.play()), undefined, 3.2);
      tl.call(() => msgTl.play(), undefined, 6.2);
      tl.fromTo(".tap-hint", { autoAlpha: 0 }, { autoAlpha: 0.85, duration: 1.2 }, 6.4);

      tlRef.current = tl;
    /* ---------- pornire (la prima atingere) ---------- */
    const start = contextSafe!(() => {
      if (flags.current.started) return;
      flags.current.started = true;
      goFullscreen();
      navigator.vibrate?.(20);
      tlRef.current?.play();
    });

    /* ---------- atingeri: flori care se scutură + petale ---------- */
    const burst = contextSafe!((x: number, y: number, count: number) => {
      const layer = fx.current;
      if (!layer) return;
      for (let i = 0; i < count; i++) {
        const p = document.createElement("i");
        p.className = "burst-petal";
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        p.style.background = PETAL_COLORS[i % PETAL_COLORS.length];
        layer.appendChild(p);

        const dx = gsap.utils.random(-120, 120);
        const rise = gsap.utils.random(40, 150);
        const spin = gsap.utils.random(-260, 260);
        gsap
          .timeline({ onComplete: () => p.remove() })
          .fromTo(
            p,
            { scale: 0, rotation: gsap.utils.random(0, 360) },
            { scale: gsap.utils.random(0.6, 1.4), duration: 0.2, ease: "back.out(2)" },
            0,
          )
          .to(p, { x: dx, y: -rise, rotation: `+=${spin}`, duration: 0.75, ease: "power2.out" }, 0)
          .to(
            p,
            {
              x: dx + gsap.utils.random(-40, 40),
              y: gsap.utils.random(200, 380),
              rotation: `+=${spin}`,
              opacity: 0,
              duration: 1.7,
              ease: "power1.in",
            },
            0.75,
          );
      }
    });

    const wiggle = contextSafe!((flower: Element) => {
      const w = flower.querySelector(".wiggle");
      if (!w) return;
      gsap.fromTo(
        w,
        { rotation: gsap.utils.random(14, 20) * (Math.random() < 0.5 ? -1 : 1), scale: 1.16 },
        { rotation: 0, scale: 1, duration: 1.5, ease: "elastic.out(1, 0.3)", overwrite: "auto", transformOrigin: "50% 50%" },
      );
    });


        api.current = { start, burst, wiggle };
    },
    { scope: root },
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!flags.current.started) return;
    if (!flags.current.hintGone) {
      flags.current.hintGone = true;
      gsap.to(".tap-hint", { autoAlpha: 0, duration: 0.6 });
    }
    const flower = (e.target as Element).closest?.(".flower");
    if (flower) {
      api.current?.wiggle(flower);
      api.current?.burst(e.clientX, e.clientY, 10);
      navigator.vibrate?.(12);
    } else {
      api.current?.burst(e.clientX, e.clientY, 5);
    }
  };

  return (
    <div ref={root} className="stage" onPointerDown={onPointerDown}>
      <Ambient />
      <div className="vignette" aria-hidden="true" />

      <header className="header">
        <p className="kicker">{config.kicker}</p>
        <h1 className="name">{name || "tine"}</h1>
      </header>

      <main className="bouquet-wrap">
        <div className="glow" aria-hidden="true" />
        <Bouquet />
      </main>

      <footer className="footer">
        <div className="messages" aria-live="polite">
          {config.messages.map((m, i) => (
            <p key={i} className="msg">
              {nowrapHyphens(m)}
            </p>
          ))}
        </div>
        <p className="tap-hint">{config.tapHint}</p>
      </footer>

      <div ref={fx} className="fx" aria-hidden="true" />

      <button type="button" className="intro" onClick={() => api.current?.start()} aria-label="Deschide buchetul">
        <span className="bud-wrap intro-in">
          <span className="ring" />
          <span className="ring" />
          <svg className="bud-svg" viewBox="0 0 100 100" aria-hidden="true">
            <path d="M50 94 C50 80 50 70 50 60" stroke="#5e9a66" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M50 82 C36 80 28 72 26 62 C38 62 47 70 50 82Z" fill="#5f9d6b" />
            <path d="M50 76 C62 74 70 68 73 58 C61 58 52 64 50 76Z" fill="#4f8a5b" />
            <path d="M50 62 C34 60 28 40 38 26 C44 36 47 48 50 62Z" fill="#e0457b" />
            <path d="M50 62 C66 60 72 40 62 26 C56 36 53 48 50 62Z" fill="#ee5a8f" />
            <path d="M50 64 C30 60 32 30 50 10 C68 30 70 60 50 64Z" fill="#ff7aa2" />
            <path d="M50 58 C44 46 46 28 50 18" stroke="#fff" strokeOpacity=".35" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </span>
        <span className="intro-title intro-in">{config.intro.title}</span>
        <span className="intro-accent intro-in">{config.intro.titleAccent}</span>
        <span className="intro-hint intro-in">{config.intro.hint}</span>
      </button>
    </div>
  );
}
