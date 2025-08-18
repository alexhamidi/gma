import { RTCPeerConnection, mediaDevices } from "react-native-webrtc";

export class RealtimeOpenAIConnection {
  model: string;
  apiKey: string;
  dataChannel: any;
  private audioElement: any = null;
  private peerConnection: RTCPeerConnection | null = null;
  private mediaStream: any = null;

  constructor(model: string, apiKey: string) {
    this.model = model;
    this.apiKey = apiKey;
  }

  async startSession() {
    const pc = new RTCPeerConnection();
    this.peerConnection = pc;

    // callback - when ontrack happens, call this
    (pc as any).addEventListener("track", (e: any) => {
      if (this.audioElement && e.streams && e.streams[0]) {
        this.audioElement.srcObject = e.streams[0];
      }
    });

    // this is where the user is prompted
    console.log("Getting user media...");
    const ms: any = await mediaDevices.getUserMedia({
      audio: true,
    });
    this.mediaStream = ms;

    pc.addTrack(ms.getTracks()[0]);
    console.log("Added audio track");

    const dc = pc.createDataChannel("oai-channel");
    console.log("Created data channel:", dc);
    this.dataChannel = dc;

    // Start the session using the Session Description Protocol (SDP)

    // 1. create offer - empty js offer
    const offer = await pc.createOffer();

    // 2. actually applies the offer
    await pc.setLocalDescription(offer);
    console.log("Created offer and set local description");

    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = this.model;
    const apiKey = this.apiKey;
    console.log("Making SDP request to OpenAI...");

    // magic happens - snds the request
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/sdp",
      },
    });

    if (!sdpResponse.ok) {
      console.error(
        "SDP response error:",
        sdpResponse.status,
        sdpResponse.statusText,
      );
      const errorText = await sdpResponse.text();
      console.error("Error details:", errorText);
      return;
    }

    const answer = {
      type: "answer",
      sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);
    console.log("Set remote description - session should be starting");
  }

  stopSession() {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track: any) => {
        track.stop();
      });
      this.mediaStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.getSenders().forEach((sender: any) => {
        if (sender.track) {
          sender.track.stop();
        }
      });
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  // Send a message to the model
  sendClientEvent(message: any) {
    if (this.dataChannel) {
      this.dataChannel.send(JSON.stringify(message));
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message,
      );
    }
  }
}
