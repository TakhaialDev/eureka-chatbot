"use client";
import { switchSidebar } from "@/redux/slices/app";
import { useDispatch } from "react-redux";
import { Menu, Pencil } from "lucide-react";
import useShowSessions from "@/lib/tanstack/Sessions/useShow";
import { useSearchParams } from "next/navigation";
import ErrorBoundary from "@/components/hooks/ErrorBoundary";
import UpdateSessionModal from "@/components/ui/Modals/UpdateSession";
import { useState } from "react";
import Image from "next/image";
import { FaPhone } from "react-icons/fa";

export default function Header() {
  const searchParams = useSearchParams();
  const [modal,setModal] = useState(false);
  const id = searchParams.get("id") || "";
  const dispatch = useDispatch();
  const expandSidebar = ()=>{
    dispatch(switchSidebar(true));
  }
  const {data,...methods} = useShowSessions(id);
  const res = data?.data || {}; 

  
  return (
    <div className="bg-dark-navy border-b border-primary-gold/20 px-4 py-3 flex justify-between items-center gap-3">
      <ErrorBoundary {...methods} silent>
      <UpdateSessionModal 
      isOpen={modal}
      setIsOpen={setModal}
      data={res}
      />
      </ErrorBoundary>
      <div className="flex">
        <Image
        src={"/logo.png"}
        alt="Eureka"
        width={200}
        height={200}
        className="w-24 h-auto"
        />
      </div>

      <ErrorBoundary {...methods} silent>
        <button 
        type="button"
        title="Update Session Title"
        onClick={()=>setModal(true)}
        className="group hover:cursor-pointer font-semibold text-white truncate capitalize flex items-center gap-1">
          <span>{res?.title}</span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity" ><Pencil size={16}/></span>
        </button>
      </ErrorBoundary>
      <a href="https://call-eureka.takhaial.com/" target="_blank" title="Call Eureka">
        <FaPhone size={28} className="text-primary-gold hover:opacity-80 transition-opacity"/>
      </a>
      <button 
        onClick={expandSidebar}
        className="lg:hidden text-white hover:text-primary-gold"
      >
        <Menu className="w-6 h-6" />
      </button>
    </div>
  )
}
