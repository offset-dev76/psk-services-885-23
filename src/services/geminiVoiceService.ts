import { GoogleGenAI, Type } from "@google/genai";
import type { TranscriptionResult, VoiceToken } from '../types/voice-tokens';

// Using the provided API key (note: in production, this should be in Supabase secrets)
const GEMINI_API_KEY = 'AIzaSyBOss0EVWeo49x_RKGOcgHGRILnhtZqR4o';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      // remove the data url prefix
      resolve(base64data.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
  });
};

const createSystemInstruction = (context: string = '') => `You are a voice assistant for a smart TV interface that transcribes English audio and identifies user commands. 

${context ? `CONVERSATION CONTEXT: ${context}` : ''}

TRANSCRIPTION RULES:
- Transcribe exactly what you hear in English
- If you hear non-English, translate it to English 
- Only transcribe clear, intelligible speech with actual words
- Do not transcribe background noise, music, unclear sounds, or ambient sounds
- If the audio is unclear, just noise, or contains no clear speech, respond with an empty transcription

COMMAND IDENTIFICATION:
Look for these command types in the transcription:

1. OPENPAGE: Navigation to different UI pages
   - Keywords: "go to", "open", "show", "navigate to", "switch to"
   - Pages: "home", "restaurant", "apps", "menu"
   - Examples: "go to restaurant", "open the menu", "show me apps", "I'm hungry" (implies restaurant)
   - JSON: {"type": "openpage", "payload": {"page": "restaurant", "message": "Opening restaurant menu"}}

2. OPENAPP: Opening applications/websites in new tab
   - Keywords: "open", "launch", "start", "show me"
   - Apps: "Netflix", "YouTube", "Pluto TV", "YouTube Music", "Plex", "Disney+", "Hulu", "Prime Video", "HBO Max"
   - Examples: "open YouTube", "launch Netflix", "start Spotify"
   - JSON: {"type": "openapp", "payload": {"app": "YouTube", "url": "https://www.youtube.com", "message": "Opening YouTube"}}

3. SERVICE_REQUEST: Food ordering and menu navigation
   - Keywords: "order", "I want", "get me", "show menu", "what food", "I'm hungry"
   - Examples: "show me the menu", "I want pasta", "order pizza", "I'm feeling hungry"
   - JSON for menu: {"type": "service_request", "payload": {"request": "view_menu", "message": "Opening restaurant menu"}}
   - JSON for food order: {"type": "service_request", "payload": {"request": "food_order", "name": "pasta", "quantity": "1"}}

4. TIMER: Setting timers
   - Keywords: "set timer", "timer for", "remind me"
   - Examples: "set timer for 5 minutes", "timer for 30 seconds"
   - JSON: {"type": "timer", "payload": {"duration": "5 minutes", "message": "Timer set for 5 minutes"}}

5. ENVIRONMENT_CONTROL: Device control commands
   - Keywords: "turn on/off", "set temperature", "dim lights"
   - Examples: "turn on the lights", "set temperature to 72"
   - JSON: {"type": "environment_control", "payload": {"device": "lights", "action": "turn on", "message": "Turning on lights"}}

6. NONE: No clear command detected
   - For general conversation, unclear audio, or non-commands
   - JSON: {"type": "none"}

OUTPUT FORMAT (JSON only):
{
  "transcription": "exact words heard",
  "task": {
    "type": "openpage",
    "payload": {
      "page": "restaurant",
      "message": "Opening restaurant menu"
    }
  }
}

Your entire response must be ONLY the JSON object and nothing else.`;

export const transcribeAndIdentifyTask = async (audioBlob: Blob, context: string = ''): Promise<TranscriptionResult> => {
  try {
    const base64Audio = await blobToBase64(audioBlob);

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [{
            parts: [{
                inlineData: {
                    mimeType: "audio/webm",
                    data: base64Audio,
                }
            }]
        }],
        config: {
            systemInstruction: createSystemInstruction(context),
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    transcription: {
                        type: Type.STRING,
                        description: "The English transcription of the audio."
                    },
                    task: {
                        type: Type.OBJECT,
                        description: "The identified command object.",
                        properties: {
                            type: {
                                type: Type.STRING,
                                description: "The category of the command (e.g., 'none', 'openapp', 'timer')."
                            },
                            payload: {
                                type: Type.OBJECT,
                                description: "An object containing command-specific details.",
                                properties: {
                                    name: { type: Type.STRING, description: "Name of the app to open or food item to order." },
                                    app: { type: Type.STRING, description: "Name of the app to open." },
                                    url: { type: Type.STRING, description: "URL for the app to open." },
                                    page: { type: Type.STRING, description: "Page to navigate to." },
                                    duration: { type: Type.STRING, description: "Duration for a timer." },
                                    device: { type: Type.STRING, description: "Device for environment control." },
                                    action: { type: Type.STRING, description: "Action for environment control." },
                                    request: { type: Type.STRING, description: "The specific service request." },
                                    quantity: { type: Type.STRING, description: "Quantity of items to order (for food orders)." },
                                    special_instructions: { type: Type.STRING, description: "Special cooking instructions for food items." },
                                    category: { type: Type.STRING, description: "Food category for navigation." },
                                    message: { type: Type.STRING, description: "User-friendly message to display." },
                                    items: { 
                                      type: Type.ARRAY,
                                      description: "Array of multiple food items to order.",
                                      items: {
                                        type: Type.OBJECT,
                                        properties: {
                                          name: { type: Type.STRING, description: "Name of the food item." },
                                          quantity: { type: Type.STRING, description: "Quantity of this item." },
                                          special_instructions: { type: Type.STRING, description: "Special instructions for this item." }
                                        }
                                      }
                                    }
                                }
                            }
                        },
                        required: ["type"]
                    }
                },
                required: ["transcription", "task"]
            },
        },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText) as TranscriptionResult;
    
    if (!result || typeof result.transcription !== 'string' || typeof result.task?.type !== 'string') {
      throw new Error('Invalid JSON response format from API.');
    }
    
    return result;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
      throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unexpected error occurred while communicating with the Gemini API.");
  }
};

export const processVoiceToken = (transcriptionResult: TranscriptionResult): VoiceToken => {
  const { task } = transcriptionResult;
  
  switch (task.type) {
    case 'openpage':
    case 'openapp':
    case 'open_app':
      return {
        type: 'open_app',
        payload: {
          page: task.payload?.page || 'home',
          app: task.payload?.app || task.payload?.name,
          url: getAppUrl(task.payload?.app || task.payload?.name)
        },
        message: task.payload?.message || `Opening ${task.payload?.app || task.payload?.name || task.payload?.page}`
      };
    
    case 'service_request':
      return {
        type: 'service_request',
        payload: task.payload,
        message: task.payload?.message || 'Processing your request'
      };
    
    case 'timer':
      return {
        type: 'timer',
        payload: task.payload,
        message: task.payload?.message || `Setting timer for ${task.payload?.duration}`
      };
    
    case 'environment_control':
      return {
        type: 'environment_control',
        payload: task.payload,
        message: task.payload?.message || 'Controlling environment'
      };
    
    default:
      return {
        type: 'none',
        payload: {},
        message: 'No command recognized'
      };
  }
};

const getAppUrl = (appName: string): string => {
  const appUrls: Record<string, string> = {
    'Netflix': 'https://www.netflix.com',
    'YouTube': 'https://www.youtube.com',
    'Pluto TV': 'https://pluto.tv',
    'YouTube Music': 'https://music.youtube.com',
    'Plex TV': 'https://www.plex.tv',
    'Disney+': 'https://www.disneyplus.com',
    'Hulu': 'https://www.hulu.com',
    'Prime Video': 'https://www.primevideo.com',
    'HBO Max': 'https://www.hbomax.com'
  };
  
  return appUrls[appName] || `https://www.google.com/search?q=${encodeURIComponent(appName)}`;
};
