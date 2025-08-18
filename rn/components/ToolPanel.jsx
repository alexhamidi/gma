import { useEffect, useState } from "react";
import { Text, View } from 'react-native';

const functionDescription = `
Call this function when a user asks for a color palette.
`;

const sessionUpdate = {
  type: "session.update",
  session: {
    tools: [
      {
        type: "function",
        name: "display_color_palette",
        description: functionDescription,
        parameters: {
          type: "object",
          strict: true,
          properties: {
            theme: {
              type: "string",
              description: "Description of the theme for the color scheme.",
            },
            colors: {
              type: "array",
              description: "Array of five hex color codes based on the theme.",
              items: {
                type: "string",
                description: "Hex color code",
              },
            },
          },
          required: ["theme", "colors"],
        },
      },
    ],
    tool_choice: "auto",
  },
};

function FunctionCallOutput({ functionCallOutput }) {
  const { theme, colors } = JSON.parse(functionCallOutput.arguments);

  const colorBoxes = colors.map((color) => (
    <View
      key={color}
      style={{
        width: '100%',
        height: 64,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: color
      }}
    >
      <Text style={{
        fontSize: 14,
        fontWeight: 'bold',
        color: 'black',
        backgroundColor: '#f1f5f9',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: 'black'
      }}>
        {color}
      </Text>
    </View>
  ));

  return (
    <View style={{ flexDirection: 'column', gap: 8 }}>
      <Text>Theme: {theme}</Text>
      {colorBoxes}
      <Text style={{
        fontSize: 12,
        backgroundColor: '#f3f4f6',
        borderRadius: 6,
        padding: 8,
        fontFamily: 'monospace'
      }}>
        {JSON.stringify(functionCallOutput, null, 2)}
      </Text>
    </View>
  );
}

export default function ToolPanel({
  isSessionActive,
  sendClientEvent,
  events,
}) {
  const [functionAdded, setFunctionAdded] = useState(false);
  const [functionCallOutput, setFunctionCallOutput] = useState(null);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const firstEvent = events[events.length - 1];
    if (!functionAdded && firstEvent.type === "session.created") {
      sendClientEvent(sessionUpdate);
      setFunctionAdded(true);
    }

    const mostRecentEvent = events[0];
    if (
      mostRecentEvent.type === "response.done" &&
      mostRecentEvent.response.output
    ) {
      mostRecentEvent.response.output.forEach((output) => {
        if (
          output.type === "function_call" &&
          output.name === "display_color_palette"
        ) {
          setFunctionCallOutput(output);
          setTimeout(() => {
            sendClientEvent({
              type: "response.create",
              response: {
                instructions: `
                ask for feedback about the color palette - don't repeat 
                the colors, just ask if they like the colors.
              `,
              },
            });
          }, 500);
        }
      });
    }
  }, [events]);

  useEffect(() => {
    if (!isSessionActive) {
      setFunctionAdded(false);
      setFunctionCallOutput(null);
    }
  }, [isSessionActive]);

  return (
    <View style={{ flex: 1, width: '100%', flexDirection: 'column', gap: 16 }}>
      <View style={{
        flex: 1,
        backgroundColor: '#f9fafb',
        borderRadius: 6,
        padding: 16
      }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Color Palette Tool</Text>
        {isSessionActive ? (
          functionCallOutput ? (
            <FunctionCallOutput functionCallOutput={functionCallOutput} />
          ) : (
            <Text>Ask for advice on a color palette...</Text>
          )
        ) : (
          <Text>Start the session to use this tool...</Text>
        )}
      </View>
    </View>
  );
}
