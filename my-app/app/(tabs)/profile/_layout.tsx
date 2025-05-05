import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true, // 如需隐藏顶部导航栏可改为 false
      }}
    />
  );
} 