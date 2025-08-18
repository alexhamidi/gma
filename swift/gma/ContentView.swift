import SwiftUI
import Foundation
import AVFoundation
let WSS_URL: URL! = URL(string: "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01")

struct RealtimeEvent: Codable {
    let type: String
    let event_id: String?
    
    enum CodingKeys: String, CodingKey {
        case type
        case event_id
    }
}

struct SessionUpdateEvent: Codable {
    let type: String
    let session: SessionConfig
    
    struct SessionConfig: Codable {
        let modalities: [String]
        let instructions: String
        let voice: String
        let input_audio_format: String
        let output_audio_format: String
        let input_audio_transcription: TranscriptionConfig?
        let turn_detection: TurnDetectionConfig?
        
        struct TranscriptionConfig: Codable {
            let model: String
        }
        
        struct TurnDetectionConfig: Codable {
            let type: String
            let threshold: Double?
            let prefix_padding_ms: Int?
            let silence_duration_ms: Int?
        }
    }
}

struct InputAudioBufferAppendEvent: Codable {
    let type: String
    let audio: String
}

struct ResponseCreateEvent: Codable {
    let type: String
    let response: ResponseConfig?
    
    struct ResponseConfig: Codable {
        let modalities: [String]?
        let instructions: String?
    }
}

class RealtimeAPIClient: ObservableObject {
    @Published var isConnected = false
    @Published var isRecording = false
    @Published var events: [String] = []
    @Published var conversationText = ""
    
    private var webSocketTask: URLSessionWebSocketTask?
    private var audioEngine: AVAudioEngine?
    private var inputNode: AVAudioInputNode?
    private var audioPlayer: AVAudioPlayer?
    
    init() {
        requestMicrophonePermission()
    }
    
    func requestMicrophonePermission() {
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
            DispatchQueue.main.async {
                if !granted {
                    print("Microphone permission denied")
                }
            }
        }
    }
    
    func connect() async {
        guard let url = WSS_URL else { return }
        
        var request = URLRequest(url: url)
        request.addValue("Bearer \(OPENAI_API_KEY)", forHTTPHeaderField: "Authorization")
        request.addValue("realtime=v1", forHTTPHeaderField: "OpenAI-Beta")
        
        webSocketTask = URLSession.shared.webSocketTask(with: request)
        webSocketTask?.resume()
        
        await MainActor.run {
            self.isConnected = true
            self.events.append("Connected to OpenAI Realtime API")
        }
        
        await configureSession()
        startListening()
    }
    
    func disconnect() {
        webSocketTask?.cancel()
        stopRecording()
        
        DispatchQueue.main.async {
            self.isConnected = false
            self.events.append("Disconnected")
        }
    }
    
    private func configureSession() async {
        let sessionConfig = SessionUpdateEvent(
            type: "session.update",
            session: SessionUpdateEvent.SessionConfig(
                modalities: ["text", "audio"],
                instructions: "You are a helpful AI assistant. Respond naturally and conversationally.",
                voice: "alloy",
                input_audio_format: "pcm16",
                output_audio_format: "pcm16",
                input_audio_transcription: SessionUpdateEvent.SessionConfig.TranscriptionConfig(model: "whisper-1"),
                turn_detection: SessionUpdateEvent.SessionConfig.TurnDetectionConfig(
                    type: "server_vad",
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 500
                )
            )
        )
        
        await sendEvent(sessionConfig)
    }
    
    private func sendEvent<T: Codable>(_ event: T) async {
        guard let webSocketTask = webSocketTask else { return }
        
        do {
            let data = try JSONEncoder().encode(event)
            let message = URLSessionWebSocketTask.Message.string(String(data: data, encoding: .utf8) ?? "")
            
            try await webSocketTask.send(message)
        } catch {
            print("Failed to send event: \(error)")
        }
    }
    
    private func startListening() {
        guard let webSocketTask = webSocketTask else { return }
        
        Task {
            do {
                let message = try await webSocketTask.receive()
                await handleMessage(message)
                startListening()
            } catch {
                print("WebSocket receive error: \(error)")
                await MainActor.run {
                    self.isConnected = false
                }
            }
        }
    }
    
    private func handleMessage(_ message: URLSessionWebSocketTask.Message) async {
        switch message {
        case .string(let text):
            await processEventString(text)
        case .data(let data):
            if let text = String(data: data, encoding: .utf8) {
                await processEventString(text)
            }
        @unknown default:
            break
        }
    }
    
    private func processEventString(_ text: String) async {
        await MainActor.run {
            self.events.append("Received: \(text)")
        }
        
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let eventType = json["type"] as? String else { return }
        
        switch eventType {
        case "session.created":
            await MainActor.run {
                self.events.append("Session created successfully")
            }
        case "response.audio.delta":
            if let audioData = json["delta"] as? String {
                await playAudioDelta(audioData)
            }
        case "response.text.delta":
            if let textDelta = json["delta"] as? String {
                await MainActor.run {
                    self.conversationText += textDelta
                }
            }
        case "error":
            if let error = json["error"] as? [String: Any],
               let message = error["message"] as? String {
                await MainActor.run {
                    self.events.append("Error: \(message)")
                }
            }
        default:
            break
        }
    }
    
    private func playAudioDelta(_ base64Audio: String) async {
        guard let audioData = Data(base64Encoded: base64Audio) else { return }
        
        do {
            audioPlayer = try AVAudioPlayer(data: audioData)
            audioPlayer?.play()
        } catch {
            print("Failed to play audio: \(error)")
        }
    }
    
    func startRecording() {
        guard !isRecording else { return }
        
        do {
            audioEngine = AVAudioEngine()
            guard let audioEngine = audioEngine else { return }
            
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playAndRecord, mode: .default)
            try audioSession.setActive(true)
            
            inputNode = audioEngine.inputNode
            let recordingFormat = inputNode?.outputFormat(forBus: 0)
            
            inputNode?.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
                self?.processAudioBuffer(buffer)
            }
            
            try audioEngine.start()
            
            DispatchQueue.main.async {
                self.isRecording = true
                self.events.append("Started recording")
            }
        } catch {
            print("Failed to start recording: \(error)")
        }
    }
    
    func stopRecording() {
        guard isRecording else { return }
        
        audioEngine?.stop()
        inputNode?.removeTap(onBus: 0)
        
        DispatchQueue.main.async {
            self.isRecording = false
            self.events.append("Stopped recording")
        }
        
        Task {
            let commitEvent = RealtimeEvent(type: "input_audio_buffer.commit", event_id: UUID().uuidString)
            await sendEvent(commitEvent)
            
            let responseEvent = ResponseCreateEvent(type: "response.create", response: nil)
            await sendEvent(responseEvent)
        }
    }
    
    private func processAudioBuffer(_ buffer: AVAudioPCMBuffer) {
        guard let channelData = buffer.floatChannelData?[0] else { return }
        
        let frameLength = Int(buffer.frameLength)
        var int16Data = [Int16]()
        
        for i in 0..<frameLength {
            let sample = channelData[i]
            let int16Sample = Int16(sample * 32767.0)
            int16Data.append(int16Sample)
        }
        
        let data = Data(bytes: int16Data, count: int16Data.count * 2)
        let base64Audio = data.base64EncodedString()
        
        Task {
            let audioEvent = InputAudioBufferAppendEvent(type: "input_audio_buffer.append", audio: base64Audio)
            await sendEvent(audioEvent)
        }
    }
}

struct ContentView: View {
    @State private var counter = 0
    @State private var text = ""
    @State private var llmText = ""
  
    
    var body: some View {
        VStack(spacing: 20) {
            TextField("Enter text", text: $text)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                
            .padding()
            
            Button("Tap to Connnect") {
                Task {
                    do {
                        connect_wss()
                    } catch {
                        print("API error occurred: \(error)")
                    }
                }
            }
        }
    }
    
}

#Preview {
    ContentView()
}
