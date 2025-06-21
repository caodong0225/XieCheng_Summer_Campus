import { isLoggedIn } from '@/store/token';
import { Stack } from 'expo-router';
export default function RootLayout() {
  const isLogged = isLoggedIn() == null;

  return (
    <Stack>
      {/** 不显示头部 */}
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />
      {/* 认证路由组（无底部导航） */}
      {!isLogged && (
        <Stack.Screen
          name="(auth)"
          options={{ headerShown: false }}
        />
      )}

      {/* 主界面路由组（显示底部导航） */}
      {isLogged && (
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
      )}

      {/* 游记详情页面 */}
      <Stack.Screen
        name="note-detail"
        options={{ 
          headerShown: false,
          presentation: 'modal'
        }}
      />
    </Stack>
  );
}