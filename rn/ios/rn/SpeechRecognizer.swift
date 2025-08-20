import Foundation
import Speech
import React

@objc(SpeechRecognizer)
class SpeechRecognizer: RCTEventEmitter {
    
    private var speechRecognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    
    override init() {
        super.init()
        setupSpeechRecognizer()
    }
    
    override func supportedEvents() -> [String]! {
        return ["onSpeechResult", "onSpeechError"]
    }
    
    private func setupSpeechRecognizer() {
        speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
        speechRecognizer?.delegate = self
    }
    
    @objc func requestPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        SFSpeechRecognizer.requestAuthorization { authStatus in
            DispatchQueue.main.async {
                switch authStatus {
                case .authorized:
                    resolve(true)
                case .denied, .restricted, .notDetermined:
                    reject("PERMISSION_DENIED", "Speech recognition permission denied", nil)
                @unknown default:
                    reject("UNKNOWN_ERROR", "Unknown authorization status", nil)
                }
            }
        }
    }
    
    @objc func startRecognition(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let speechRecognizer = speechRecognizer, speechRecognizer.isAvailable else {
            reject("NOT_AVAILABLE", "Speech recognizer not available", nil)
            return
        }
        
        if recognitionTask != nil {
            recognitionTask?.cancel()
            recognitionTask = nil
        }
        
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            reject("AUDIO_SESSION_ERROR", "Failed to setup audio session", error)
            return
        }
        
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        
        let inputNode = audioEngine.inputNode
        guard let recognitionRequest = recognitionRequest else {
            reject("REQUEST_ERROR", "Unable to create recognition request", nil)
            return
        }
        
        recognitionRequest.shouldReportPartialResults = true
        
        recognitionTask = speechRecognizer.recognitionTask(with: recognitionRequest) { result, error in
            var isFinal = false
            
            if let result = result {
                isFinal = result.isFinal
                if isFinal {
                    self.sendEvent(withName: "onSpeechResult", body: ["transcript": result.bestTranscription.formattedString])
                }
            }
            
            if error != nil || isFinal {
                self.audioEngine.stop()
                inputNode.removeTap(onBus: 0)
                
                self.recognitionRequest = nil
                self.recognitionTask = nil
                
                if let error = error {
                    self.sendEvent(withName: "onSpeechError", body: ["error": error.localizedDescription])
                }
            }
        }
        
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            self.recognitionRequest?.append(buffer)
        }
        
        audioEngine.prepare()
        
        do {
            try audioEngine.start()
            resolve(true)
        } catch {
            reject("ENGINE_ERROR", "Failed to start audio engine", error)
        }
    }
    
    @objc func stopRecognition(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if audioEngine.isRunning {
            audioEngine.stop()
            recognitionRequest?.endAudio()
        }
        resolve(true)
    }
}

extension SpeechRecognizer: SFSpeechRecognizerDelegate {
    func speechRecognizer(_ speechRecognizer: SFSpeechRecognizer, availabilityDidChange available: Bool) {
        if !available {
            sendEvent(withName: "onSpeechError", body: ["error": "Speech recognizer became unavailable"])
        }
    }
}