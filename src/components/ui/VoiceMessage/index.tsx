import { useWavesurfer } from "@wavesurfer/react";
import { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";

type Props = {
  src: string;
  className?: string;
  role: "user" | "assistant";
};

export default function VoiceMessage({ src, className = "", role }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const isDragging = useRef(false);

  const { wavesurfer } = useWavesurfer({
    container: containerRef,
    url: src,
    height: 32,
    barWidth: 2,
    barGap: 2,
    barRadius: 2,
    waveColor:     "rgba(156,163,175,0.55)",
    progressColor: role === "user" ? "#ebc09d" : "#00323c",
    cursorColor:   "transparent",
    cursorWidth:   0,
    normalize:     true,
    interact:      false,
  });

  useEffect(() => {
    if (!wavesurfer) return;
    wavesurfer.on("ready",      () => setDuration(wavesurfer.getDuration()));
    wavesurfer.on("play",       () => setIsPlaying(true));
    wavesurfer.on("pause",      () => setIsPlaying(false));
    wavesurfer.on("timeupdate", (time) => { if (!isDragging.current) setCurrentTime(time); });
  }, [wavesurfer]);

  const seekFromClientX = (clientX: number) => {
    const el = containerRef.current;
    if (!el || !wavesurfer || !duration) return;
    const rect  = el.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    wavesurfer.seekTo(ratio);
    setCurrentTime(ratio * duration);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    seekFromClientX(e.clientX);
    const onMove = (ev: MouseEvent) => seekFromClientX(ev.clientX);
    const onUp   = () => {
      isDragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    seekFromClientX(e.touches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    seekFromClientX(e.touches[0].clientX);
  };
  const handleTouchEnd = () => { isDragging.current = false; };

  const formatTime = (sec: number) => {
    const s = Math.floor(sec);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  return (
    <div className={`flex items-center gap-3 ${role === "user" ? "bg-dark-navy shadow-md" : "bg-primary-gold shadow-md"} rounded-xl px-3 py-2 w-full max-w-[480px] md:max-w-[560px] ${className}`}>
      <button
        onClick={() => wavesurfer?.playPause()}
        className={`w-9 h-9 rounded-full ${role === "user" ? "bg-primary-gold text-dark-navy" : "bg-dark-navy text-white"} flex items-center justify-center hover:cursor-pointer transition-colors shrink-0`}
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>

      <div
        className="flex-1 min-w-0 cursor-pointer select-none"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div ref={containerRef} />
      </div>

      <span className={`text-xs md:text-sm md:font-medium shrink-0 tabular-nums ${role === "user" ? "text-primary-gold" : "text-dark-navy"}`}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}
