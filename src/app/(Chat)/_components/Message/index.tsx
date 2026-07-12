"use client";
import VoiceMessage from '@/components/ui/VoiceMessage';
import useReadAloud from '@/lib/tanstack/Voice/useReadAloud';
import useStatusTaskVoice from '@/lib/tanstack/Voice/useTaskStatus';
import { ChatMessage } from '@/utils/types&schemas/Generic/Chat';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { Volume2, Loader2 } from 'lucide-react';
import MessageImages from '@/components/ui/MessageImages';
import { ChatLeadWidget } from '@/components/ui/LeadCaptureWidget';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';

export default function MessageComponent({
  data,
  setMessageRes,
}: {
  data: ChatMessage;
  setMessageRes: React.Dispatch<React.SetStateAction<"Speaking" | "Typing" | null>>;
}) {
  const queryClient = useQueryClient();
  const [taskId, setTaskId] = useState<string | null>(null);
  const { data: taskStatusData, ...methods } = useStatusTaskVoice(taskId);
  const taskResponse = taskStatusData?.data?.result;
  const status = taskStatusData?.data?.status;
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("id") || "";
  const [micLoading, setMicLoading] = useState(false);

  const onSuccess = (data: any) => {
    setTaskId(data?.data?.task_id);
  };
  const onError = (e: any) => {
    toast.error(e?.response?.data?.message || "error occurred");
    setMicLoading(false);
    setMessageRes(null);
  };
  const readAloudMutation = useReadAloud({ onSuccess, onError });

  const handleReadAloud = () => {
    readAloudMutation.mutate({
      text: data.content,
      message_id: data.id,
      session_id: sessionId,
    });
    setMicLoading(true);
    setMessageRes("Speaking");
  };

  useEffect(() => {
    if (methods.isSuccess && status === "completed") {
      queryClient.setQueryData(
        ["chat", "show", sessionId],
        (old: { data: ChatMessage[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((msg) =>
              msg.id === data.id
                ? { ...msg, audio_url: taskResponse?.ai_audio_url }
                : msg
            ),
          };
        }
      );
      setMicLoading(false);
      setMessageRes(null);
    }
  }, [status, methods.isSuccess]);

  // Wrap phone numbers in LTR isolate marks to prevent bidi reordering
  const isolateLtrNumbers = (text: string) =>
    text.replace(/\+?\d[\d\s-]{6,}\d/g, (m) => `\u2066${m}\u2069`);

  const messageContent =
    data.content.trim() !== "" && data.content.trim() !== "."
      ? isolateLtrNumbers(data.content.replace(/\\n/g, "\n"))
      : "";

  const RTL_RE = /[֑-߿יִ-﷿ﹰ-﻿]/;
  const textOf = (node: React.ReactNode): string => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(textOf).join("");
    if (node && typeof node === "object" && "props" in node) {
      return textOf((node as { props: { children?: React.ReactNode } }).props.children);
    }
    return "";
  };
  const dirOf = (node: React.ReactNode) => RTL_RE.test(textOf(node)) ? "rtl" : "ltr";
  const messageDir = dirOf(messageContent);

  const isUser = data.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex gap-2.5 w-full min-w-0 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div className="mt-1 h-7 w-7 flex-shrink-0 overflow-hidden rounded-full border border-border/50 bg-card shadow-sm">
          <Image
            width={28}
            height={28}
            alt="Eureka Assistant"
            className="h-full w-full object-contain rounded-full"
            src="/eureka-logo-green.png"
          />
        </div>
      )}

      {/* Body */}
      <div className={`flex flex-col gap-2 min-w-0 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>

        {/* Reply preview */}
        {!isUser && data.reply_to && (
          <div className="px-3 py-1.5 rounded-lg border-l-4 border-primary bg-primary/10 text-foreground text-sm max-w-full overflow-hidden">
            <p className="truncate opacity-70">{data.reply_to.content}</p>
          </div>
        )}

        {/* Message bubble */}
        {messageContent && (
          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed break-words overflow-hidden max-w-full ${
              isUser
                ? "rounded-br-sm bg-secondary text-foreground shadow-sm"
                : "rounded-tl-sm border border-border/50 bg-card/70 backdrop-blur-sm text-foreground shadow-sm"
            } ${isUser && data.audio_url ? "order-2" : ""}`}
            dir={messageDir}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0 whitespace-pre-wrap leading-relaxed text-start" dir={dirOf(children)}>
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc ms-4 mb-2" dir={dirOf(children)}>{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal ms-4 mb-2" dir={dirOf(children)}>{children}</ol>
                ),
                strong: ({ children }) => (
                  <span className="font-bold underline decoration-current/20">{children}</span>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    className="text-primary hover:opacity-80 underline decoration-dotted"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {messageContent}
            </ReactMarkdown>
          </div>
        )}

        {/* Product images */}
        {!isUser && data.images?.length ? (
          <MessageImages images={data.images} />
        ) : null}

        {/* Audio message player */}
        {data.audio_url && (
          <VoiceMessage
            src={data.audio_url}
            className="w-full"
            role={data.role}
          />
        )}

        {/* Read Aloud button (only for assistant messages without audio_url) */}
        {!isUser && !data.audio_url && (
          <div className="flex items-center">
            <button
              className="hover:cursor-pointer border border-primary/50 text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors"
              onClick={handleReadAloud}
              type="button"
              title="Read Aloud"
              disabled={micLoading}
            >
              {micLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
              <span>Read Aloud</span>
            </button>
          </div>
        )}

        {/* Lead capture widget */}
        {!isUser && data.widget && sessionId && (
          <ChatLeadWidget
            widget={data.widget}
            sessionId={sessionId}
            messageId={data.id}
          />
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="mt-1 h-7 w-7 flex-shrink-0 rounded-full border border-border/50 bg-secondary flex items-center justify-center shadow-sm">
          <FaUser className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      )}
    </motion.div>
  );
}
