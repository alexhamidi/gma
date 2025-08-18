import { useState } from "react";
import { Text, TextInput, View } from 'react-native';
import Button from "./Button";

function SessionStopped({ startSession }) {
  const [isActivating, setIsActivating] = useState(false);

  function handleStartSession() {
    if (isActivating) return;

    setIsActivating(true);
    startSession();
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button
        onPress={handleStartSession}
        style={{ backgroundColor: isActivating ? '#4b5563' : '#dc2626' }}
        icon={<Text style={{ color: 'white' }}>⚡</Text>}
      >
        {isActivating ? "starting session..." : "start session"}
      </Button>
    </View>
  );
}

function SessionActive({ stopSession, sendTextMessage }) {
  const [message, setMessage] = useState("");

  function handleSendClientEvent() {
    sendTextMessage(message);
    setMessage("");
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#e5e7eb',
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flex: 1,
          fontSize: 16
        }}
        placeholder="send a text message..."
        value={message}
        onChangeText={setMessage}
        onSubmitEditing={() => {
          if (message.trim()) {
            handleSendClientEvent();
          }
        }}
        returnKeyType="send"
      />
      <Button
        onPress={() => {
          if (message.trim()) {
            handleSendClientEvent();
          }
        }}
        icon={<Text style={{ color: 'white' }}>💬</Text>}
        style={{ backgroundColor: '#60a5fa' }}
      >
        send text
      </Button>
      <Button onPress={stopSession} icon={<Text style={{ color: 'white' }}>☁️</Text>}>
        disconnect
      </Button>
    </View>
  );
}

export default function SessionControls({
  startSession,
  stopSession,
  sendClientEvent,
  sendTextMessage,
  serverEvents,
  isSessionActive,
}) {
  return (
    <View style={{
      flex: 1,
      gap: 16,
      borderTopWidth: 2,
      borderTopColor: '#e5e7eb',
      borderRadius: 6,
      paddingTop: 16
    }}>
      {isSessionActive ? (
        <SessionActive
          stopSession={stopSession}
          sendClientEvent={sendClientEvent}
          sendTextMessage={sendTextMessage}
          serverEvents={serverEvents}
        />
      ) : (
        <SessionStopped startSession={startSession} />
      )}
    </View>
  );
}
