
import { Linking } from 'react-native';

// export async function sendMessage(message: string, recipient: string): Promise<string> {
//     console.log("called_tool: send_message", { message, recipient });
    
//     try {
//         // iOS Shortcuts URL scheme for sending messages
//         const shortcutName = 'Send Message';
//         const shortcutInput = JSON.stringify({ message, recipient });
        
//         const baseURL = 'shortcuts://run-shortcut';
//         const encodedName = encodeURIComponent(shortcutName);
//         const encodedInput = encodeURIComponent(shortcutInput);
        
//         const shortcutURL = `${baseURL}?name=${encodedName}&input=text&text=${encodedInput}`;
        
//         const canOpen = await Linking.canOpenURL(shortcutURL);
        
//         if (canOpen) {
//             await Linking.openURL(shortcutURL);
//             return `Message "${message}" sent successfully to ${recipient}`;
//         } else {
//             // Fallback: try to open Messages app directly
//             const messagesURL = `sms:${recipient}&body=${encodeURIComponent(message)}`;
//             await Linking.openURL(messagesURL);
//             return `Opened Messages app to send "${message}" to ${recipient}`;
//         }
//     } catch (error) {
//         console.error('Error sending message:', error);
//         return `Failed to send message to ${recipient}`;
//     }
// }

export async function openApp(appName: string): Promise<string> {
    console.log("called_tool: open_app", { appName });
    
    try {
        // Use iOS Shortcuts URL scheme according to Apple's documentation
        const shortcutName = 'Open App';
        const baseURL = 'shortcuts://run-shortcut';
        const encodedName = encodeURIComponent(shortcutName);
        const encodedAppName = encodeURIComponent(appName);
        
        // Pass the app name as text input to the shortcut
        const shortcutURL = `${baseURL}?name=${encodedName}&input=text&text=${encodedAppName}`;
        
        const canOpen = await Linking.canOpenURL(shortcutURL);
        
        if (canOpen) {
            await Linking.openURL(shortcutURL);
            return `Successfully opened ${appName}`;
        } else {
            throw new Error(`Shortcuts app not available - cannot open ${appName}`);
        }
    } catch (error) {
        console.error('Error opening app:', error);
        return `Failed to open ${appName}`;
    }
}

