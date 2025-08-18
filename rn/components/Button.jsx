import { Text, TouchableOpacity, View } from 'react-native';

export default function Button({ icon, children, onPress, style }) {
  return (
    <TouchableOpacity
      style={[{
        backgroundColor: '#1f2937',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      }, style]}
      onPress={onPress}
    >
      {icon && <View>{icon}</View>}
      <Text style={{ color: 'white', fontSize: 16 }}>{children}</Text>
    </TouchableOpacity>
  );
}
