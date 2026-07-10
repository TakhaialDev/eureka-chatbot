import { useVoiceRecorder } from '@/components/hooks/VoiceRecorder';
import useVoice from '@/lib/tanstack/Voice/useRecord';
import useStatusTaskVoice from '@/lib/tanstack/Voice/useTaskStatus';
import { ChatMessage } from '@/utils/types&schemas/Generic/Chat';
import { skipPendingWidgets } from '@/utils/types&schemas/leadStorage';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react'
import { FaMicrophoneAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';


export default function RecorderButton({
    isRecording,
    setIsRecording,
    setStream,
    isBusy,
    setIsVoiceBusy,
    addToQueueDisplay,
    removeFromQueueDisplay,
    className = "",
    variant = "default",
}:{
    isRecording: boolean;
    setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
    setStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
    isBusy: boolean;
    setIsVoiceBusy: React.Dispatch<React.SetStateAction<boolean>>;
    addToQueueDisplay: (item: { id: string; label: string }) => void;
    removeFromQueueDisplay: (id: string) => void;
    className?: string;
    variant?: "default" | "whatsapp";
}) {
    const queryClient = useQueryClient();
    const [taskId, setTaskId] = useState<string | null>(null);
    const { data: taskStatusData, ...methods } = useStatusTaskVoice(taskId);
    const status = taskStatusData?.data?.status;
    const recorderResponse = taskStatusData?.data?.result;

    const blobQueue = useRef<{ id: string; blob: Blob }[]>([]);
    const lockModeRef = useRef(false);
    const pendingLockRef = useRef(false);
    const pressStartRef = useRef(0);
    const CLICK_THRESHOLD_MS = 250;
    const searchParams = useSearchParams();
    const id = searchParams.get("id") || "";

    const [isLocked, setIsLocked] = useState(false);

    const { startRecording, stopRecording } = useVoiceRecorder();

    const onSuccess = (data: any) => {
        setTaskId(data?.data?.task_id);
    };
    const onError = (e: any) => {
        console.log("voice error", e);
        toast.error(e?.response?.data?.message || "error occurred");
        setIsVoiceBusy(false);
    };
    const voiceMutation = useVoice({ onSuccess, onError });

    const dismissNameWidgetOnSend = () => {
        const history = queryClient.getQueryData<{ data: ChatMessage[] }>([
            "chat",
            "show",
            id,
        ]);
        if (history?.data) {
            skipPendingWidgets(id, history.data, "collect_name");
        }
    };

    const sendVoice = (blob: Blob) => {
        dismissNameWidgetOnSend();
        setIsVoiceBusy(true);
        voiceMutation.mutate({ session_id: id, file: blob });
    };

    const drainBlobQueue = () => {
        if (blobQueue.current.length === 0) return;
        const next = blobQueue.current.shift()!;
        removeFromQueueDisplay(next.id);
        sendVoice(next.blob);
    };

    useEffect(() => {
        if (!isBusy && blobQueue.current.length > 0) {
            drainBlobQueue();
        }
    }, [isBusy]);

    const handleStartRecording = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        try {
            const mediaStream = await startRecording();
            setStream(mediaStream);
            setIsRecording(true);
            if (pendingLockRef.current) {
                lockModeRef.current = true;
                pendingLockRef.current = false;
                setIsLocked(true);
            }
        } catch (error) {
            console.error("Error starting recording:", error);
            toast.error("Error starting recording");
        }
    };

    const finishRecording = async () => {
        try {
            const audioBlob = await stopRecording();
            setStream(null);

            if (!audioBlob || audioBlob.size < 10000) {
                setIsRecording(false);
                lockModeRef.current = false;
                pendingLockRef.current = false;
                setIsLocked(false);
                return;
            }

            if (isBusy) {
                const queueId = crypto.randomUUID();
                blobQueue.current.push({ id: queueId, blob: audioBlob });
                addToQueueDisplay({ id: queueId, label: "Voice message" });
            } else {
                sendVoice(audioBlob);
            }
        } catch (error) {
            console.error("Error stopping recording:", error);
            toast.error("Error stopping recording");
        } finally {
            setIsRecording(false);
            lockModeRef.current = false;
            pendingLockRef.current = false;
            setIsLocked(false);
        }
    };

    const handleEndRecording = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        await finishRecording();
    };

    const handleWhatsappPointerDown = async (e: React.PointerEvent) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

        if (isRecording && lockModeRef.current) {
            await finishRecording();
            return;
        }

        pressStartRef.current = Date.now();

        if (!isRecording) {
            await handleStartRecording(e);
        }
    };

    const handleWhatsappPointerUp = async (e: React.PointerEvent) => {
        e.preventDefault();
        const elapsed = Date.now() - pressStartRef.current;

        if (!isRecording) {
            if (elapsed < CLICK_THRESHOLD_MS) {
                pendingLockRef.current = true;
            }
            return;
        }

        if (lockModeRef.current) return;

        if (elapsed < CLICK_THRESHOLD_MS) {
            lockModeRef.current = true;
            setIsLocked(true);
            return;
        }

        await finishRecording();
    };

    const handleWhatsappPointerLeave = async () => {
        if (!isRecording || lockModeRef.current) return;
        await finishRecording();
    };

    useEffect(() => {
        if (methods.isSuccess && status === "completed") {
            const userMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: "user",
                content: recorderResponse?.user_text || "",
                timestamp: recorderResponse?.timestamp || "",
                audio_url: recorderResponse?.user_audio_url || "",
            };

            const assistantMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: recorderResponse?.ai_text || "",
                timestamp: recorderResponse?.timestamp || "",
                audio_url: recorderResponse?.audio_url || undefined,
                images: recorderResponse?.images,
                widget: recorderResponse?.widget,
            };

            queryClient.setQueryData(
                ["chat", "show", id],
                (old: { data: ChatMessage[] } | undefined) => {
                    if (!old) return old;
                    const restMessages = old.data.slice(1);
                    return {
                        ...old,
                        data: [assistantMsg, userMsg, ...restMessages],
                    };
                }
            );

            setIsVoiceBusy(false);

            if (blobQueue.current.length > 0) {
                drainBlobQueue();
            }
        }
    }, [status, methods.isSuccess]);

    const isWhatsapp = variant === "whatsapp";
    const isLockedRecording = isWhatsapp && isRecording && isLocked;

    return (
        <div className={`${className}`}>
            <button
                {...(isWhatsapp
                    ? {
                        onPointerDown: handleWhatsappPointerDown,
                        onPointerUp: handleWhatsappPointerUp,
                        onPointerLeave: handleWhatsappPointerLeave,
                    }
                    : {
                        onMouseDown: handleStartRecording,
                        onMouseUp: handleEndRecording,
                        onMouseLeave: handleEndRecording,
                        onTouchStart: handleStartRecording,
                        onTouchEnd: handleEndRecording,
                    })}
                type='button'
                className={
                    variant === "whatsapp"
                        ? `group hover:cursor-pointer flex items-center justify-center w-11 h-11 rounded-full shrink-0 transition-all relative ${isRecording ? "bg-primary-gold text-white scale-105 shadow-md" : "bg-dark-navy text-white hover:bg-primary-gold"}`
                        : `group hover:cursor-pointer rounded-xl p-3 text-dark-navy bg-cream-bg border border-primary-gold/20 relative transition-all ${isRecording && "scale-110 bg-primary-gold! text-white! rounded-full shadow-lg"} z-20`
                }
                title={isLockedRecording ? "Tap to send" : isRecording ? "Release to send" : "Tap to record · Hold to send"}
            >
                <FaMicrophoneAlt size={variant === "whatsapp" ? 18 : 20} />
                {
                    variant === "default" && !isRecording &&
                    <div className={`
                        transition-all duration-200 ease-in-out transform pointer-events-none opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100
                        absolute top-[50%] translate-y-[-50%] -translate-x-full -left-2 lg:translate-y-0
                        lg:left-[50%] lg:translate-x-[-50%] lg:-top-8 text-xs text-nowrap
                        text-white bg-dark-navy px-2 py-1 rounded-md
                    `}>
                        Hold To Record
                        <div className={`
                            transition-all duration-200 ease-in-out transform opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100
                            w-0 border-[6px] border-transparent
                            md:border-l-[6px] md:border-l-dark-navy md:border-t-transparent md:border-b-transparent
                            lg:border-t-[6px] lg:border-t-dark-navy lg:border-l-transparent lg:border-r-transparent
                            absolute md:-right-2.5 md:top-[50%]
                            md:translate-y-[-50%] lg:right-auto lg:top-auto lg:translate-y-0 lg:-bottom-2.5
                            lg:left-[50%] lg:translate-x-[-50%]`}
                        />
                    </div>
                }
            </button>
        </div>
    );
}
