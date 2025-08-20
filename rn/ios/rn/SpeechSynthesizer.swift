import Foundation
import AVFoundation
import React

@objc(SpeechSynthesizer)
class SpeechSynthesizer: NSObject, RCTBridgeModule {
    
    private let synthesizer = AVSpeechSynthesizer()
    
    static func moduleName() -> String! {
        return "SpeechSynthesizer"
    }
    
    override init() {
        super.init()
        synthesizer.delegate = self
    }
    
    @objc func speak(_ text: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard !text.isEmpty else {
            reject("EMPTY_TEXT", "Text cannot be empty", nil)
            return
        }
        
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
        utterance.rate = 0.5
        utterance.pitchMultiplier = 1.0
        utterance.volume = 1.0
        
        DispatchQueue.main.async {
            self.synthesizer.speak(utterance)
            resolve(true)
        }
    }
    
    @objc func stopSpeaking(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            self.synthesizer.stopSpeaking(at: .immediate)
            resolve(true)
        }
    }
    
    @objc func pauseSpeaking(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            self.synthesizer.pauseSpeaking(at: .immediate)
            resolve(true)
        }
    }
    
    @objc func continueSpeaking(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            self.synthesizer.continueSpeaking()
            resolve(true)
        }
    }
    
    @objc static func requiresMainQueueSetup() -> Bool {
        return true
    }
}

extension SpeechSynthesizer: AVSpeechSynthesizerDelegate {
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) {
        // Speech started
    }
    
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        // Speech finished
    }
    
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        // Speech cancelled
    }
}