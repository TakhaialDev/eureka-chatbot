"use client";
import ErrorBoundary from '@/components/hooks/ErrorBoundary';
import useCreateSessions from '@/lib/tanstack/Sessions/useCreate';
import useDeleteSession from '@/lib/tanstack/Sessions/useDelete';
import useIndexSessions from '@/lib/tanstack/Sessions/useIndex';
import { closeSidebar } from '@/redux/slices/app';
import { logOut } from '@/redux/slices/user';
import { SessionType } from '@/utils/types&schemas/Generic/Session';
import { MessageSquare, Plus, Trash2, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { useTheme } from 'next-themes';

function groupSessionsByDate(sessions: SessionType[]) {
  const now = new Date();
  const today: SessionType[] = [];
  const yesterday: SessionType[] = [];
  const thisWeek: SessionType[] = [];
  const older: SessionType[] = [];

  sessions.forEach((s) => {
    const created = s.created_at ? new Date(s.created_at) : null;
    if (!created) { older.push(s); return; }
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) today.push(s);
    else if (diffDays === 1) yesterday.push(s);
    else if (diffDays <= 7) thisWeek.push(s);
    else older.push(s);
  });
  return { today, yesterday, thisWeek, older };
}

export default function Sidebar() {
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const paramId = searchParams.get("id");
  const router = useRouter();
  const isExpanded = useSelector((state: any) => state.app.isExpanded);
  const dispatch = useDispatch();
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const { data, ...methods } = useIndexSessions();
  const sessions: SessionType[] = data?.data || [];

  const grouped = groupSessionsByDate(sessions);

  const handleCloseSidebar = () => dispatch(closeSidebar(true));

  const deleteSession = useDeleteSession({});
  const handleDeleteSession = (id: string) => {
    deleteSession.mutate(id);
    if (paramId === id) router.replace("/");
  };

  const handleOpenSession = (id: string) => {
    Cookies.set("session_id", id);
    router.push(`/?id=${id}`);
    handleCloseSidebar();
  };

  const handleLogout = () => dispatch(logOut());

  const onSuccess = (data: any) => {
    router.push(`/?id=${data?.data?.session_id}`);
  };
  const onError = (e: any) => {
    toast.error(e?.response?.data?.detail || "Error Occurred");
  };

  const createSession = useCreateSessions({ onSuccess, onError });
  const handleCreateSession = () => createSession.mutate();

  useEffect(() => {
    if (methods.isSuccess && sessions.length === 0 && !createSession.isPending) {
      createSession.mutate();
    }
  }, [methods.isSuccess, sessions.length]);

  useEffect(() => {
    const validSession = sessions.find((s) => s.session_id === paramId);
    if (sessions.length > 0 && !validSession) {
      handleOpenSession(sessions[0].session_id);
    }
  }, [sessions.length, paramId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (sidebarRef.current && !sidebarRef.current.contains(target)) {
        handleCloseSidebar();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseSidebar();
    };
    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isExpanded]);

  const logoSrc = mounted && resolvedTheme === 'light' ? '/eureka-logo-green.png' : '/eureka-logo-white.png';

  const SidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/40">
        <Image
          src={logoSrc}
          alt="Eureka"
          width={120}
          height={36}
          className="h-8 w-auto object-contain"
        />
        <button
          onClick={handleCloseSidebar}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat */}
      <div className="p-3">
        <button
          onClick={handleCreateSession}
          disabled={createSession.isPending}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium eureka-gradient text-white shadow-md shadow-green-500/20 hover:shadow-green-500/35 transition-shadow disabled:opacity-60"
        >
          <Plus className="h-4 w-4 flex-shrink-0" />
          New Chat
        </button>
      </div>

      {/* Sessions list */}
      <ErrorBoundary {...methods}>
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-4">
          <SessionGroup
            label="Today"
            sessions={grouped.today}
            paramId={paramId}
            onOpen={handleOpenSession}
            onDelete={handleDeleteSession}
          />
          <SessionGroup
            label="Yesterday"
            sessions={grouped.yesterday}
            paramId={paramId}
            onOpen={handleOpenSession}
            onDelete={handleDeleteSession}
          />
          <SessionGroup
            label="This week"
            sessions={grouped.thisWeek}
            paramId={paramId}
            onOpen={handleOpenSession}
            onDelete={handleDeleteSession}
          />
          <SessionGroup
            label="Older"
            sessions={grouped.older}
            paramId={paramId}
            onOpen={handleOpenSession}
            onDelete={handleDeleteSession}
          />
        </div>
      </ErrorBoundary>

      {/* Footer */}
      <div className="border-t border-border/40 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-destructive transition-all"
        >
          <LogOut className="h-4 w-4" />
          Reset Data
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col border-r border-border/40 bg-card/60 backdrop-blur-sm h-dvh">
        {SidebarContent}
      </aside>

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {isExpanded && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={handleCloseSidebar}
            />
            <motion.div
              key="drawer"
              ref={sidebarRef}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 flex flex-col border-r border-border/40 bg-card lg:hidden shadow-2xl"
            >
              {SidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SessionGroup({
  label,
  sessions,
  paramId,
  onOpen,
  onDelete,
}: {
  label: string;
  sessions: SessionType[];
  paramId: string | null;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (sessions.length === 0) return null;
  return (
    <div>
      <p className="mb-1 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <div className="space-y-0.5">
        {sessions.map((s) => (
          <SessionItem
            key={s.session_id}
            session={s}
            isActive={s.session_id === paramId}
            onOpen={onOpen}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function SessionItem({
  session,
  isActive,
  onOpen,
  onDelete,
}: {
  session: SessionType;
  isActive: boolean;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      whileHover={{ x: 2 }}
      className={`group flex items-center gap-2 rounded-xl px-2 py-2 cursor-pointer transition-colors text-sm ${
        isActive
          ? 'bg-primary/10 text-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
      onClick={() => onOpen(session.session_id)}
    >
      <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
      <span className="flex-1 truncate text-xs leading-relaxed">{session.title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(session.session_id);
        }}
        className="hidden group-hover:flex h-5 w-5 flex-shrink-0 items-center justify-center rounded hover:text-destructive transition-colors"
        aria-label="Delete session"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </motion.div>
  );
}
