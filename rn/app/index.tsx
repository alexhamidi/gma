import { useEffect, useRef, useState } from "react";
import { Text, View } from 'react-native';
import {
  RTCPeerConnection,
  mediaDevices
} from 'react-native-webrtc';
import EventLog from "../components/EventLog";
import SessionControls from "../components/SessionControls";
import ToolPanel from "../components/ToolPanel";

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  // ?
  const [dataChannel, setDataChannel] = useState<any>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const audioElement = useRef<any>(null);

  async function startSession() {
    console.log("Starting session...");
    const pc = new RTCPeerConnection();
    
    // callback - when ontrack happens, call this
    (pc as any).addEventListener('track', (e: any) => {
      console.log("Track received:", e);
      if (audioElement.current && e.streams && e.streams[0]) {
        audioElement.current.srcObject = e.streams[0];
      }
    });

    // Add local audio track for microphone input
    console.log("Getting user media...");
    const ms = await mediaDevices.getUserMedia({
      audio: true,
    });

    pc.addTrack(ms.getTracks()[0]);
    console.log("Added audio track");

    // Set up data channel for sending and receiving events
    const dc = pc.createDataChannel("oai-events");
    console.log("Created data channel:", dc);
    setDataChannel(dc);

    // Start the session using the Session Description Protocol (SDP)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("Created offer and set local description");

    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-realtime-preview-2024-12-17";
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
    console.log("Making SDP request to OpenAI...");
    
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/sdp",
      },
    });

    if (!sdpResponse.ok) {
      console.error("SDP response error:", sdpResponse.status, sdpResponse.statusText);
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

    peerConnection.current = pc;
  }

  // Stop current session, clean up peer connection and data channel
  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }

    if (peerConnection.current) {
      peerConnection.current.getSenders().forEach((sender: any) => {
        if (sender.track) {
          sender.track.stop();
        }
      });
    }

    if (peerConnection.current) {
      peerConnection.current.close();
    }

    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
  }

  // Send a message to the model
  function sendClientEvent(message: any) {
    if (dataChannel) {
      const timestamp = new Date().toLocaleTimeString();
      message.event_id = message.event_id || generateUUID();

      // send event before setting timestamp since the backend peer doesn't expect this field
      dataChannel.send(JSON.stringify(message));

      // if guard just in case the timestamp exists by miracle
      if (!message.timestamp) {
        message.timestamp = timestamp;
      }
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message,
      );
    }
  }

  // Send a text message to the model
  function sendTextMessage(message: string) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  useEffect(() => {
    if (dataChannel) {
      // Append new server events to the list
      (dataChannel as any).addEventListener("message", (e: any) => {
        const serverEvent = JSON.parse(e.data);
        if (!serverEvent.timestamp) {
          serverEvent.timestamp = new Date().toLocaleTimeString();
        }

        setEvents((prev) => [serverEvent, ...prev]);
      });

      // Set session active when the data channel is opened
      (dataChannel as any).addEventListener("open", () => {
        console.log("Data channel opened - setting session active");
        setIsSessionActive(true);
        setEvents([]);
      });

      // Add error and close handlers for debugging
      (dataChannel as any).addEventListener("error", (e: any) => {
        console.error("Data channel error:", e);
      });

      (dataChannel as any).addEventListener("close", () => {
        console.log("Data channel closed");
        setIsSessionActive(false);
      });
    }
  }, [dataChannel]);

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ 
        height: 64, 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        justifyContent: 'space-between'
      }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>realtime console</Text>
        <Text style={{ fontSize: 12, color: '#6b7280' }}>
          Session: {isSessionActive ? 'Active' : 'Inactive'} | Events: {events.length} | DC: {dataChannel ? 'Ready' : 'None'}
        </Text>
      </View>
      
      {/* Main content */}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Left side - Event Log and Session Controls */}
        <View style={{ flex: 2, paddingHorizontal: 16 }}>
          <View style={{ flex: 1, paddingVertical: 16 }}>
            <EventLog events={events} />
          </View>
          <View style={{ 
            height: 120, 
            paddingVertical: 16,
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb'
          }}>
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              serverEvents={events}
              isSessionActive={isSessionActive}
            />
          </View>
        </View>
        
        {/* Right side - Tool Panel */}
        <View style={{ 
          flex: 1, 
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderLeftWidth: 1,
          borderLeftColor: '#e5e7eb'
        }}>
          <ToolPanel
            sendClientEvent={sendClientEvent}
            events={events}
            isSessionActive={isSessionActive}
          />
        </View>
      </View>
    </View>
  );
}
