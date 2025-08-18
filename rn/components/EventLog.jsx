import { useState } from "react";
import { Text, TouchableOpacity, View } from 'react-native';

function Event({ event, timestamp }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isClient = event.event_id && !event.event_id.startsWith("event_");

  return (
    <View style={{
      flexDirection: 'column',
      gap: 8,
      padding: 8,
      borderRadius: 6,
      backgroundColor: '#f9fafb'
    }}>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8
        }}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={{ color: isClient ? '#60a5fa' : '#4ade80' }}>
          {isClient ? '↓' : '↑'}
        </Text>
        <Text style={{ fontSize: 14, color: '#6b7280' }}>
          {isClient ? "client:" : "server:"} {event.type} | {timestamp}
        </Text>
      </TouchableOpacity>
      {isExpanded && (
        <View style={{
          color: '#6b7280',
          backgroundColor: '#e5e7eb',
          padding: 8,
          borderRadius: 6
        }}>
          <Text style={{ fontSize: 12, fontFamily: 'monospace' }}>
            {JSON.stringify(event, null, 2)}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function EventLog({ events }) {
  const eventsToDisplay = [];
  let deltaEvents = {};

  events.forEach((event) => {
    if (event.type.endsWith("delta")) {
      if (deltaEvents[event.type]) {
        // for now just log a single event per render pass
        return;
      } else {
        deltaEvents[event.type] = event;
      }
    }

    eventsToDisplay.push(
      <Event key={event.event_id} event={event} timestamp={event.timestamp} />,
    );
  });

  return (
    <View style={{ flexDirection: 'column', gap: 8 }}>
      {events.length === 0 ? (
        <Text style={{ color: '#6b7280' }}>Awaiting events...</Text>
      ) : (
        eventsToDisplay
      )}
    </View>
  );
}
