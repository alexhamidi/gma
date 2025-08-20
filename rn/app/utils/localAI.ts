import { CactusLM } from 'cactus-react-native';
import { NativeEventEmitter, NativeModules } from 'react-native';
import { ensureModelInSandbox } from '../load_data';

const { SpeechRecognizer, SpeechSynthesizer } = NativeModules;

export class LocalAIConnection {
  private lm: any = null;
  private speechEmitter: NativeEventEmitter | null = null;
  private isListening: boolean = false;
  private onMessageCallback: ((data: any) => void) | null = null;
  private onOpenCallback: (() => void) | null = null;
  private onErrorCallback: ((error: any) => void) | null = null;
  private onCloseCallback: (() => void) | null = null;

  dataChannel: any = null;

  constructor() {
    if (SpeechRecognizer) {
      this.speechEmitter = new NativeEventEmitter(SpeechRecognizer);
    }
  }

  async startSession() {
    try {
      const modelPath = await ensureModelInSandbox();
      console.log('Using model at path:', modelPath);
      
      const { lm, error } = await CactusLM.init({
        model: modelPath,
        n_ctx: 2048,
      });

      if (error) {
        throw new Error(`Failed to initialize Cactus: ${error}`);
      }

      this.lm = lm;
      
      this.dataChannel = {
        addEventListener: (event: string, callback: any) => {
          if (event === 'message') this.onMessageCallback = callback;
          else if (event === 'open') this.onOpenCallback = callback;
          else if (event === 'error') this.onErrorCallback = callback;
          else if (event === 'close') this.onCloseCallback = callback;
        },
        removeEventListener: (event: string, callback: any) => {
          if (event === 'message') this.onMessageCallback = null;
          else if (event === 'open') this.onOpenCallback = null;
          else if (event === 'error') this.onErrorCallback = null;
          else if (event === 'close') this.onCloseCallback = null;
        },
        send: (data: string) => {
          this.handleClientEvent(JSON.parse(data));
        },
        close: () => {
          this.stopSession();
        }
      };

      if (SpeechRecognizer) {
        this.speechEmitter?.addListener('onSpeechResult', this.handleSpeechResult);
        this.speechEmitter?.addListener('onSpeechError', this.handleSpeechError);
        await SpeechRecognizer.requestPermission();
      }

      setTimeout(() => {
        this.onOpenCallback?.();
      }, 100);

    } catch (error) {
      console.error('Failed to start local AI session:', error);
      throw error;
    }
  }

  stopSession() {
    if (this.isListening && SpeechRecognizer) {
      SpeechRecognizer.stopRecognition();
      this.isListening = false;
    }

    if (SpeechSynthesizer) {
      SpeechSynthesizer.stopSpeaking();
    }

    this.speechEmitter?.removeAllListeners('onSpeechResult');
    this.speechEmitter?.removeAllListeners('onSpeechError');

    if (this.lm) {
      this.lm.release?.();
      this.lm = null;
    }

    this.dataChannel = null;
    this.onCloseCallback?.();
  }

  private handleSpeechResult = async (event: { transcript: string }) => {
    if (!this.lm || !event.transcript.trim()) return;

    try {
      const messages = [{ role: 'user', content: event.transcript }];
      const params = { n_predict: 200, temperature: 0.7 };
      const response = await this.lm.completion(messages, params);

      const serverEvent = {
        type: 'response.audio_transcript.done',
        transcript: response.content || response.text || '',
        timestamp: new Date().toLocaleTimeString()
      };

      this.onMessageCallback?.({ data: JSON.stringify(serverEvent) });

      if (SpeechSynthesizer && serverEvent.transcript) {
        await SpeechSynthesizer.speak(serverEvent.transcript);
      }

      setTimeout(() => {
        if (this.isListening && SpeechRecognizer) {
          SpeechRecognizer.startRecognition();
        }
      }, 500);

    } catch (error) {
      console.error('Error processing speech:', error);
      this.onErrorCallback?.(error);
    }
  };

  private handleSpeechError = (error: any) => {
    console.error('Speech recognition error:', error);
    this.onErrorCallback?.(error);
  };

  private async handleClientEvent(event: any) {
    if (event.type === 'conversation.item.create' && event.item?.content) {
      const textContent = event.item.content.find((c: any) => c.type === 'input_text');
      if (textContent?.text && this.lm) {
        try {
          const messages = [{ role: 'user', content: textContent.text }];
          const params = { n_predict: 200, temperature: 0.7 };
          const response = await this.lm.completion(messages, params);

          const serverEvent = {
            type: 'response.audio_transcript.done',
            transcript: response.content || response.text || '',
            timestamp: new Date().toLocaleTimeString()
          };

          this.onMessageCallback?.({ data: JSON.stringify(serverEvent) });

          if (SpeechSynthesizer && serverEvent.transcript) {
            await SpeechSynthesizer.speak(serverEvent.transcript);
          }
        } catch (error) {
          console.error('Error processing text message:', error);
          this.onErrorCallback?.(error);
        }
      }
    } else if (event.type === 'response.create') {
      if (!this.isListening && SpeechRecognizer) {
        this.isListening = true;
        await SpeechRecognizer.startRecognition();
      }
    }
  }

  sendClientEvent(message: any) {
    this.handleClientEvent(message);
  }
}