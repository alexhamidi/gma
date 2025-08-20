# Local AI Implementation

This is the local AI version of the app that replaces OpenAI Realtime API with:
- **Cactus** for local LLM inference
- **SFSpeechRecognizer** for native iOS speech recognition  
- **AVSpeechSynthesizer** for native iOS text-to-speech

## Key Features

✅ **Identical User Interface**: Same spinning cube, same interactions, same visual states
✅ **Local Processing**: No data sent to external APIs - everything runs on device
✅ **Native Performance**: Uses iOS native frameworks for speech processing
✅ **Cost-Free**: No API usage fees

## Usage

1. Use `app/index_local.tsx` instead of `app/index.tsx`
2. The API is identical - same props, same state management, same UI
3. Add a local model file to your app bundle at the path specified in `localAI.ts`

## Files Created

- `app/index_local.tsx` - Main app component (identical API to original)
- `app/utils/localAI.ts` - Local AI connection class
- `ios/rn/SpeechRecognizer.swift` - iOS speech recognition bridge
- `ios/rn/SpeechRecognizer.m` - Objective-C bridge header
- `ios/rn/SpeechSynthesizer.swift` - iOS speech synthesis bridge  
- `ios/rn/SpeechSynthesizer.m` - Objective-C bridge header

## Setup Required

1. **Model File**: ✅ **Automatic Download** - The app will automatically download the Qwen 3 0.6B model on first run
2. **Pod Install**: Run `npx pod-install` to update iOS dependencies  
3. **Permissions**: Speech recognition permission already added to Info.plist
4. **Build**: The Xcode project has been updated to include the new Swift files

## Switching Between Implementations

- **Original**: Use `app/index.tsx` (OpenAI Realtime API)
- **Local**: Use `app/index_local.tsx` (Cactus + Native Speech)

Both have identical APIs and user interfaces!