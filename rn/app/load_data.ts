import * as FileSystem from 'expo-file-system';

const MODEL_NAME = 'qwen3-0.6b.gguf';
const MODEL_URL  = 'https://huggingface.co/Qwen/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q8_0.gguf';
const MODEL_PATH = FileSystem.documentDirectory + MODEL_NAME; //

export async function ensureModelInSandbox(): Promise<string> {
  const info = await FileSystem.getInfoAsync(MODEL_PATH);
  console.log('info', info);
  if (info.exists && info.size! > 0) return MODEL_PATH;
  console.log('Downloading model...');

  const download = FileSystem.createDownloadResumable(
    MODEL_URL,
    MODEL_PATH,
    {},
    prog => {
      const pct = (prog.totalBytesWritten / prog.totalBytesExpectedToWrite) * 100;
      console.log(`Model download: ${pct.toFixed(1)}%`);
    }
  );
  const { uri } = (await download.downloadAsync())!;

  return uri; 
}

