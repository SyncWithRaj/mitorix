"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal, Cpu, Database, Shield } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Queue & Clone",
    description: (
      <>
        BullMQ + Redis dispatches a job to clone the repository to an isolated{" "}
        <code className="text-[11px] font-mono px-1 py-0.5 bg-[#1a1a1a] text-white rounded">
          /tmp
        </code>{" "}
        directory, checking GitHub credentials.
      </>
    ),
    icon: Terminal,
    color: "#ff6b00",
    side: "left" as const,
  },
  {
    step: "02",
    title: "AST Extraction",
    description:
      "High-fidelity parsing via Tree-sitter spans 11 languages to resolve scopes, functions, parameters, layers, and cyclic dependency calls.",
    icon: Cpu,
    color: "#ff8c00",
    side: "right" as const,
  },
  {
    step: "03",
    title: "Qdrant Embeddings",
    description:
      "Code fragments are converted into high-dimensional vectors via Google Gemini and indexed inside Qdrant DB for semantic RAG search context.",
    icon: Database,
    color: "#ffa800",
    side: "left" as const,
  },
  {
    step: "04",
    title: "Wipe & Unlock",
    description:
      "Physical folders are wiped securely. Downstream vector indices and MongoDB metadata are cached to unlock immediate user exploration.",
    icon: Shield,
    color: "#ff6b00",
    side: "right" as const,
  },
];

export default function TimelineSteps() {
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set());
  const lineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(0);

  // Throttled scroll handler via rAF — only one frame queued at a time
  const updateLine = useCallback(() => {
    if (!containerRef.current || !lineRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = Math.max(0, Math.min(1, (vh - rect.top) / (rect.height + vh)));
    lineRef.current.style.height = `${progress * 100}%`;
  }, []);

  const onScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateLine);
  }, [updateLine]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-idx"));
            setVisibleSteps((prev) => {
              if (prev.has(idx)) return prev;
              const next = new Set(prev);
              next.add(idx);
              return next;
            });
            observer.unobserve(entry.target); // fire once, stop watching
          }
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -60px 0px" }
    );

    stepRefs.current.forEach((el) => el && observer.observe(el));
    window.addEventListener("scroll", onScroll, { passive: true });
    updateLine();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [onScroll, updateLine]);

  return (
    <div ref={containerRef} className="relative">
      {/* ── Center timeline ── */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[2px]">
        <div className="absolute inset-0 bg-[#1a1a1a]/40 rounded-full" />
        <div
          ref={lineRef}
          className="absolute top-0 left-0 w-full rounded-full will-change-[height]"
          style={{
            height: "0%",
            background: "linear-gradient(to bottom, #ff6b00, #ff8c00, #ffa800, #ff6b00)",
            boxShadow: "0 0 8px rgba(255,107,0,0.35)",
          }}
        />
      </div>

      {/* ── Steps ── */}
      <div className="relative z-10">
        {steps.map((step, i) => {
          const visible = visibleSteps.has(i);
          const Icon = step.icon;
          const isLeft = step.side === "left";
          const delay = i * 120;

          return (
            <div
              key={step.step}
              ref={(el) => { stepRefs.current[i] = el; }}
              data-idx={i}
              className={`relative flex flex-col md:flex-row items-center w-full group ${
                i > 0 ? "md:mt-20" : ""
              }`}
            >
              {/* ── Center dot (ABSOLUTE positioned for perfect alignment) ── */}
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 shrink-0 items-center justify-center z-20">
                <div
                  className="w-14 h-14 rounded-full bg-[#050505] border-2 flex items-center justify-center"
                  style={{
                    borderColor: visible ? `${step.color}70` : "#1a1a1a",
                    boxShadow: visible ? `0 0 20px ${step.color}30` : "none",
                    opacity: visible ? 1 : 0,
                    transform: visible ? "scale(1)" : "scale(0.4)",
                    transition: `opacity 500ms cubic-bezier(0.22,1,0.36,1) ${delay + 150}ms, transform 500ms cubic-bezier(0.22,1,0.36,1) ${delay + 150}ms, border-color 400ms ease ${delay + 150}ms, box-shadow 400ms ease ${delay + 150}ms`,
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: visible ? step.color : "#555" }} />
                </div>
              </div>

              {/* ── Left half ── */}
              <div className={`w-full md:w-1/2 ${isLeft ? "md:pr-12" : ""} ${isLeft ? "" : "hidden md:block"}`}>
                {isLeft && (
                  <StepCard
                    step={step}
                    visible={visible}
                    delay={delay}
                    slideFrom="left"
                    textAlign="right"
                  />
                )}
              </div>

              {/* ── Right half ── */}
              <div className={`w-full md:w-1/2 ${!isLeft ? "md:pl-12" : ""} ${!isLeft ? "" : "hidden md:block"}`}>
                {!isLeft && (
                  <StepCard
                    step={step}
                    visible={visible}
                    delay={delay}
                    slideFrom="right"
                    textAlign="left"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Step card sub-component ── */
interface StepCardProps {
  step: (typeof steps)[number];
  visible: boolean;
  delay: number;
  slideFrom: "left" | "right";
  textAlign: "left" | "right";
}

function StepCard({ step, visible, delay, slideFrom, textAlign }: StepCardProps) {
  const translateX = slideFrom === "left" ? "-50px" : "50px";

  return (
    <div
      className={`bg-[#030303]/40 backdrop-blur-md border border-[#1a1a1a] p-8 rounded-3xl w-full relative overflow-hidden hover:-translate-y-1 hover:shadow-lg ${
        textAlign === "right" ? "text-right" : "text-left"
      }`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0) translateY(0)" : `translateX(${translateX}) translateY(16px)`,
        transition: `opacity 650ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 650ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${step.color}60`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#1a1a1a";
      }}
    >
      {/* Ambient glow */}
      <div
        className={`absolute top-0 ${textAlign === "right" ? "right-0" : "left-0"} w-36 h-36 rounded-full blur-3xl pointer-events-none`}
        style={{ background: `${step.color}12` }}
      />
      <div className="relative z-10">
        <div className="font-mono text-xs font-bold tracking-widest mb-3" style={{ color: step.color }}>
          STEP {step.step}
        </div>
        <h4 className="text-2xl font-bold text-white mb-3">{step.title}</h4>
        <p className="text-[#737373] text-sm leading-relaxed">{step.description}</p>
      </div>
    </div>
  );
}
