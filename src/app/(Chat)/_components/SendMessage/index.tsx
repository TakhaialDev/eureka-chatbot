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
import { ArrowUp } from 'lucide-react';
import { toast } from 'react-toastify';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

type ActiveMsg = { message: string; isQueued: boolean };
type QueueDisplayItem = { id: string; label: string };

export default function SendMessageComponent({ session_id, setMessageRes, messageRes, pendingPrompt, onPromptConsumed }: {
  session_id: string;
  setMessageRes: React.Dispatch<React.SetStateAction<"Speaking" | "Typing" | null>>;
  messageRes: "Speaking" | "Typing" | null;
  pendingPrompt?: string | null;
  onPromptConsumed?: () => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const queryClient = useQueryClient();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const [activeMsg, setActiveMsg] = useState<ActiveMsg | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isVoiceBusy, setIsVoiceBusy] = useState(false);
  const sendQueue = useRef<{ id: string; message: string }[]>([]);
  const [queueDisplay, setQueueDisplay] = useState<QueueDisplayItem[]>([]);

  const isBusy = Boolean(activeMsg) || Boolean(taskId) || isVoiceBusy;

  const isProcessing = isBusy || queueDisplay.length > 0;
  useEffect(() => {
    if (isProcessing) {
      setMessageRes(prev => prev === null ? "Typing" : prev);
    } else {
      setMessageRes(prev => prev === "Typing" ? null : prev);
    }
  }, [isProcessing]);

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

  useEffect(() => {
    if (pendingPrompt) {
      setValue("message", pendingPrompt);
      setTimeout(() => {
        handleSubmit(onSubmit)();
        onPromptConsumed?.();
      }, 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt]);

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
      setActiveMsg(null);
      toast.error(e?.response?.data?.detail || "error occurred");
      drainQueue();
    },
  });

  const dismissNameWidgetOnSend = () => {
    const history = queryClient.getQueryData<{ data: ChatMessage[] }>([
      "chat", "show", session_id,
    ]);
    if (history?.data) {
      skipPendingWidgets(session_id, history.data, "collect_name");
    }
  };

  const onSubmit: SubmitHandler<SendMessageProps> = (data) => {
    if (!turnstileToken) {
      toast.error("Security check not ready. Please wait a moment and try again.");
      return;
    }
    dismissNameWidgetOnSend();
    const payload = { ...data, turnstile_token: turnstileToken };
    turnstileRef.current?.reset();
    setTurnstileToken(null);
    if (isBusy) {
      const id = crypto.randomUUID();
      sendQueue.current.push({ id, message: data.message });
      setQueueDisplay(q => [...q, { id, label: data.message }]);
      setValue("message", "");
    } else {
      setActiveMsg({ message: data.message, isQueued: false });
      sendMessage.mutate(payload);
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

    if (sendQueue.current.length > 0) drainQueue();
  }, [status, methods.isSuccess]);

  useEffect(() => {
    if (!isBusy && sendQueue.current.length > 0) drainQueue();
  }, [isBusy]);

  const addToQueueDisplay = (item: QueueDisplayItem) =>
    setQueueDisplay(q => [...q, item]);
  const removeFromQueueDisplay = (id: string) =>
    setQueueDisplay(q => q.filter(item => item.id !== id));

  return (
    <AnimatePresence>
      <div className="flex flex-col gap-2">
        {/* Queue display */}
        <AnimatePresence>
          {queueDisplay.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="flex justify-end"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary text-muted-foreground text-sm max-w-[70%] border border-border/40">
                <span className="truncate">{item.label}</span>
                <span className="shrink-0 text-xs text-primary/70 font-medium whitespace-nowrap">In queue</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Input container */}
        <div className="relative rounded-2xl border border-border/60 bg-card/80 shadow-xl backdrop-blur-md focus-within:border-primary/50 focus-within:shadow-green-500/10 focus-within:shadow-2xl transition-all">
          {/* Typing/Speaking indicator */}
          {messageRes && (
            <motion.div
              className="absolute -top-9 left-0 z-10"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-3 py-1 bg-card border border-border/50 text-muted-foreground rounded-lg flex w-fit text-xs font-medium shadow-sm backdrop-blur-sm">
                {messageRes === "Typing" ? "Typing" : "Speaking"}
                <AnimatedDots />
              </div>
            </motion.div>
          )}

          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
            options={{ appearance: "interaction-only" }}
          />
          <form
            className="flex items-end gap-2 px-3 py-2 min-h-[52px]"
            onSubmit={handleSubmit(onSubmit)}
          >
            {/* Lead capture button */}
            <div className="flex items-center shrink-0 self-center mb-0.5">
              <LeadFloatingButton sessionId={session_id} inline />
            </div>

            {/* Text input or waveform */}
            <div className="flex-1 min-w-0 flex items-center py-1">
              {isRecording ? (
                <RecordingWaveform isRecording={isRecording} stream={stream} />
              ) : (
                <textarea
                  id="message"
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
                  className="w-full max-h-28 resize-none border-0 focus-visible:outline-none bg-transparent text-foreground placeholder:text-muted-foreground leading-relaxed py-1 text-sm"
                  placeholder="Message your Eureka Assistant..."
                />
              )}
            </div>

            {/* Send or Record button */}
            {message?.trim() && !isRecording ? (
              <button
                type="submit"
                disabled={isBusy}
                className="flex items-center justify-center shrink-0 w-9 h-9 rounded-xl eureka-gradient text-white shadow-md shadow-green-500/25 hover:shadow-green-500/40 transition-shadow disabled:opacity-40 disabled:cursor-not-allowed self-end mb-0.5"
                aria-label="Send message"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            ) : (
              <div className="self-end mb-0.5">
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
              </div>
            )}
          </form>
        </div>
      </div>
    </AnimatePresence>
  );
}
