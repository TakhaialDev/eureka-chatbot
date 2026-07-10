"use client";
import ErrorBoundary from "@/components/hooks/ErrorBoundary";
import {motion} from "framer-motion";
import SendMessageComponent from "./_components/SendMessage";
import { useEffect, useState } from "react";
import useShowChat from "@/lib/tanstack/Chat/useShow";
import { useRouter, useSearchParams } from "next/navigation";
import MessageComponent from "./_components/Message";
import Cookies from 'js-cookie';

export default function Chat() {
  const router = useRouter();
  const [messageRes,setMessageRes] = useState<"Typing" | "Speaking" | null>(null)
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [chatId,setChatId] = useState<string | null>(null);
  const sessionId = chatId || id;
  const {data,...methods} = useShowChat(sessionId);
  const messages = data?.data || [];
 /*  console.log("all messages",messages); */
  
  useEffect(()=>{
    if(!id){
      const session_id = Cookies.get("session_id") || localStorage.getItem("session_id");
      if (session_id) {
        router.push(`/?id=${session_id}`);
      }
    } else {
      setChatId(id);
    }
  },[id, router])
  return (
    <div className='bg-cream-bg flex flex-col grow h-full overflow-hidden'>
      {
        !!sessionId ? 
        <motion.div 
            className='w-full flex flex-col h-full overflow-hidden'
        >
            <ErrorBoundary {...methods}>
              {/* Messages Container — full-width so scrollbar sits at viewport right edge */}
              <div className='flex-1 flex flex-col-reverse overflow-y-auto py-2 mb-2'>
                <div className='flex flex-col-reverse gap-4 px-3 sm:px-6 w-full'>
                  {
                      messages?.map((m:any)=>{
                          return(
                              <MessageComponent
                              key={m.id}
                              data={m}
                              setMessageRes={setMessageRes}
                              />
                          )
                      })
                  }
                </div>
              </div>
              
              {/* Fixed Bottom Input Area */}
              <div className="pb-4 px-3 sm:px-6 w-full shrink-0">
                <SendMessageComponent 
                session_id={sessionId} 
                messageRes={messageRes}
                setMessageRes={setMessageRes}
                />
              </div>
            </ErrorBoundary>
        </motion.div> : 
        <></>
      }

    </div>
  );
}
