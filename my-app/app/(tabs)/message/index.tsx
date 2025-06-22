import { getNotificationList } from '@/api/notification';
import { useSocket } from '@/utils/useSocket';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type MessageType = 'system' | 'user';

interface Notification {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  is_read: number;
  sender: MessageType;
}

interface GroupData {
  key: MessageType;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  lastMsg: string;
  lastTime: string;
  unread: number;
}

const GROUPS = [
  {
    key: 'system' as MessageType,
    name: '系统消息',
    icon: 'notifications' as keyof typeof Ionicons.glyphMap,
  },
  {
    key: 'user' as MessageType,
    name: '用户消息',
    icon: 'person' as keyof typeof Ionicons.glyphMap,
  },
];

export default function MessageScreen(): React.JSX.Element {
  const [groupData, setGroupData] = useState<GroupData[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { socket } = useSocket('new_notification', () => fetchData());

  useFocusEffect(useCallback(() => {
    fetchData();
  }, []));

  const fetchData = async () => {
    try {
      setRefreshing(true);
      setLoading(true);

      // 一次性获取所有消息，减少API请求
      const [systemRes, userRes] = await Promise.all([
        getNotificationList({ sender: 'system', page: 1, pageSize: 99 }),
        getNotificationList({ sender: 'user', page: 1, pageSize: 99 }),
      ]);

      const systemMessages = systemRes.data?.list || [];
      const userMessages = userRes.data?.list || [];

      // 计算分组数据
      const groups = GROUPS.map(group => {
        const messages = group.key === 'system' ? systemMessages : userMessages;
        const unreadCount = messages.filter((msg: Notification) => msg.is_read === 0).length;
        const lastMessage = messages[0]; // 已按时间排序

        return {
          ...group,
          lastMsg: lastMessage?.content || '暂无消息',
          lastTime: lastMessage?.created_at || '',
          unread: unreadCount,
        };
      });

      setGroupData(groups);

      // 合并所有消息并按时间排序
      const allMessages = [...systemMessages, ...userMessages]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allMessages);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const day = 1000 * 60 * 60 * 24;

    if (diff < day) return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (diff < 2 * day) return '昨天';
    if (diff < 7 * day) return ['周日','周一','周二','周三','周四','周五','周六'][date.getDay()];
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const renderCard = (group: GroupData) => (
    <TouchableOpacity
      key={group.key}
      activeOpacity={0.7}
      className="bg-white mb-3 mx-4 rounded-lg border border-gray-100"
    >
      <View className="flex-row items-center p-4">
        <View className={`w-10 h-10 rounded-lg items-center justify-center mr-3 ${
          group.key === 'system' ? 'bg-blue-50' : 'bg-green-50'
        }`}>
          <Ionicons 
            name={group.icon} 
            size={20} 
            color={group.key === 'system' ? '#3B82F6' : '#10B981'} 
          />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-medium text-gray-900">{group.name}</Text>
            {group.unread > 0 && (
              <View className="bg-red-500 w-5 h-5 rounded-full items-center justify-center">
                <Text className="text-white text-xs">{group.unread}</Text>
              </View>
            )}
          </View>
          <Text className="text-gray-500 text-sm mt-1" numberOfLines={1}>{group.lastMsg}</Text>
          <Text className="text-xs text-gray-400 mt-1">{formatTime(group.lastTime)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      className="bg-white mb-2 mx-4 rounded-lg border border-gray-100"
    >
      <View className={`p-4 ${!item.is_read ? 'border-l-4 border-blue-500' : ''}`}>
        <View className="flex-row items-start">
          <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${
            item.sender === 'system' ? 'bg-blue-50' : 'bg-green-50'
          }`}>
            <Ionicons
              name={item.sender === 'system' ? 'notifications' : 'chatbubble'}
              size={16}
              color={item.sender === 'system' ? '#3B82F6' : '#10B981'}
            />
          </View>
          <View className="flex-1">
            <View className="flex-row justify-between items-start">
              <Text className={`text-sm font-medium ${item.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                {item.title || (item.sender === 'system' ? '系统消息' : '用户消息')}
              </Text>
              <Text className="text-xs text-gray-400 ml-2">{formatTime(item.created_at)}</Text>
            </View>
            <Text 
              className={`mt-1 text-sm ${item.is_read ? 'text-gray-600' : 'text-gray-800'}`} 
              numberOfLines={2}
            >
              {item.content}
            </Text>
            {!item.is_read && (
              <View className="mt-2 flex-row items-center">
                <View className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5" />
                <Text className="text-xs text-blue-500">未读</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      {/* 顶部导航栏 */}
      <View className="pt-12 pb-4 px-4 bg-white border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-semibold text-gray-900">消息</Text>
          <TouchableOpacity 
            onPress={() => {
              setGroupData(groupData.map(g => ({ ...g, unread: 0 })));
              setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
            }}
            className="bg-blue-500 px-3 py-1.5 rounded-md"
          >
            <Text className="text-white text-sm">全部已读</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 消息分类 */}
      <View className="py-3">
        <Text className="text-sm font-medium text-gray-700 px-4 mb-2">消息分类</Text>
        {groupData.map(renderCard)}
      </View>

      {/* 消息列表 */}
      <View className="px-4 mt-2 mb-2">
        <Text className="text-sm font-medium text-gray-700">近期消息</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-500 mt-3">加载中...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
          <Text className="text-gray-500 text-base mt-3">暂无消息</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchData}
              colors={['#3b82f6']}
              tintColor="#3b82f6"
            />
          }
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
