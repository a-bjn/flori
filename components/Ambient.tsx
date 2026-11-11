"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const BOKEH = Array.from({ length: 9 }, (_, i) => ({
  left: (i * 41 + 7) % 100,
  top: (i * 29 + 11) % 100,
  size: 70 + ((i * 37) % 90),
  hue: i % 3,
}));

const PETALS = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 37 + 5) % 100,
  size: 9 + ((i * 7) % 9),
  hue: i % 3,
}));

const STARS = Array.from({ length: 34 }, (_, i) => ({
  left: (i * 53 + 3) % 100,
  top: (i * 31 + 9) % 100,
  size: 1 + ((i * 5) % 3) * 0.7,
}));

/** Fundal viu: bokeh, stele și petale care cad încet. Rulează de la început. */
export default function Ambient() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>(".bokeh").forEach((el) => {
        gsap.to(el, {
          x: "random(-50, 50)",
          y: "random(-70, 70)",
          scale: "random(0.8, 1.25)",
          opacity: "random(0.35, 1)",
          duration: "random(6, 11)",
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          repeatRefresh: true,
        });
      });

      gsap.utils.toArray<HTMLElement>(".star").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0.1 },
          {
            opacity: "random(0.5, 1)",
            duration: "random(1.2, 3)",
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: "random(0, 3)",
            repeatRefresh: true,
          },
        );
      });

      gsap.utils.toArray<HTMLElement>(".fall").forEach((el) => {
        gsap.fromTo(
          el,
          { y: "-12vh" },
          {
            y: "112vh",
            duration: "random(10, 18)",
            ease: "none",
            repeat: -1,
            delay: "random(0, 12)",
          },
        );
        const inner = el.querySelector(".fall-i");
        gsap.to(el, {
          x: "random(-70, 70)",
          duration: "random(2.5, 4.5)",
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          repeatRefresh: true,
        });
        gsap.to(inner, {
          rotation: "random(180, 420)",
          scaleX: "random(0.4, 1)",
          duration: "random(2, 4)",
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          repeatRefresh: true,
        });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="ambient" aria-hidden="true">
      {BOKEH.map((b, i) => (
        <span
          key={i}
          className={`bokeh bokeh-${b.hue}`}
          style={{ left: `${b.left}%`, top: `${b.top}%`, width: b.size, height: b.size }}
        />
      ))}
      {STARS.map((s, i) => (
        <span key={i} className="star" style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size }} />
      ))}
      {PETALS.map((p, i) => (
        <span key={i} className="fall" style={{ left: `${p.left}%` }}>
          <i className={`fall-i fall-${p.hue}`} style={{ width: p.size, height: p.size * 1.35 }} />
        </span>
      ))}
    </div>
  );
}
