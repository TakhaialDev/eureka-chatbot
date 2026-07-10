import { useRef, useState } from "react";

export function useVoiceRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: "audio/webm",
    });

    chunksRef.current = [];
    recorder.ondataavailable = e => chunksRef.current.push(e.data);

    recorder.start();
    mediaRecorderRef.current = recorder;
    
    return streamRef.current; // Return the stream
  };

  const stopRecording = async (): Promise<Blob | null> => {
    return new Promise(resolve => {
      if (!mediaRecorderRef.current) return resolve(null);

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        resolve(blob);
      };

      mediaRecorderRef.current.stop();
    });
  };

  return { startRecording, stopRecording };
}