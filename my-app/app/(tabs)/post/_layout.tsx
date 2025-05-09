import { Stack } from 'expo-router';

export default function PostLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: 'transparent' },
        presentation: 'modal',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="preview" 
        options={{
          animation: 'fade',
          presentation: 'transparentModal',
        }}
      />
      <Stack.Screen 
        name="image-viewer" 
        options={{
          animation: 'fade',
          presentation: 'transparentModal',
          contentStyle: { backgroundColor: 'black' }
        }}
      />
    </Stack>
  );
} 