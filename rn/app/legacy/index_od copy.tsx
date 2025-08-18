// import { CactusLM } from "cactus-react-native";
// import { useState } from "react";
// import {
//   Alert,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { ensureModelInSandbox } from "./load_data";

// export default function HomeScreen() {
//   const [text, setText] = useState<string>("");
//   const [lm, setLm] = useState<CactusLM | null>(null);
//   const [response, setResponse] = useState<string>("");
//   const [isLoading, setIsLoading] = useState<boolean>(false);

//   const handleInitializeModel = async () => {
//     console.log("Initializing model...");
//     setIsLoading(true);
//     try {
//       const modelPath = await ensureModelInSandbox();
//       console.log("Model path:", modelPath);
//       const { lm: returnedLm, error } = await CactusLM.init({
//         model: modelPath,
//         n_ctx: 2048,
//       });
//       if (error) throw error;
//       setLm(returnedLm);
//       Alert.alert("Success", "Model initialized successfully!");
//     } catch (error) {
//       console.error("Model initialization error:", error);
//       Alert.alert("Error", `Failed to initialize model: ${error}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSubmitMessage = async () => {
//     console.log("Submitting message...");
//     console.log("text", text);

//     if (!lm) {
//       Alert.alert("Error", "Need to initialize model first");
//       return;
//     }
//     if (!text.trim()) {
//       Alert.alert("Error", "Please enter a message");
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const messages = [{ role: "user", content: text }];
//       const params = { n_predict: 2048, temperature: 0.7 };
//       const modelResponse = await lm.completion(messages, params);
//       setResponse(modelResponse.content || modelResponse.toString());
//     } catch (error) {
//       Alert.alert("Error", `Failed to get response: ${error}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <ScrollView style={styles.container}>
//       <View style={styles.content}>
//         <Text style={styles.title}>AI Chat</Text>

//         <TouchableOpacity
//           style={[styles.button, lm && styles.successButton]}
//           onPress={handleInitializeModel}
//           disabled={isLoading}
//         >
//           <Text style={styles.buttonText}>
//             {isLoading
//               ? "Initializing..."
//               : lm
//                 ? "Model Ready ✓"
//                 : "Initialize Model"}
//           </Text>
//         </TouchableOpacity>

//         <Text style={styles.label}>Enter Your Message:</Text>
//         <TextInput
//           style={styles.input}
//           onChangeText={setText}
//           value={text}
//           placeholder="Type your message here..."
//           multiline
//           editable={!isLoading}
//         />

//         <TouchableOpacity
//           style={[
//             styles.button,
//             styles.submitButton,
//             (!lm || isLoading) && styles.disabledButton,
//           ]}
//           onPress={handleSubmitMessage}
//           disabled={!lm || isLoading}
//         >
//           <Text style={styles.buttonText}>
//             {isLoading ? "Generating..." : "Send Message"}
//           </Text>
//         </TouchableOpacity>

//         {response ? (
//           <View style={styles.responseContainer}>
//             <Text style={styles.responseLabel}>AI Response:</Text>
//             <Text style={styles.responseText}>{response}</Text>
//           </View>
//         ) : null}
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   content: {
//     padding: 20,
//     paddingTop: 60,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: "bold",
//     color: "#333",
//     textAlign: "center",
//     marginBottom: 30,
//   },
//   label: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#333",
//     marginBottom: 10,
//     marginTop: 20,
//   },
//   input: {
//     fontSize: 16,
//     color: "#333",
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 8,
//     padding: 12,
//     minHeight: 100,
//     textAlignVertical: "top",
//     backgroundColor: "#f9f9f9",
//   },
//   button: {
//     backgroundColor: "#007AFF",
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 8,
//     marginTop: 15,
//     alignItems: "center",
//   },
//   submitButton: {
//     backgroundColor: "#34C759",
//   },
//   successButton: {
//     backgroundColor: "#34C759",
//   },
//   disabledButton: {
//     backgroundColor: "#999",
//   },
//   buttonText: {
//     color: "white",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   responseContainer: {
//     marginTop: 30,
//     padding: 15,
//     backgroundColor: "#f0f8ff",
//     borderRadius: 8,
//     borderLeftWidth: 4,
//     borderLeftColor: "#007AFF",
//   },
//   responseLabel: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#333",
//     marginBottom: 10,
//   },
//   responseText: {
//     fontSize: 16,
//     color: "#333",
//     lineHeight: 24,
//   },
// });
