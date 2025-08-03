import { GoogleGenAI, LiveServerMessage, Modality, Session, Type } from '@google/genai';
import { createBlob, decode, decodeAudioData } from '../utils/geminiUtils';

const GEMINI_API_KEY = 'AIzaSyDC1k_PYaCIy987c-OSfFIu6D5WPFrPa9U';

// Function declarations for Gemini Live
const functionDeclarations = [
  {
    name: "open_youtube",
    description: "Opens YouTube in a new browser tab",
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: []
    }
  },
  {
    name: "open_netflix",
    description: "Opens Netflix in a new browser tab", 
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: []
    }
  },
  {
    name: "open_plex",
    description: "Opens Plex TV in a new browser tab",
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: []
    }
  },
  {
    name: "open_youtube_music",
    description: "Opens YouTube Music in a new browser tab",
    parameters: {
      type: Type.OBJECT,
      properties: {},
      required: []
    }
  },
  {
    name: "search_youtube",
    description: "Search for videos on YouTube and open the results",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "The search query for YouTube"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "play_youtube_video",
    description: "Search and play a specific video on YouTube",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "The search query to find and play the video"
        }
      },
      required: ["query"]
    }
  }
];

export class GeminiLiveAudioService {
  private client: GoogleGenAI;
  private session: Session | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputNode: GainNode | null = null;
  private outputNode: GainNode | null = null;
  private nextStartTime = 0;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private sources = new Set<AudioBufferSourceNode>();
  private isConnected = false;
  private isMuted = false;
  private onResponseCallback?: (text: string) => void;

  constructor() {
    this.client = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    });
  }

  async connect(onResponse?: (text: string) => void): Promise<void> {
    if (this.isConnected) {
      console.log('Already connected to Gemini Live');
      return;
    }

    this.onResponseCallback = onResponse;

    try {
      // Initialize audio contexts
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      this.inputNode = this.inputAudioContext.createGain();
      this.outputNode = this.outputAudioContext.createGain();
      this.outputNode.connect(this.outputAudioContext.destination);

      await this.inputAudioContext.resume();
      await this.outputAudioContext.resume();

      const model = 'gemini-2.0-flash-exp';

      this.session = await this.client.live.connect({
        model: model,
        callbacks: {
          onopen: () => {
            console.log('Connected to Gemini Live');
            this.isConnected = true;
            this.setupAudioInput();
          },
          onmessage: async (message: LiveServerMessage) => {
            console.log('Received message from Gemini:', message);
            
            // Handle function calls
            if (message.toolCall) {
              console.log('Function call received:', message.toolCall);
              await this.handleFunctionCall(message.toolCall);
              return;
            }

            // Handle audio response
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData;
            if (audio && this.outputAudioContext) {
              this.nextStartTime = Math.max(
                this.nextStartTime,
                this.outputAudioContext.currentTime,
              );

              const audioBuffer = await decodeAudioData(
                decode(audio.data),
                this.outputAudioContext,
                24000,
                1,
              );
              const source = this.outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(this.outputNode!);
              source.addEventListener('ended', () => {
                this.sources.delete(source);
              });

              source.start(this.nextStartTime);
              this.nextStartTime = this.nextStartTime + audioBuffer.duration;
              this.sources.add(source);
            }

            // Handle text response
            const textPart = message.serverContent?.modelTurn?.parts?.find((part: any) => part.text);
            if (textPart && this.onResponseCallback) {
              this.onResponseCallback(textPart.text);
            }

            // Handle interruption
            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of this.sources.values()) {
                source.stop();
                this.sources.delete(source);
              }
              this.nextStartTime = 0;
            }
          },
          onerror: (error: ErrorEvent) => {
            console.error('Gemini Live error:', error);
          },
          onclose: (event: CloseEvent) => {
            console.log('Gemini Live connection closed:', event.reason);
            this.isConnected = false;
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Orus' } },
          },
          tools: [{ functionDeclarations }],
        },
      });

    } catch (error) {
      console.error('Failed to connect to Gemini Live:', error);
      throw new Error('Could not establish connection to Gemini Live');
    }
  }

  private async handleFunctionCall(toolCall: any): Promise<void> {
    console.log('Processing function call:', toolCall);
    
    const functionCall = toolCall.functionCalls?.[0];
    if (!functionCall) {
      console.error('No function call found in toolCall');
      return;
    }

    const functionName = functionCall.name;
    const functionId = functionCall.id;
    const args = functionCall.args || {};
    
    let result = { success: true, message: '' };

    switch (functionName) {
      case 'open_youtube':
        result = this.openYouTube();
        break;
      case 'open_netflix':
        result = this.openNetflix();
        break;
      case 'open_plex':
        result = this.openPlex();
        break;
      case 'open_youtube_music':
        result = this.openYouTubeMusic();
        break;
      case 'search_youtube':
        result = this.searchYouTube(args.query);
        break;
      case 'play_youtube_video':
        result = this.playYouTubeVideo(args.query);
        break;
      default:
        console.log('Unknown function call:', functionName);
        result = { success: false, message: 'Unknown function' };
    }

    // Send function response back to Gemini with the correct ID
    if (this.session && functionId) {
      try {
        this.session.sendToolResponse({
          functionResponses: [{
            id: functionId,
            name: functionName,
            response: result
          }]
        });
      } catch (error) {
        console.error('Error sending tool response:', error);
      }
    }
  }

  private openYouTube(): { success: boolean; message: string } {
    console.log('Opening YouTube in new tab');
    window.open('https://www.youtube.com', '_blank');
    
    if (this.onResponseCallback) {
      this.onResponseCallback('Opening YouTube for you!');
    }
    
    return { success: true, message: 'YouTube opened successfully' };
  }

  private openNetflix(): { success: boolean; message: string } {
    console.log('Opening Netflix in new tab');
    window.open('https://www.netflix.com', '_blank');
    
    if (this.onResponseCallback) {
      this.onResponseCallback('Opening Netflix for you!');
    }
    
    return { success: true, message: 'Netflix opened successfully' };
  }

  private openPlex(): { success: boolean; message: string } {
    console.log('Opening Plex TV in new tab');
    window.open('https://app.plex.tv', '_blank');
    
    if (this.onResponseCallback) {
      this.onResponseCallback('Opening Plex TV for you!');
    }
    
    return { success: true, message: 'Plex TV opened successfully' };
  }

  private openYouTubeMusic(): { success: boolean; message: string } {
    console.log('Opening YouTube Music in new tab');
    window.open('https://music.youtube.com', '_blank');
    
    if (this.onResponseCallback) {
      this.onResponseCallback('Opening YouTube Music for you!');
    }
    
    return { success: true, message: 'YouTube Music opened successfully' };
  }

  private searchYouTube(query: string): { success: boolean; message: string } {
    console.log('Searching YouTube for:', query);
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank');
    
    if (this.onResponseCallback) {
      this.onResponseCallback(`Searching YouTube for "${query}"!`);
    }
    
    return { success: true, message: `YouTube search for "${query}" opened successfully` };
  }

  private playYouTubeVideo(query: string): { success: boolean; message: string } {
    console.log('Playing YouTube video for:', query);
    // For playing a video, we'll search and let the user click the first result
    // In a real implementation, you might use YouTube API to get the first video ID
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank');
    
    if (this.onResponseCallback) {
      this.onResponseCallback(`Finding and playing "${query}" on YouTube!`);
    }
    
    return { success: true, message: `YouTube video search for "${query}" opened successfully` };
  }

  private async setupAudioInput(): Promise<void> {
    if (!this.inputAudioContext) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });

      this.sourceNode = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.inputNode!);

      // Load AudioWorklet processor or use fallback
      try {
        await this.inputAudioContext.audioWorklet.addModule('/audio-processor.js');
        this.audioWorkletNode = new AudioWorkletNode(this.inputAudioContext, 'audio-processor');
        
        this.audioWorkletNode.port.onmessage = (event) => {
          if (this.isMuted || !this.session) return;
          
          const pcmData = event.data;
          this.session.sendRealtimeInput({ media: createBlob(pcmData) });
        };

        this.sourceNode.connect(this.audioWorkletNode);
        this.audioWorkletNode.connect(this.inputAudioContext.destination);
      } catch (error) {
        console.warn('AudioWorklet not supported, using fallback');
        // Fallback for older browsers
        const bufferSize = 256;
        const scriptProcessor = this.inputAudioContext.createScriptProcessor(bufferSize, 1, 1);
        
        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
          if (this.isMuted || !this.session) return;
          const inputBuffer = audioProcessingEvent.inputBuffer;
          const pcmData = inputBuffer.getChannelData(0);
          this.session.sendRealtimeInput({ media: createBlob(pcmData) });
        };

        this.sourceNode.connect(scriptProcessor);
        scriptProcessor.connect(this.inputAudioContext.destination);
      }

      console.log('Audio input setup complete');
    } catch (error) {
      console.error('Error setting up audio input:', error);
      throw error;
    }
  }

  async mute(): Promise<void> {
    this.isMuted = true;
    console.log('Gemini Live audio muted');
  }

  async unmute(): Promise<void> {
    this.isMuted = false;
    console.log('Gemini Live audio unmuted');
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      // Stop audio stream
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

      // Disconnect audio nodes
      if (this.audioWorkletNode && this.sourceNode) {
        this.audioWorkletNode.disconnect();
        this.sourceNode.disconnect();
      }

      // Stop all audio sources
      for (const source of this.sources.values()) {
        source.stop();
        this.sources.delete(source);
      }

      // Close session
      if (this.session) {
        this.session.close();
        this.session = null;
      }

      // Close audio contexts
      if (this.inputAudioContext) {
        await this.inputAudioContext.close();
        this.inputAudioContext = null;
      }
      if (this.outputAudioContext) {
        await this.outputAudioContext.close();
        this.outputAudioContext = null;
      }

      this.isConnected = false;
      this.isMuted = false;
      this.audioWorkletNode = null;
      this.sourceNode = null;
      this.inputNode = null;
      this.outputNode = null;
      this.onResponseCallback = undefined;

      console.log('Disconnected from Gemini Live');
    } catch (error) {
      console.error('Error disconnecting from Gemini Live:', error);
    }
  }

  getConnectionState(): { isConnected: boolean; isMuted: boolean } {
    return {
      isConnected: this.isConnected,
      isMuted: this.isMuted
    };
  }
}

export const geminiLiveService = new GeminiLiveAudioService();
