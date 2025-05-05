import { Text, View } from 'react-native';

export default function MessageScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>消息列表</Text>
    </View>
  );
}