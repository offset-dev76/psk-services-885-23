
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { StreamingAudioProcessor } from '@/services/streamingAudioService';
import type { TranscriptionResult } from '@/types/voice-tokens';

interface UseStreamingVoiceRecordingReturn {
  isRecording: boolean;
  startStreaming: () => Promise<void>;
  stopStreaming: () => void;
  audioLevel: number;
}

export const useStreamingVoiceRecording = (onTranscription: (result: TranscriptionResult) => void): UseStreamingVoiceRecordingReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const streamingProcessorRef = useRef<StreamingAudioProcessor>(new StreamingAudioProcessor());
  const chunksBufferRef = useRef<Blob[]>([]);
  const processingIntervalRef = useRef<NodeJS.Timeout>();

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;
    setAudioLevel(average / 255);

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [isRecording]);

  const processAudioBuffer = useCallback(() => {
    if (chunksBufferRef.current.length === 0) return;

    // Create blob from accumulated chunks
    const audioBlob = new Blob([...chunksBufferRef.current], { type: 'audio/webm;codecs=opus' });
    chunksBufferRef.current = []; // Clear buffer

    // Process the audio chunk
    streamingProcessorRef.current.processAudioChunk(audioBlob, onTranscription);
  }, [onTranscription]);

  const startStreaming = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });

      // Setup audio context for level monitoring
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Setup MediaRecorder for continuous recording
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      chunksBufferRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksBufferRef.current.push(event.data);
        }
      };

      // Start recording with time slices for streaming
      mediaRecorderRef.current.start(1000); // Capture 1-second chunks
      setIsRecording(true);
      updateAudioLevel();

      // Process audio chunks every 2 seconds
      processingIntervalRef.current = setInterval(processAudioBuffer, 2000);
      
      toast.info('Streaming voice commands... Speak naturally.');
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  }, [updateAudioLevel, processAudioBuffer]);

  const stopStreaming = useCallback(() => {
    if (!isRecording) return;

    // Stop media recorder
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    // Clear processing interval
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
    }

    // Process any remaining audio chunks
    if (chunksBufferRef.current.length > 0) {
      processAudioBuffer();
    }

    // Cleanup
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Stop all tracks
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    // Clear context for next session
    streamingProcessorRef.current.clearContext();
    
    setIsRecording(false);
    setAudioLevel(0);
    toast.info('Voice streaming stopped.');
  }, [isRecording, processAudioBuffer]);

  return {
    isRecording,
    startStreaming,
    stopStreaming,
    audioLevel
  };
};
