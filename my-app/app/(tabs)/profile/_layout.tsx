import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // 默认隐藏所有页面的顶部导航栏
        animation: 'slide_from_right', // 添加页面切换动画
      }}
    >
      {/* 主页面 */}
      <Stack.Screen 
        name="index" 
        options={{
          headerShown: true,
          title: '个人中心',
        }}
      />
      
      {/* 子页面，使用自定义导航栏 */}
      <Stack.Screen 
        name="my-travels" 
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="my-collections" 
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="settings" 
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      
      {/* 详情页面 */}
      <Stack.Screen 
        name="note-detail" 
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="comment" 
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
} 