"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Expand } from "lucide-react";
import { ImageProp } from "@/utils/types&schemas/Generic/Chat";

const AUTO_DELAY = 4000;
const FADE_MS = 700;

export default function Images({ images }: { images: ImageProp[] }) {
  // Two image slots — React owns the src, DOM owns the opacity animation
  const [idxA, setIdxA] = useState(0);
  const [idxB, setIdxB] = useState(0);
  const refA = useRef<HTMLImageElement>(null);
  const refB = useRef<HTMLImageElement>(null);
  const active = useRef<"A" | "B">("A"); // which slot is currently visible
  const currIdx = useRef(0);
  const busy = useRef(false);

  const [curr, setCurr] = useState(0); // for counter / thumbnails / auto-advance key
  const [paused, setPaused] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const touchStartX = useRef<number | null>(null);

  if (!images || images.length === 0) return null;
  const single = images.length === 1;

  // Set initial DOM opacities
  useEffect(() => {
    if (refA.current) { refA.current.style.opacity = "1"; refA.current.style.zIndex = "2"; }
    if (refB.current) { refB.current.style.opacity = "0"; refB.current.style.zIndex = "1"; }
  }, []);

  const goTo = useCallback((idx: number, manual = false) => {
    if (busy.current || idx === currIdx.current) return;
    if (manual) setPaused(true);
    busy.current = true;

    const isA = active.current === "A";
    const leaving  = isA ? refA.current : refB.current;
    const entering = isA ? refB.current : refA.current;

    // 1. Load new image into the inactive slot
    if (isA) setIdxB(idx); else setIdxA(idx);

    // 2. After React updates the src, snap entering to opacity 0 (no transition)
    requestAnimationFrame(() => {
      [entering].forEach(el => {
        if (!el) return;
        el.style.transition = "none";
        el.style.opacity = "0";
        el.style.zIndex = "3";
      });
      [leaving].forEach(el => {
        if (!el) return;
        el.style.transition = "none";
        el.style.zIndex = "2";
      });

      // 3. Next frame: trigger the crossfade
      requestAnimationFrame(() => {
        [entering].forEach(el => {
          if (!el) return;
          el.style.transition = `opacity ${FADE_MS}ms ease-in-out`;
          el.style.opacity = "1";
        });
        [leaving].forEach(el => {
          if (!el) return;
          el.style.transition = `opacity ${FADE_MS}ms ease-in-out`;
          el.style.opacity = "0";
        });

        active.current = isA ? "B" : "A";
        currIdx.current = idx;
        setCurr(idx);
        setTimeout(() => { busy.current = false; }, FADE_MS + 50);
      });
    });
  }, []);

  const prevSlide = useCallback((manual = false) =>
    goTo((currIdx.current - 1 + images.length) % images.length, manual), [images.length, goTo]);
  const nextSlide = useCallback((manual = false) =>
    goTo((currIdx.current + 1) % images.length, manual), [images.length, goTo]);

  useEffect(() => {
    if (single || paused || lightbox) return;
    const t = setTimeout(() => nextSlide(false), AUTO_DELAY);
    return () => clearTimeout(t);
  }, [curr, paused, lightbox, single, nextSlide]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide(true);
      if (e.key === "ArrowRight") nextSlide(true);
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, prevSlide, nextSlide]);

  useEffect(() => {
    document.body.style.overflow = lightbox ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? nextSlide(true) : prevSlide(true);
    touchStartX.current = null;
  };

  return (
    <>
      {/* Inline carousel */}
      <div className="w-full max-w-sm md:max-w-xl lg:max-w-2xl rounded-xl overflow-hidden shadow-md">
        <div className="relative w-full aspect-video overflow-hidden group" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <img ref={refA} src={images[idxA].url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <img ref={refB} src={images[idxB].url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 z-10 cursor-pointer" onClick={() => setLightbox(true)} />

          <button onClick={() => setLightbox(true)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:cursor-pointer z-20">
            <Expand size={14} />
          </button>

          {!single && (
            <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full z-20">
              {curr + 1} / {images.length}
            </span>
          )}

          {!single && !paused && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/20 z-20">
              <div key={curr} className="h-full bg-primary-gold" style={{ animation: `imgProgress ${AUTO_DELAY}ms linear forwards` }} />
            </div>
          )}

          {!single && (
            <>
              <button onClick={() => prevSlide(true)} className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-1 transition-all hover:cursor-pointer z-20 opacity-0 group-hover:opacity-100">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => nextSlide(true)} className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-1 transition-all hover:cursor-pointer z-20 opacity-0 group-hover:opacity-100">
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {!single && (
          <div className="flex gap-1.5 px-2 py-2 overflow-x-auto scrollbar-none bg-black/5">
            {images.map((img, idx) => (
              <button key={idx} onClick={() => goTo(idx, true)}
                className={`shrink-0 w-12 h-9 rounded overflow-hidden border-2 transition-all hover:cursor-pointer ${idx === curr ? "border-primary-gold opacity-100" : "border-transparent opacity-50 hover:opacity-80"}`}
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <div className="relative w-full max-w-4xl px-4" onClick={(e) => e.stopPropagation()} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ height: "70vh" }}>
              <img src={images[curr].url} alt="" className="w-full h-full object-contain" />
            </div>

            <button onClick={() => setLightbox(false)} className="absolute -top-10 right-4 text-white hover:text-primary-gold transition-colors hover:cursor-pointer">
              <X size={28} />
            </button>

            {!single && <span className="absolute top-2 left-6 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">{curr + 1} / {images.length}</span>}

            {!single && (
              <>
                <button onClick={() => prevSlide(true)} className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-colors hover:cursor-pointer">
                  <ChevronLeft size={24} />
                </button>
                <button onClick={() => nextSlide(true)} className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-colors hover:cursor-pointer">
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {!single && (
              <div className="flex justify-center gap-2 mt-4 overflow-x-auto scrollbar-none pb-1">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => goTo(idx, true)}
                    className={`shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition-all hover:cursor-pointer ${idx === curr ? "border-primary-gold opacity-100" : "border-transparent opacity-40 hover:opacity-70"}`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes imgProgress { from { width: 0% } to { width: 100% } }`}</style>
    </>
  );
}
