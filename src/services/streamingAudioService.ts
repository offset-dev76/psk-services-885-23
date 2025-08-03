
import { GoogleGenAI, Type } from "@google/genai";
import type { TranscriptionResult } from '../types/voice-tokens';

const GEMINI_API_KEY = 'AIzaSyDC1k_PYaCIy987c-OSfFIu6D5WPFrPa9U';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      resolve(base64data.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
  });
};

const createSystemInstruction = (context: string = '') => `You are a voice assistant that transcribes English audio and identifies user commands. 

${context ? `CONVERSATION CONTEXT: ${context}` : ''}

TRANSCRIPTION RULES:
- Transcribe exactly what you hear in English
- If you hear non-English, translate it to English 
- Only transcribe clear, intelligible speech with actual words
- Do not transcribe background noise, music, unclear sounds, or ambient sounds
- Do not transcribe random phrases like "I feel cold", "I feel hot" unless they are clearly and explicitly spoken by a user
- If the audio is completely unclear, just noise, or contains no clear speech, respond with an empty transcription
- Ignore mouth sounds, breathing, or non-verbal audio

TASK IDENTIFICATION:
Look for these command types in the transcription:

1. OPEN_APP: Opening applications/websites
   - Keywords: "open", "launch", "start", "show me"
   - Examples: "open YouTube", "launch Netflix", "start Spotify"
   - JSON: {"type": "open_app", "payload": {"name": "YouTube"}}

2. TIMER: Setting timers or alarms
   - Keywords: "set timer", "timer for", "remind me", "alarm"
   - Examples: "set timer for 5 minutes", "timer for 30 seconds"
   - JSON: {"type": "timer", "payload": {"duration": "5 minutes"}}

3. ENVIRONMENT_CONTROL: Room/device control (ONLY for explicit commands)
   - Keywords: "turn on/off", "set temperature", "dim lights", "adjust"
   - Examples: "turn on the lights", "set temperature to 72"
   - JSON: {"type": "environment_control", "payload": {"device": "lights", "action": "turn on"}}

4. SERVICE_REQUEST: Information or service requests including food ordering and menu navigation
   - Keywords: "what's", "show me", "find", "search for", "I want", "I'd like", "order", "get me", "go to", "switch to", "show"
   - Menu requests: "show me the menu", "I'm hungry", "what food do you have"
   - Category navigation: "go to appetizers", "show me desserts", "switch to main courses", "beverages section"
   - Food ordering with quantities: "I want 2 pasta carbonara", "order 3 burgers", "get me the salmon"
   - Food ordering with cooking instructions: "I want pasta carbonara well done", "medium rare steak", "extra spicy", "no onions"
   - Multiple items: "I want pasta carbonara and tiramisu", "order 2 burgers and 3 fries", "get me salmon, pasta, and wine"
   - Cooking instructions for previous items: "make it spicy", "well done", "no cheese", "extra sauce" (when context shows previous order)
   - Examples: "what's the weather", "show me the menu", "I want pasta carbonara", "order 2 burgers and 3 fries", "go to desserts"
   - JSON for menu: {"type": "service_request", "payload": {"request": "view_menu"}}
   - JSON for category navigation: {"type": "service_request", "payload": {"request": "navigate_category", "category": "desserts"}}
   - JSON for single food order: {"type": "service_request", "payload": {"request": "food_order", "name": "pasta carbonara", "quantity": "2", "special_instructions": "well done"}}
   - JSON for multiple food orders: {"type": "service_request", "payload": {"request": "food_order", "items": [{"name": "pasta carbonara", "quantity": "1", "special_instructions": "spicy"}, {"name": "tiramisu", "quantity": "1"}]}}
   - JSON for cooking instructions to previous order: {"type": "service_request", "payload": {"request": "modify_order", "special_instructions": "make it spicy"}}

5. NONE: No clear command detected
   - For general conversation, unclear audio, non-commands, or ambient sounds
   - JSON: {"type": "none"}

IMPORTANT CONTEXT HANDLING:
- If context shows a previous food order and user gives cooking instructions without mentioning a specific dish, treat it as a modification to the most recent order
- Use context to understand references like "make it spicy" when a dish was previously mentioned
- For category navigation, recognize food category names and navigation requests

OUTPUT FORMAT (JSON only):
{
  "transcription": "exact words heard",
  "task": {
    "type": "service_request",
    "payload": {
      "request": "food_order",
      "name": "pasta carbonara",
      "quantity": "2",
      "special_instructions": "well done"
    }
  }
}

Be very strict: only identify clear, intentional commands. Casual conversation, ambient sounds, or unclear audio should be "none".

Your entire response must be ONLY the JSON object and nothing else.`;

export class StreamingAudioProcessor {
  private isProcessing = false;
  private processingQueue: Blob[] = [];
  private context = '';

  async processAudioChunk(audioBlob: Blob, onResult: (result: TranscriptionResult) => void): Promise<void> {
    if (this.isProcessing) {
      this.processingQueue.push(audioBlob);
      return;
    }

    this.isProcessing = true;
    
    try {
      const result = await this.transcribeAudioChunk(audioBlob);
      if (result.transcription.trim()) {
        this.context += ` ${result.transcription}`;
        onResult(result);
      }
    } catch (error) {
      console.error('Error processing audio chunk:', error);
    } finally {
      this.isProcessing = false;
      
      // Process next item in queue
      if (this.processingQueue.length > 0) {
        const nextBlob = this.processingQueue.shift()!;
        this.processAudioChunk(nextBlob, onResult);
      }
    }
  }

  private async transcribeAudioChunk(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      const base64Audio = await blobToBase64(audioBlob);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          parts: [{
            inlineData: {
              mimeType: "audio/webm",
              data: base64Audio,
            }
          }]
        }],
        config: {
          systemInstruction: createSystemInstruction(this.context),
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
                    description: "The category of the command (e.g., 'none', 'open_app', 'timer')."
                  },
                  payload: {
                    type: Type.OBJECT,
                    description: "An object containing command-specific details.",
                    properties: {
                      name: { type: Type.STRING, description: "Name of the app to open or food item to order." },
                      duration: { type: Type.STRING, description: "Duration for a timer." },
                      device: { type: Type.STRING, description: "Device for environment control." },
                      action: { type: Type.STRING, description: "Action for environment control." },
                      value: { type: Type.STRING, description: "Value for an action (e.g., scene name)." },
                      request: { type: Type.STRING, description: "The specific service request." },
                      search_query: { type: Type.STRING, description: "Search query for content within apps." },
                      query: { type: Type.STRING, description: "Alternative search query field." },
                      quantity: { type: Type.STRING, description: "Quantity of items to order (for food orders)." },
                      special_instructions: { type: Type.STRING, description: "Special cooking instructions for food items." },
                      category: { type: Type.STRING, description: "Food category for navigation (appetizers, main courses, desserts, beverages)." },
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
  }

  clearContext(): void {
    this.context = '';
  }
}
