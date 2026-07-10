import AnimatedDots from '@/components/ui/AnimatedDots';
import { LeadFloatingButton } from '@/components/ui/LeadCaptureWidget';
import RecorderButton from '@/components/ui/Recorder';
import RecordingWaveform from '@/components/ui/Waveform';
import { skipPendingWidgets } from '@/utils/types&schemas/leadStorage';
import useChatMessage from '@/lib/tanstack/Chat/useMessage';
import useStatusTask from '@/lib/tanstack/Chat/useTaskStatus';
import { ChatMessage, SendMessageProps, SendMessageSchema } from '@/utils/types&schemas/Generic/Chat';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form';
import { FaPaperPlane } from 'react-icons/fa';
import { toast } from 'react-toastify';

type ActiveMsg = { message: string; isQueued: boolean };
type QueueDisplayItem = { id: string; label: string };

const actionBtnCls =
    "flex items-center justify-center shrink-0 w-11 h-11 rounded-full transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed";
const sendBtnCls = `${actionBtnCls} bg-dark-navy text-white hover:bg-primary-gold`;

export default function SendMessageComponent({ session_id, setMessageRes, messageRes }: {
    session_id: string;
    setMessageRes: React.Dispatch<React.SetStateAction<"Speaking" | "Typing" | null>>;
    messageRes: "Speaking" | "Typing" | null;
}) {
    const [isRecording, setIsRecording] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const queryClient = useQueryClient();

    const [activeMsg, setActiveMsg] = useState<ActiveMsg | null>(null);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [isVoiceBusy, setIsVoiceBusy] = useState(false);
    const sendQueue = useRef<{ id: string; message: string }[]>([]);
    const [queueDisplay, setQueueDisplay] = useState<QueueDisplayItem[]>([]);

    const isBusy = Boolean(activeMsg) || Boolean(taskId) || isVoiceBusy;

    // Derive Typing from state — clears automatically when nothing is in progress
    const isProcessing = isBusy || queueDisplay.length > 0;
    useEffect(() => {
        if (isProcessing) {
            setMessageRes(prev => prev === null ? "Typing" : prev);
        } else {
            setMessageRes(prev => prev === "Typing" ? null : prev);
        }
    }, [isProcessing]);

    // Clear all queue state when switching sessions
    useEffect(() => {
        sendQueue.current = [];
        setTaskId(null);
        setActiveMsg(null);
        setQueueDisplay([]);
        setMessageRes(null);
    }, [session_id]);

    const { register, handleSubmit, setValue, watch } = useForm<SendMessageProps>({
        resolver: zodResolver(SendMessageSchema),
        defaultValues: { session_id, message: "" }
    });
    const message = watch("message");

    const { data: taskStatusData, ...methods } = useStatusTask(taskId);
    const status = taskStatusData?.data?.status;
    const messageResValue = taskStatusData?.data?.result;

    const drainQueue = () => {
        if (sendQueue.current.length === 0) return;
        const next = sendQueue.current.shift()!;
        setQueueDisplay(q => q.filter(item => item.id !== next.id));
        setActiveMsg({ message: next.message, isQueued: true });
        sendMessage.mutate({ session_id, message: next.message });
    };

    const sendMessage = useChatMessage({
        onSuccess: (data: any) => {
            setValue("message", "");
            setTaskId(data?.task_id ?? null);
        },
        onError: (e: any) => {
            console.log(e);
            setActiveMsg(null);
            toast.error(e?.response?.data?.detail || "error occurred");
            drainQueue();
        },
    });

    const dismissNameWidgetOnSend = () => {
        const history = queryClient.getQueryData<{ data: ChatMessage[] }>([
            "chat",
            "show",
            session_id,
        ]);
        if (history?.data) {
            skipPendingWidgets(session_id, history.data, "collect_name");
        }
    };

    const onSubmit: SubmitHandler<SendMessageProps> = (data) => {
        dismissNameWidgetOnSend();
        if (isBusy) {
            const id = crypto.randomUUID();
            sendQueue.current.push({ id, message: data.message });
            setQueueDisplay(q => [...q, { id, label: data.message }]);
            setValue("message", "");
        } else {
            setActiveMsg({ message: data.message, isQueued: false });
            sendMessage.mutate(data);
        }
    };

    useEffect(() => {
        if (!methods.isSuccess || status !== "completed") return;

        const isQueued = activeMsg?.isQueued ?? false;
        const replyTo = activeMsg?.message ?? "";

        queryClient.setQueryData(
            ["chat", "show", session_id],
            (old: { data: ChatMessage[] } | undefined) => {
                if (!old) return old;
                return {
                    ...old,
                    data: [
                        {
                            id: crypto.randomUUID(),
                            role: "assistant" as const,
                            content: messageResValue?.answer,
                            timestamp: messageResValue?.timestamp,
                            audio_url: messageResValue?.audio_url,
                            images: messageResValue?.images,
                            widget: messageResValue?.widget,
                            reply_to: isQueued && replyTo ? { content: replyTo } : undefined,
                        },
                        ...old.data,
                    ],
                };
            }
        );

        queryClient.removeQueries({ queryKey: ["chat", "status", taskId] });
        setTaskId(null);
        setActiveMsg(null);

        if (sendQueue.current.length > 0) {
            drainQueue();
        }
    }, [status, methods.isSuccess]);

    // Drain text queue when voice recording finishes (isBusy cleared by setIsVoiceBusy)
    useEffect(() => {
        if (!isBusy && sendQueue.current.length > 0) {
            drainQueue();
        }
    }, [isBusy]);

    const addToQueueDisplay = (item: QueueDisplayItem) =>
        setQueueDisplay(q => [...q, item]);
    const removeFromQueueDisplay = (id: string) =>
        setQueueDisplay(q => q.filter(item => item.id !== id));

    return (
        <AnimatePresence>
            <>
                <div className='flex flex-col gap-2'>
                    {/* Queue display */}
                    <AnimatePresence>
                        {queueDisplay.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                transition={{ duration: 0.25 }}
                                className='flex justify-end'
                            >
                                <div className='flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-navy/30 text-dark-navy/60 text-sm max-w-[70%] border border-dark-navy/20'>
                                    <span className='truncate'>{item.label}</span>
                                    <span className='shrink-0 text-xs text-primary-gold/70 font-medium whitespace-nowrap'>In queue</span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <div className='bg-white/90 border border-primary-gold/15 rounded-3xl shadow-sm relative'>
                        {
                            messageRes &&
                            <motion.div
                                className='font-semibold absolute -top-10 left-0 opacity-80 z-10'
                                initial={{ opacity: 0, y: 10, x: -20 }}
                                animate={{ opacity: 1, y: 0, x: 0 }}
                                exit={{ opacity: 0, y: 10, x: -20 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className='px-2 py-1 bg-gray-400 text-white rounded-lg flex w-fit'>
                                    {messageRes === "Typing" ? "Typing" : "Speaking"}
                                    <AnimatedDots />
                                </div>
                            </motion.div>
                        }
                        <form
                            className='flex items-center gap-2 px-2 py-2 min-h-[52px]'
                            onSubmit={handleSubmit(onSubmit)}
                        >
                            <div className='flex items-center shrink-0 self-center'>
                                <LeadFloatingButton sessionId={session_id} inline />
                            </div>

                            <div className='flex-1 min-w-0 flex items-center py-1.5'>
                                {
                                    isRecording ?
                                        <RecordingWaveform isRecording={isRecording} stream={stream} />
                                        :
                                        <textarea
                                            id='message'
                                            rows={1}
                                            {...register("message")}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    if (message?.trim() && !isRecording) {
                                                        handleSubmit(onSubmit)();
                                                    }
                                                }
                                            }}
                                            className='w-full max-h-28 resize-none border-0 focus-visible:outline-0! bg-transparent text-dark-navy placeholder:text-dark-navy/40 leading-relaxed py-1'
                                            placeholder='Message your Eureka Assistant...'
                                        />
                                }
                            </div>

                            {message?.trim() && !isRecording ? (
                                <button
                                    type='submit'
                                    disabled={isBusy}
                                    className={sendBtnCls}
                                    aria-label="Send message"
                                >
                                    <FaPaperPlane size={18} className='rtl:rotate-180' />
                                </button>
                            ) : (
                                <RecorderButton
                                    setIsRecording={setIsRecording}
                                    isRecording={isRecording}
                                    setStream={setStream}
                                    isBusy={isBusy}
                                    setIsVoiceBusy={setIsVoiceBusy}
                                    addToQueueDisplay={addToQueueDisplay}
                                    removeFromQueueDisplay={removeFromQueueDisplay}
                                    variant="whatsapp"
                                />
                            )}
                        </form>
                    </div>
                </div>
            </>
        </AnimatePresence>
    );
}
