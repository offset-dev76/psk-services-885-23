const HA_WS_URL = 'ws://192.168.0.112:8123/api/websocket';
const HA_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI4NjY3Y2NlNjEzZTg0OTQ2YjY3NTIzYjIzZTM4NWJlYSIsImlhdCI6MTc1NDIyMjE0MywiZXhwIjoyMDY5NTgyMTQzfQ.t8GLmFJjsCsMBS-Bg4h-y_8iSOoOpRK_qTYiQPLIyC4';

export interface SmartPlugControlResult {
  success: boolean;
  message: string;
}

export class HomeAssistantService {
  private static instance: HomeAssistantService;
  private messageId = 1;

  static getInstance(): HomeAssistantService {
    if (!HomeAssistantService.instance) {
      HomeAssistantService.instance = new HomeAssistantService();
    }
    return HomeAssistantService.instance;
  }

  async controlSmartPlug(entityId: string, turnOn: boolean): Promise<SmartPlugControlResult> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(HA_WS_URL);
      const currentMessageId = this.messageId++;
      
      let isResolved = false;
      const timeout = setTimeout(() => {
        if (!isResolved) {
          ws.close();
          reject(new Error('WebSocket timeout - Home Assistant did not respond'));
        }
      }, 10000); // 10 second timeout

      ws.onopen = () => {
        console.log('Connected to Home Assistant WebSocket');
        // Authenticate upon connection
        ws.send(JSON.stringify({ 
          type: 'auth', 
          access_token: HA_TOKEN 
        }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('HA WebSocket message:', message);

        if (message.type === 'auth_ok') {
          console.log('Home Assistant authentication successful');
          // Send command once authenticated
          ws.send(JSON.stringify({
            id: currentMessageId,
            type: 'call_service',
            domain: 'switch',
            service: turnOn ? 'turn_on' : 'turn_off',
            target: { entity_id: entityId }
          }));
        } else if (message.type === 'result' && message.id === currentMessageId) {
          clearTimeout(timeout);
          isResolved = true;
          ws.close();
          
          if (message.success) {
            resolve({
              success: true,
              message: `Smart plug ${turnOn ? 'turned on' : 'turned off'} successfully`
            });
          } else {
            reject(new Error(`Home Assistant service call failed: ${message.error?.message || 'Unknown error'}`));
          }
        } else if (message.type === 'auth_invalid') {
          clearTimeout(timeout);
          isResolved = true;
          ws.close();
          reject(new Error('Authentication failed with Home Assistant WebSocket API'));
        }
      };

      ws.onerror = (err) => {
        clearTimeout(timeout);
        if (!isResolved) {
          isResolved = true;
          console.error('Home Assistant WebSocket error:', err);
          reject(new Error('Failed to connect to Home Assistant WebSocket'));
        }
      };

      ws.onclose = (event) => {
        clearTimeout(timeout);
        if (!isResolved) {
          isResolved = true;
          if (event.code !== 1000) { // 1000 is normal closure
            reject(new Error(`WebSocket closed unexpectedly: ${event.reason || 'Unknown reason'}`));
          }
        }
      };
    });
  }

  async getEntityState(entityId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(HA_WS_URL);
      const currentMessageId = this.messageId++;
      
      let isResolved = false;
      const timeout = setTimeout(() => {
        if (!isResolved) {
          ws.close();
          reject(new Error('WebSocket timeout - Home Assistant did not respond'));
        }
      }, 10000);

      ws.onopen = () => {
        ws.send(JSON.stringify({ 
          type: 'auth', 
          access_token: HA_TOKEN 
        }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'auth_ok') {
          ws.send(JSON.stringify({
            id: currentMessageId,
            type: 'get_states'
          }));
        } else if (message.type === 'result' && message.id === currentMessageId) {
          clearTimeout(timeout);
          isResolved = true;
          ws.close();
          
          if (message.success) {
            const entity = message.result.find((state: any) => state.entity_id === entityId);
            resolve(entity || null);
          } else {
            reject(new Error(`Failed to get entity state: ${message.error?.message || 'Unknown error'}`));
          }
        } else if (message.type === 'auth_invalid') {
          clearTimeout(timeout);
          isResolved = true;
          ws.close();
          reject(new Error('Authentication failed with Home Assistant WebSocket API'));
        }
      };

      ws.onerror = (err) => {
        clearTimeout(timeout);
        if (!isResolved) {
          isResolved = true;
          reject(new Error('Failed to connect to Home Assistant WebSocket'));
        }
      };
    });
  }
}

export const homeAssistantService = HomeAssistantService.getInstance();