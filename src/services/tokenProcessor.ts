
import { toast } from 'sonner';

export interface VoiceToken {
  type: 'open_app' | 'timer' | 'environment_control' | 'service_request' | 'none';
  payload: any;
  message?: string;
}

export class TokenProcessor {
  async processToken(token: VoiceToken): Promise<void> {
    console.log('Processing token:', token);
    
    switch (token.type) {
      case 'open_app':
        await this.handleOpenApp(token.payload);
        break;
      case 'timer':
        await this.handleTimer(token.payload);
        break;
      case 'environment_control':
        await this.handleEnvironmentControl(token.payload);
        break;
      case 'service_request':
        await this.handleServiceRequest(token.payload);
        break;
      case 'none':
        // Do nothing for 'none' type
        break;
      default:
        console.log('Unknown token type:', token.type);
    }
  }

  private async handleOpenApp(payload: any): Promise<void> {
    const appName = payload.name;
    if (appName) {
      const url = this.getAppUrl(appName);
      window.open(url, '_blank');
      toast.success(`Opening ${appName}`);
    }
  }

  private async handleTimer(payload: any): Promise<void> {
    const duration = payload.duration;
    if (duration) {
      toast.success(`Timer set for ${duration}`);
      console.log(`Setting timer for ${duration}`);
      // Here you would implement actual timer functionality
    }
  }

  private async handleEnvironmentControl(payload: any): Promise<void> {
    const { device, action } = payload;
    if (device && action) {
      toast.success(`${action} ${device}`);
      console.log(`Environment control: ${action} ${device}`);
      // Here you would implement actual device control
    }
  }

  private async handleServiceRequest(payload: any): Promise<void> {
    const request = payload.request;
    
    switch (request) {
      case 'view_menu':
        window.location.href = '/restaurant';
        toast.success('Opening restaurant menu');
        break;
      case 'navigate_category':
        window.location.href = '/restaurant';
        toast.success(`Navigating to ${payload.category} section`);
        break;
      case 'food_order':
        if (payload.items && Array.isArray(payload.items)) {
          const itemsText = payload.items.map((item: any) => 
            `${item.quantity || '1'} ${item.name}${item.special_instructions ? ` (${item.special_instructions})` : ''}`
          ).join(', ');
          toast.success(`Ordering: ${itemsText}`);
        } else if (payload.name) {
          const quantity = payload.quantity || '1';
          const instructions = payload.special_instructions ? ` (${payload.special_instructions})` : '';
          toast.success(`Ordering: ${quantity} ${payload.name}${instructions}`);
        }
        break;
      case 'modify_order':
        if (payload.special_instructions) {
          toast.success(`Order modified: ${payload.special_instructions}`);
        }
        break;
      default:
        toast.info('Processing your request...');
        console.log('Service request:', payload);
    }
  }

  private getAppUrl(appName: string): string {
    const appUrls: Record<string, string> = {
      'Netflix': 'https://www.netflix.com',
      'YouTube': 'https://www.youtube.com',
      'Pluto TV': 'https://pluto.tv',
      'YouTube Music': 'https://music.youtube.com',
      'Plex': 'https://www.plex.tv',
      'Disney+': 'https://www.disneyplus.com',
      'Hulu': 'https://www.hulu.com',
      'Prime Video': 'https://www.primevideo.com',
      'HBO Max': 'https://www.hbomax.com'
    };
    
    return appUrls[appName] || `https://www.google.com/search?q=${encodeURIComponent(appName)}`;
  }
}

export const useTokenProcessor = () => {
  const processor = new TokenProcessor();
  
  return {
    processToken: (token: VoiceToken) => processor.processToken(token)
  };
};
