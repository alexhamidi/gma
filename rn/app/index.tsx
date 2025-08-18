// implement from scratch

import { useEffect, useState } from "react";
import { View } from "react-native";
import SessionControlsNew from "../components/SessionControlsNew";
import { generateUUID } from "./utils/crypto";
import { RealtimeOpenAIConnection } from "./utils/rtc";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [dataChannel, setDataChannel] = useState<any>(null);

  const [rtc] = useState(
    () =>
      new RealtimeOpenAIConnection(
        "gpt-4o-realtime-preview-2025-06-03",
        process.env.EXPO_PUBLIC_OPENAI_API_KEY!,
      ),
  );

  async function startSession() {
    try {
      await rtc.startSession();
      setDataChannel(rtc.dataChannel);
    } catch (error) {
      console.error("Failed to start session:", error);
      setIsSessionActive(false);
      throw error;
    }
  }

  function sendTextMessage(message: string) {
    const messageEvent = {
      event_id: generateUUID(),
      timestamp: new Date().toLocaleTimeString(),
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

    rtc.sendClientEvent(messageEvent);
    rtc.sendClientEvent({ type: "response.create" });
  }

  const handleStopSession = () => {
    rtc.stopSession();
    setDataChannel(null);
    setIsSessionActive(false);
    setEvents([]);
  }

  useEffect(() => {
    if (dataChannel) {
      const handleMessage = (e: any) => {
        const serverEvent = JSON.parse(e.data);
        serverEvent.timestamp = new Date().toLocaleTimeString();
        setEvents((prev) => [serverEvent, ...prev]);
      };

      const handleOpen = () => {
        console.log("Data channel opened - setting session active");
        setIsSessionActive(true);
        setEvents([]);
      };

      const handleError = (e: any) => {
        console.error("Data channel error:", e);
        setIsSessionActive(false);
      };

      const handleClose = () => {
        console.log("Data channel closed");
        setIsSessionActive(false);
      };

      (dataChannel as any).addEventListener("message", handleMessage);
      (dataChannel as any).addEventListener("open", handleOpen);
      (dataChannel as any).addEventListener("error", handleError);
      (dataChannel as any).addEventListener("close", handleClose);

      return () => {
        (dataChannel as any).removeEventListener("message", handleMessage);
        (dataChannel as any).removeEventListener("open", handleOpen);
        (dataChannel as any).removeEventListener("error", handleError);
        (dataChannel as any).removeEventListener("close", handleClose);
      };
    }
  }, [dataChannel]);

  useEffect(() => {
    return () => {
      rtc.stopSession();
    };
  }, [rtc]);

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFF5" }}>

      {/* Main content */}
      <View style={{ flex: 1, flexDirection: "row" }}>
        <View style={{ flex: 2, paddingHorizontal: 16 }}>
          {/* <View style={{ flex: 1, paddingVertical: 16 }}>
            <EventLog events={events} />
          </View> */}
          <View
            style={{
              height: 400,
              marginVertical: 250,
            }}
          >
            <SessionControlsNew
              startSession={startSession}
              stopSession={handleStopSession}
              isSessionActive={isSessionActive}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
