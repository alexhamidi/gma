import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Button from "./Button";

export default function SessionControls({
  startSession,
  stopSession,
  isSessionActive,
}) {
  const [isActivating, setIsActivating] = useState(false);

  async function handleStartSession() {
    if (isActivating) return;

    setIsActivating(true);
    try {
      await startSession();
    } catch (error) {
      console.error("Failed to start session:", error);
    } finally {
      setIsActivating(false);
    }
  }

  useEffect(() => {
    if (isSessionActive) {
      setIsActivating(false);
    }
  }, [isSessionActive]);
  return (
    <View
      style={{
        flex: 1,
        gap: 16,
        paddingTop: 16,
      }}
    >
      {isSessionActive ? (
        <View
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Button
            onPress={stopSession}
            icon={<Text style={{ color: "white" }}>☁️</Text>}
          >
            disconnect
          </Button>
        </View>
      ) : (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Button
            onPress={handleStartSession}
            style={{ backgroundColor: isActivating ? "#4b5563" : "#dc2626" }}
            icon={<Text style={{ color: "white" }}>⚡</Text>}
          >
            {isActivating ? "starting session..." : "start session"}
          </Button>
        </View>
      )}
    </View>
  );
}
