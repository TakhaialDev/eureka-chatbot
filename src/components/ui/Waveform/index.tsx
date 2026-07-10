import { useWavesurfer } from "@wavesurfer/react";
import { useEffect, useRef, useState } from "react";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.esm.js";
import {motion} from "framer-motion";
import { FaMicrophoneAlt } from "react-icons/fa";

const VisualizeRecording = ({ stream , isRecording }:{
  stream: MediaStream | null;
  isRecording: boolean;
}) => {
    const wavesurferContainer = useRef<HTMLDivElement | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    
    // Add timer
    useEffect(() => {
        if (!stream || !isRecording) return;
        
        const interval = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [stream,isRecording]);

    // Reset timer when stream changes
    useEffect(() => {
        setRecordingTime(0);
    }, [stream]);


    const { wavesurfer } = useWavesurfer({
        container: wavesurferContainer,
        waveColor: "#c5a059",
        interact: false,
        cursorWidth: 0,
        barWidth: 2.5,
        barGap: 1,
        barRadius: 20,
        height: 40
    });

    const [record, setRecord] = useState<any>(null);

    useEffect(() => {
        if (wavesurfer) {
            const record = wavesurfer.registerPlugin(
                RecordPlugin.create({
                scrollingWaveform: true,
                renderRecordedAudio: false,
                scrollingWaveformWindow: 3,
                })
            );
            setRecord(record);
        }
    }, [wavesurfer]);

    useEffect(() => {
        if (stream && record) {
            record.renderMicStream(stream);
        }
    }, [stream, record]);

    const formatTime = (seconds: number) => `${seconds}s`;

    return (
        <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3 w-full">
        <div className="text-primary-gold font-semibold flex items-center gap-1">
                <FaMicrophoneAlt size={20} className="animate-pulse"/>
                {formatTime(recordingTime)}
            </div>
            <div ref={wavesurferContainer} className="grow"></div>
        </motion.div>
    );
};

export default VisualizeRecording;