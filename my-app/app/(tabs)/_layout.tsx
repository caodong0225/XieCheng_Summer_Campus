import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 90 : 60,
          paddingBottom: Platform.OS === 'ios' ? 30 : 0,
        },
        tabBarActiveTintColor: '#2563eb',
      }}
    >
      {/* 保持你原有的五个标签配置 */}
        {/* 首页 */}
        <Tabs.Screen
        name="home/index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />

      {/* 视频 */}
      <Tabs.Screen
        name="video/index"
        options={{
          title: '视频',
          tabBarIcon: ({ color }) => (
            <Ionicons name="play-circle" size={24} color={color} />
          ),
        }}
      />

      {/* 发游记 */}
      <Tabs.Screen
        name="post"
        options={{
          title: '发游记',
          tabBarIcon: ({ color }) => (
            <Ionicons name="add-circle" size={32} color={color} style={{ marginTop: -8 }} />
          ),
        }}
      />

      {/* 消息 */}
      <Tabs.Screen
        name="message/index"
        options={{
          title: '消息',
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubbles" size={24} color={color} />
          ),
        }}
      />

      {/* 我的 */}
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}