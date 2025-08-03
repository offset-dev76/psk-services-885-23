
export interface VoiceToken {
  type: 'open_app' | 'timer' | 'environment_control' | 'service_request' | 'none';
  payload: {
    page?: string;
    app?: string;
    name?: string;
    url?: string;
    duration?: string;
    device?: string;
    action?: string;
    request?: string;
    quantity?: string;
    special_instructions?: string;
    category?: string;
    items?: Array<{
      name: string;
      quantity: string;
      special_instructions?: string;
    }>;
  };
  message?: string;
}

export interface TranscriptionResult {
  transcription: string;
  task: {
    type: string;
    payload?: any;
  };
}
