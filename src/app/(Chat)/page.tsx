"use client";
import ErrorBoundary from "@/components/hooks/ErrorBoundary";
import { motion } from "framer-motion";
import SendMessageComponent from "./_components/SendMessage";
import { useEffect, useState } from "react";
import useShowChat from "@/lib/tanstack/Chat/useShow";
import { useRouter, useSearchParams } from "next/navigation";
import MessageComponent from "./_components/Message";
import Cookies from 'js-cookie';
import Image from "next/image";

const SUGGESTED_PROMPTS = [
  { label: "Find me a TV", prompt: "What 4K TVs do you have under KD 200?" },
  { label: "Best laptops", prompt: "Show me your best laptops for students" },
  { label: "iPhone vs Samsung", prompt: "Compare the latest iPhone and Samsung Galaxy for me" },
  { label: "Home appliances", prompt: "What washing machines are currently on offer?" },
];

function WelcomeScreen() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="flex justify-center mb-4">
          <Image
            src="/eureka-logo-white.png"
            alt="Eureka"
            width={160}
            height={48}
            className="h-10 w-auto object-contain dark:block hidden"
          />
          <Image
            src="/eureka-logo-green.png"
            alt="Eureka"
            width={160}
            height={48}
            className="h-10 w-auto object-contain dark:hidden block"
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          How can I{" "}
          <span className="eureka-gradient-text">assist you</span>{" "}
          today?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Ask me anything about Eureka — electronics, home appliances, offers, and more.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="grid w-full max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-2"
      >
        {SUGGESTED_PROMPTS.map((item, i) => (
          <PromptCard key={i} item={item} />
        ))}
      </motion.div>
    </div>
  );
}

function PromptCard({ item }: { item: { label: string; prompt: string } }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="eureka-gradient-border flex flex-col gap-1.5 rounded-xl bg-card p-4 text-left cursor-default transition-colors hover:bg-accent"
    >
      <span className="text-sm font-semibold text-foreground">{item.label}</span>
      <span className="text-xs text-muted-foreground line-clamp-2">{item.prompt}</span>
    </motion.div>
  );
}

export default function Chat() {
  const router = useRouter();
  const [messageRes, setMessageRes] = useState<"Typing" | "Speaking" | null>(null);
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [chatId, setChatId] = useState<string | null>(null);
  const sessionId = chatId || id;
  const { data, ...methods } = useShowChat(sessionId);
  const messages = data?.data || [];

  useEffect(() => {
    if (!id) {
      const session_id = Cookies.get("session_id") || localStorage.getItem("session_id");
      if (session_id) {
        router.push(`/?id=${session_id}`);
      }
    } else {
      setChatId(id);
    }
  }, [id, router]);

  const showWelcome = !!sessionId && messages.length === 0 && methods.isSuccess;

  return (
    <div className="flex flex-col grow h-full overflow-hidden">
      {!!sessionId ? (
        <motion.div
          className="w-full flex flex-col h-full overflow-hidden"
        >
          <ErrorBoundary {...methods}>
            {showWelcome ? (
              <WelcomeScreen />
            ) : (
              <div className="flex-1 flex flex-col-reverse overflow-y-auto py-2 mb-2">
                <div className="flex flex-col-reverse gap-4 px-4 sm:px-8 w-full">
                  {messages?.map((m: any) => (
                    <MessageComponent
                      key={m.id}
                      data={m}
                      setMessageRes={setMessageRes}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Fixed Bottom Input Area */}
            <div className="pb-4 px-4 sm:px-8 w-full shrink-0">
              <SendMessageComponent
                session_id={sessionId}
                messageRes={messageRes}
                setMessageRes={setMessageRes}
              />
            </div>
          </ErrorBoundary>
        </motion.div>
      ) : null}
    </div>
  );
}
