"use client";
import { switchSidebar } from "@/redux/slices/app";
import { useDispatch } from "react-redux";
import { Menu, Pencil, Phone, Sun, Moon } from "lucide-react";
import useShowSessions from "@/lib/tanstack/Sessions/useShow";
import { useSearchParams } from "next/navigation";
import ErrorBoundary from "@/components/hooks/ErrorBoundary";
import UpdateSessionModal from "@/components/ui/Modals/UpdateSession";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" />;
  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-accent transition-all"
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}

export default function Header() {
  const searchParams = useSearchParams();
  const [modal, setModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const id = searchParams.get("id") || "";
  const dispatch = useDispatch();
  const { resolvedTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const expandSidebar = () => dispatch(switchSidebar(true));
  const { data, ...methods } = useShowSessions(id);
  const res = data?.data || {};

  const logoSrc = mounted && resolvedTheme === "light" ? "/eureka-logo-green.png" : "/eureka-logo-white.png";

  return (
    <header className="sticky top-0 z-20 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <ErrorBoundary {...methods} silent>
        <UpdateSessionModal
          isOpen={modal}
          setIsOpen={setModal}
          data={res}
        />
      </ErrorBoundary>

      <div className="flex h-14 items-center gap-3 px-4">
        {/* Mobile hamburger */}
        <button
          onClick={expandSidebar}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-accent transition-all"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Logo — desktop only (sidebar has it too) */}
        <div className="hidden lg:block">
          <Image
            src={logoSrc}
            alt="Eureka"
            width={120}
            height={36}
            className="h-8 w-auto object-contain"
          />
        </div>

        {/* Session title — centered */}
        <div className="flex-1 flex justify-center">
          <ErrorBoundary {...methods} silent>
            <button
              type="button"
              title="Update Session Title"
              onClick={() => setModal(true)}
              className="group hover:cursor-pointer font-semibold text-foreground truncate capitalize flex items-center gap-1.5 max-w-xs"
            >
              <span className="truncate text-sm">{res?.title}</span>
              <span className="opacity-0 group-hover:opacity-60 transition-opacity shrink-0">
                <Pencil size={14} />
              </span>
            </button>
          </ErrorBoundary>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <a
            href="https://call-eureka.takhaial.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="Switch to Voice Call"
            className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-accent hover:shadow-green-500/10 hover:shadow-md"
          >
            <Phone className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">Voice Call</span>
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
