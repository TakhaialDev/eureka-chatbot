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
import { AiFillSound } from "react-icons/ai";
import Images from '@/components/ui/MessageImages';
import { ChatLeadWidget } from '@/components/ui/LeadCaptureWidget';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MessageComponent({
    data,
    setMessageRes
}: {
    data: ChatMessage;
    setMessageRes:React.Dispatch<React.SetStateAction<"Speaking" | "Typing" | null>>;
}) {
    const queryClient = useQueryClient();
    const [taskId, setTaskId] = useState<string | null>(null);
    const { data: taskStatusData, ...methods } = useStatusTaskVoice(taskId);
    /* console.log(taskStatusData); */
    const taskResponse = taskStatusData?.data?.result;
    const status = taskStatusData?.data?.status;
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("id") || "";
    const [micLoading, setMicLoading] = useState(false);

    const onSuccess = (data: any) => {
        /* console.log("voice success",data); */
        setTaskId(data?.data?.task_id);

    };
    const onError = (e: any) => {
        console.log("voice error", e);
        toast.error(e?.response?.data?.message || "error occurred");
        setMicLoading(false);
        setMessageRes(null);
    }
    const readAloudMutation = useReadAloud({ onSuccess, onError });
    const handleReadAloud = () => {
        readAloudMutation.mutate({
            text: data.content,
            message_id: data.id,
            session_id: sessionId
        });
        setMicLoading(true);
        setMessageRes("Speaking");
    }
    useEffect(() => {
        if (methods.isSuccess && status === "completed") {
            /* queryClient.invalidateQueries({ queryKey: ["chat", "show", sessionId] }); */
              queryClient.setQueryData(
                ["chat", "show", sessionId],
                (old: { data: ChatMessage[] } | undefined) => {
                if (!old) return old;

                return {
                    ...old,
                    data: old.data.map(msg =>
                    msg.id === data.id
                        ? {
                            ...msg,
                            audio_url: taskResponse?.ai_audio_url,
                        }
                        : msg
                    ),
                };
                }
            );
            setMicLoading(false);
            setMessageRes(null);
        }
    }, [status, methods.isSuccess]);

    // Phone numbers (+965 2576 1100) sitting inside an RTL Arabic line get bidi-reordered
    // by the browser — digit groups can visually shuffle and the "+" can jump to the wrong
    // side, since digits are "weak" bidi characters pulled into the surrounding RTL run.
    // Wrap them in Unicode directional-isolate marks (LRI...PDI) so they always render as
    // a stable left-to-right unit regardless of surrounding text direction.
    const isolateLtrNumbers = (text: string) =>
        text.replace(/\+?\d[\d\s-]{6,}\d/g, (m) => `\u2066${m}\u2069`);

    const messageContent =
        data.content.trim() !== "" && data.content.trim() !== "."
            ? isolateLtrNumbers(data.content.replace(/\\n/g, "\n"))
            : "";

    // dir="auto" picks direction from the first strong-directional character in the
    // whole block, which is unreliable here: messages mix Arabic sentences with Latin
    // brand/model names (Honor, Snapdragon), units (GB, MP), and digits, and a Latin
    // token appearing early can lock the entire bubble — including list bullets — to
    // LTR even though the surrounding text is Arabic. Detect explicitly instead.
    const RTL_RE = /[֑-߿יִ-﷿ﹰ-﻿]/;
    // Per-paragraph direction (not per-message) since some messages, e.g. the welcome
    // message, concatenate a full English section then a full Arabic section in one
    // bubble — a single whole-message check would wrongly force the English part RTL.
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

    return (
        <div className={`flex gap-2 w-full min-w-0
            ${data?.role === "user"
              ? "flex-col items-end md:flex-row md:justify-end"
              : "flex-col items-start md:flex-row md:justify-start"}`}>
            {/* Avatar — above bubble on mobile, beside on md+ */}
            <div
                className={`
                w-7 h-7 md:w-10 md:h-10 aspect-square border border-primaryA1 rounded-full
                flex items-center justify-center object-cover shadow-xl shrink-0 overflow-hidden
            ${data?.role === "user" ? "md:order-2" : ""}`}
            >
                {
                    data.role === "assistant" ?
                        <Image width={200} height={200} alt='Eureka Assistant' className='w-5 md:w-10 h-auto object-cover rounded-full' src={"/logoBlue.png"} />
                        :
                        <FaUser />
                }
            </div>
            {/* Body */}
            <div className={`flex flex-col gap-2 min-w-0 w-full md:w-fit md:max-w-[70%] ${data?.role === "user" ? "items-end" : "items-start"}`}>

                {/* Reply preview */}
                {data.role === "assistant" && data.reply_to && (
                    <div className="px-3 py-1.5 rounded-lg border-l-4 border-primary-gold bg-primary-gold/10 text-dark-navy text-sm max-w-full overflow-hidden">
                        <p className="truncate opacity-70">{data.reply_to.content}</p>
                    </div>
                )}

                {/* Message */}
                {
                    messageContent &&
                    <div className={`
                        px-2 md:px-4 py-1 md:py-2 rounded-xl text-base w-fit max-w-full overflow-hidden break-words
                        ${data?.role === "user" ?
                            "rounded-tr-none bg-dark-navy text-white ms-auto shadow-md"
                            : "rounded-tl-none bg-primary-gold text-dark-navy me-auto shadow-md"
                        }
                        ${data.role === "user" && data.audio_url ? "order-2" : ""}
                    `}
                        dir={messageDir}
                    >
                        <ReactMarkdown

                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap leading-relaxed text-start" dir={dirOf(children)}>{children}</p>,
                                ul: ({ children }) => <ul className="list-disc ms-4 mb-2" dir={dirOf(children)}>{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal ms-4 mb-2" dir={dirOf(children)}>{children}</ol>,
                                strong: ({ children }) => <span className={`font-bold ${data.role === "assistant" ? "text-dark-navy decoration-dark-navy/20" : "text-white decoration-white/20"} underline`}>{children}</span>,
                                a: ({ children, href }) => <a href={href} className={`${data.role === "assistant" ? "text-dark-navy" : "text-white"} hover:opacity-80 underline decoration-dotted`} target="_blank" rel="noopener noreferrer">{children}</a>
                            }}
                        >
                            {messageContent}
                        </ReactMarkdown>
                    </div>
                }


                {/* Images Display */}
                {
                    data.role === "assistant" &&
                    data.images?.length &&
                    (
                        <Images images={data.images} />
                    )
                }

                {/* Audio Message */}
                {
                    data.audio_url &&
                    <VoiceMessage
                        src={data.audio_url}
                        className="w-full"
                        role={data?.role}
                    />
                }
                {
                    data.role === "assistant" && !!!data.audio_url &&
                    <div className='flex items-center'>
                        <button
                            className='hover:cursor-pointer hover:bg-primary-gold/10 text-primary-gold border border-primary-gold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors'
                            onClick={handleReadAloud}
                            type='button'
                            title='Read Aloud'
                            disabled={micLoading}
                        >
                            {
                                micLoading ?
                                    <div className="w-4 h-4 border-2 border-primary-gold/30 border-t-primary-gold rounded-full animate-spin" /> :
                                    <AiFillSound />
                            }

                            <span>Read Aloud</span>
                        </button>
                    </div>
                }

                {
                    data.role === "assistant" && data.widget && sessionId &&
                    <ChatLeadWidget
                        widget={data.widget}
                        sessionId={sessionId}
                        messageId={data.id}
                    />
                }
            </div>
        </div>
    )
}
