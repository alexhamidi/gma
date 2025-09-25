// implement from scratch

import { useEffect, useState } from "react";
import { View } from "react-native";
import SessionControlsNew from "../components/SessionControlsNew";
import { generateUUID } from "./utils/crypto";
import { RealtimeOpenAIConnection } from "./utils/rtc";
import * as tools from "./utils/tools";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [dataChannel, setDataChannel] = useState<any>(null);
  const [toolsRegistered, setToolsRegistered] = useState(false);

  const [rtc] = useState(
    () =>
      new RealtimeOpenAIConnection(
        "gpt-4o-realtime-preview-2025-06-03",
        process.env.EXPO_PUBLIC_OPENAI_API_KEY!,
      ),
  );

  const sessionUpdate = {
    type: "session.update",
    session: {
      tools: [
        // {
        //   type: "function",
        //   name: "sendMessage",
        //   description: "Send a message to a recipient",
        //   parameters: {
        //     type: "object",
        //     strict: true,
        //     properties: {
        //       message: {
        //         type: "string",
        //         description: "The message content to send",
        //       },
        //       recipient: {
        //         type: "string",
        //         description: "The recipient of the message",
        //       },
        //     },
        //     required: ["message", "recipient"],
        //   },
        // },
        // {
        //   type: "function",
        //   name: "callUber",
        //   description: "Call an Uber to a destination",
        //   parameters: {
        //     type: "object",
        //     strict: true,
        //     properties: {
        //       destination: {
        //         type: "string",
        //         description: "The destination address for the Uber ride",
        //       },
        //     },
        //     required: ["destination"],
        //   },
        // },
        {
          type: "function",
          name: "openApp",
          description: "open an app",
          parameters: {
            type: "object",
            strict: true,
            properties: {
              appName: {
                type: "string",
                description: "the name of the app to open",
              },
            },
            required: ["appName"],
          },
        },
      ],
      tool_choice: "auto",
    },
  };

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
    if (!events || events.length === 0) return;

    const firstEvent = events[events.length - 1];
    if (!toolsRegistered && firstEvent.type === "session.created") {
      rtc.sendClientEvent(sessionUpdate);
      setToolsRegistered(true);
    }

    const mostRecentEvent = events[0];
    if (
      mostRecentEvent.type === "response.done" &&
      mostRecentEvent.response.output
    ) {
      mostRecentEvent.response.output.forEach(async (output: any) => {
        if (output.type === "function_call") {
          let result = "";
          
          try {
            if (output.name === "openApp") {
              console.log("Opening app", output.arguments);
              const args = JSON.parse(output.arguments);
              result = await tools.openApp(args.appName);
            }
            // if (output.name === "sendMessage") {
            //   const args = JSON.parse(output.arguments);
            //   result = await tools.sendMessage(args.message, args.recipient);
            // } else if (output.name === "callUber") {
            //   const args = JSON.parse(output.arguments);
            //   result = await tools.callUber(args.destination);
            // }

            rtc.sendClientEvent({
              type: "conversation.item.create",
              item: {
                type: "function_call_output",
                call_id: output.call_id,
                output: result,
              },
            });

            rtc.sendClientEvent({ type: "response.create" });
          } catch (error) {
            console.error("Error executing function:", error);
            rtc.sendClientEvent({
              type: "conversation.item.create",
              item: {
                type: "function_call_output",
                call_id: output.call_id,
                output: `Error: ${error}`,
              },
            });
          }
        }
      });
    }
  }, [events, toolsRegistered, rtc, sessionUpdate]);

  useEffect(() => {
    if (!isSessionActive) {
      setToolsRegistered(false);
    }
  }, [isSessionActive]);

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
