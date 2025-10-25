# GMA - Voice AI Assistant

Real-time voice conversation app powered by OpenAI's GPT-4o Realtime API. Talk naturally with AI using your voice, with support for function calling and multimodal interactions.

## Screenshot

<p align="center">
  <img src="./screenshots/app-demo.png" alt="GMA App Demo" width="300"/>
</p>

> Add your app screenshot to `./screenshots/app-demo.png`

## Features

- **Real-time Voice Conversations** - Natural voice chat with GPT-4o using WebRTC
- **Multimodal Support** - Text and audio processing with automatic transcription
- **Function Calling** - Execute actions like opening apps through voice commands
- **Server VAD** - Automatic turn detection for seamless conversations
- **Cross-platform** - Native iOS (Swift) and React Native implementations

## Tech Stack

- **iOS Native**: SwiftUI + AVFoundation + WebSockets
- **React Native**: Expo + WebRTC + TypeScript
- **AI**: OpenAI Realtime API (GPT-4o)

## Prerequisites

- Node.js 18+
- Xcode 15+ (for iOS)
- OpenAI API key with Realtime API access

## Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd gma
```

### 2. Set up React Native app

```bash
cd rn
npm install
```

Create a `.env` file:

```env
EXPO_PUBLIC_OPENAI_API_KEY=your_api_key_here
```

### 3. Set up Swift iOS app

Open `swift/gma.xcodeproj` in Xcode and add your OpenAI API key to the project.

## Running the App

### React Native (Expo)

```bash
cd rn
npx expo start
```

Then press `i` for iOS simulator or scan QR code for physical device.

### Native iOS

```bash
./run.sh
```

Or open `swift/gma.xcodeproj` in Xcode and run directly.

## Project Structure

```
gma/
├── rn/              # React Native/Expo app
│   ├── app/         # Main app code (Expo Router)
│   ├── components/  # Reusable components
│   └── utils/       # RTC connection & tools
├── swift/           # Native iOS SwiftUI app
│   └── gma/         # Swift source files
└── run.sh          # iOS build & run script
```

## How It Works

1. **Connection**: Establishes WebRTC connection to OpenAI Realtime API
2. **Audio Streaming**: Captures microphone input and streams PCM16 audio
3. **Real-time Processing**: OpenAI processes audio and responds with voice/text
4. **Function Calling**: AI can trigger app functions based on conversation
5. **Playback**: Audio responses are played back in real-time

## Function Calling

The app supports custom functions that can be invoked through voice commands:

```typescript
// Example: "Open Safari"
{
  name: "openApp",
  description: "open an app",
  parameters: {
    appName: { type: "string" }
  }
}
```

Add more functions in `rn/app/utils/tools.ts` or Swift implementation.

## License

MIT

## Contributing

Contributions welcome! Feel free to open issues or submit PRs.
