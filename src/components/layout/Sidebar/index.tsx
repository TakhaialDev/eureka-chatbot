"use client";
import ErrorBoundary from '@/components/hooks/ErrorBoundary';
import useCreateSessions from '@/lib/tanstack/Sessions/useCreate';
import useDeleteSession from '@/lib/tanstack/Sessions/useDelete';
import useIndexSessions from '@/lib/tanstack/Sessions/useIndex';
import { closeSidebar } from '@/redux/slices/app';
import { logOut } from '@/redux/slices/user';
import { SessionType } from '@/utils/types&schemas/Generic/Session';
import { MessageSquare, Plus, Trash2, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';


export default function Sidebar() {
    const sidebarRef = useRef<HTMLDivElement | null>(null);
    const searchParams = useSearchParams();
    const paramId = searchParams.get("id");
    const router = useRouter();
    const isExpanded = useSelector((state: any) => state.app.isExpanded);
    const dispatch = useDispatch();  
    // fetch user sessions
    const {data,...methods} = useIndexSessions();
    
    const sessions:SessionType[] = data?.data || []
    // Memoized function to close sidebar
    const handleCloseSidebar = () => {
        dispatch(closeSidebar(true));
    }
    const deleteSession = useDeleteSession({});
    const handleDeleteSession = (id:string)=>{
      deleteSession.mutate(id);
      if(paramId == id){
        router.replace("/");
      }
    }
    const handleOpenSession = (id:string)=>{
      Cookies.set("session_id", id);
      router.push(`/?id=${id}`)
    }
    const handleLogout = ()=>{
      dispatch(logOut())
    }
    const onSuccess = (data:any)=>{
      console.log(data);
      router.push(`/?id=${data?.data?.session_id}`)
    }
    const onError = (e:any)=>{
      toast.error(e?.response?.data?.detail ||"Error Occurred");

    }

    const createSession = useCreateSessions({onSuccess,onError});
    const handleCreateSession = ()=>{
        createSession.mutate();
    }
  useEffect(() => {
    if (methods.isSuccess && sessions.length === 0 && !createSession.isPending) {
      createSession.mutate();
    }
  }, [methods.isSuccess, sessions.length]);

  useEffect(() => {
    const validSession = sessions.find(s => s.session_id === paramId);
    if (sessions.length > 0 && !validSession) {
      handleOpenSession(sessions[0].session_id);
    }
  }, [sessions.length, paramId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent): void => {
      const target = event.target as Node;

      if (sidebarRef.current && !sidebarRef.current.contains(target)) {
        handleCloseSidebar();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseSidebar();
    };
    if(isExpanded){
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }


    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [handleCloseSidebar,isExpanded]);
  return (
    <div className={`${isExpanded ? 'translate-x-0 h-full' : '-translate-x-full'} 
    fixed lg:relative lg:translate-x-0 z-20 w-64 bg-sidebar-bg border-r border-white/10 
    transition-transform duration-300 ease-in-out flex flex-col items-center`}
    ref={sidebarRef}
    >
    
      {/* Logo & Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between w-full">
          <button 
          onClick={handleCloseSidebar}
          className="lg:hidden text-gray-400 hover:text-white"
          >
          <X className="w-5 h-5 text-white" />
          </button>
      </div>

      {/* New Session Button */}
      <div className="p-3 w-full">
          <button 
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-gold  hover:cursor-pointer
            hover:bg-primary-gold/90 text-white rounded-lg transition-colors font-medium`
          }
          onClick={handleCreateSession}
          >
          <Plus className="w-5 h-5" />
          New Chat
          </button>
      </div>

      {/* Sessions List */}
      <ErrorBoundary {...methods}>
        <div className="flex-1 overflow-y-auto p-3 space-y-1 grow w-full">
          {sessions.map((session:SessionType) => (
            <div
              key={session.session_id}

              className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer 
                transition-colors ${paramId === session.session_id 
                  ? 'bg-primary-gold/20 text-primary-gold border border-primary-gold/50' 
                  : 'hover:bg-white/5 text-gray-300 hover:text-white'}`}
            >
                <div 
                onClick={()=>handleOpenSession(session.session_id)}
                className="flex items-center gap-2 flex-1 min-w-0">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium truncate">{session.title}</span>
                </div>
                <button
                  onClick={()=>handleDeleteSession(session.session_id)}
                  className=" p-1 hover:bg-red-50  hover:cursor-pointer
                    rounded text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
            </div>
          ))}
        </div>
      </ErrorBoundary>
      {/* Reset Data button */}
      <div className='mt-auto flex justify-center py-10 px-4'>
        <button
        className='grow btn btn-secondary'
        type='button'
        onClick={handleLogout}
        >Reset Data</button>
      </div>
    </div>
  )
}
