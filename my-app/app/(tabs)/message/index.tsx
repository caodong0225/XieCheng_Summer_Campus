// app/(tabs)/message/index.tsx
import { getNotificationList } from '@/api/notification';
import { useSocket } from '@/utils/useSocket';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

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
  color: string;
  iconColor: string;
  lastMsg: string;
  lastTime: string;
  unread: number;
}

interface MessageIconProps {
  type: MessageType;
  unreadCount: number;
}

interface MessageItemProps {
  message: Notification;
}

const GROUPS: Omit<GroupData, 'lastMsg' | 'lastTime' | 'unread'>[] = [
  {
    key: 'system',
    name: '系统消息',
    icon: 'notifications',
    color: 'bg-blue-400',
    iconColor: '#3B82F6',
  },
  {
    key: 'user',
    name: '用户消息',
    icon: 'person',
    color: 'bg-green-400',
    iconColor: '#22C55E',
  },
];

const MessageIcon: React.FC<MessageIconProps> = ({ type, unreadCount }) => {
  const iconMap: Record<MessageType, keyof typeof Ionicons.glyphMap> = {
    system: 'notifications-outline',
    user: 'chatbubble-outline'
  };

  return (
    <View className="relative p-2 m-1 bg-gray-100 rounded-full">
      <Ionicons name={iconMap[type]} size={24} color="black" />
      {unreadCount > 0 && (
        <View className="absolute top-0 right-0 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
          <Text className="text-white text-xs">{unreadCount}</Text>
        </View>
      )}
    </View>
  );
};

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return days[date.getDay()];
    } else {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
  };

  return (
    <View className="flex-row p-4 border-b border-gray-100">
      <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-3">
        <Ionicons 
          name={message.sender === 'system' ? 'notifications' : 'person'} 
          size={24} 
          color="#3b82f6" 
        />
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-lg font-semibold">
            {message.sender === 'system' ? '系统通知' : '用户消息'}
          </Text>
          <Text className="text-gray-400 text-sm">{formatTime(message.created_at)}</Text>
        </View>
        <Text className="text-gray-600" numberOfLines={1}>
          {message.content}
        </Text>
      </View>
    </View>
  );
};

export default function MessageGroupListScreen(): React.JSX.Element {
  const [groupData, setGroupData] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(false);

  // websocket
  const { socket } = useSocket('new_notification', (newMsg: Notification) => {
    console.log("收到新消息",newMsg)
    fetchGroups();
  });

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    const results: GroupData[] = await Promise.all(
      GROUPS.map(async (group) => {
        const res = await getNotificationList({ sender: group.key as MessageType, page: 1, pageSize: 1 });
        const unreadRes = await getNotificationList({ sender: group.key as MessageType, page: 1, pageSize: 99 });
        return {
          ...group,
          lastMsg: res.list?.[0]?.content || '暂无消息',
          lastTime: res.list?.[0]?.created_at || '',
          unread: (unreadRes.list?.filter((msg: Notification) => msg.is_read === 0).length) || 0,
        };
      })
    );
    setGroupData(results);
    setLoading(false);
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* 顶部栏 */}
      <View className="flex-row items-center justify-between h-14 px-4 border-b border-gray-100 bg-white">
        <View style={{ width: 60 }} />
        <Text className="text-lg font-bold text-black">消息</Text>
        <TouchableOpacity>
          <Text className="text-gray-400 text-sm">清除未读</Text>
        </TouchableOpacity>
      </View>

      {/* 消息分组列表 */}
      <FlatList
        data={groupData}
        keyExtractor={(item) => item.key}
        className="mt-2"
        contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            className="mb-3"
            // onPress={} // 你可以加跳转
          >
            <View className="flex-row items-center bg-white rounded-xl shadow-sm px-4 py-3">
              <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${item.color}`}>
                <Ionicons name={item.icon} size={28} color={item.iconColor} />
              </View>
              <View className="flex-1">
                <View className="flex-row justify-between items-center">
                  <Text className="font-bold text-base text-black">{item.name}</Text>
                  <Text className="text-gray-400 text-xs ml-2">{formatTime(item.lastTime)}</Text>
                </View>
                <View className="flex-row items-center mt-1">
                  <Text className="text-gray-500 text-sm flex-1" numberOfLines={1}>{item.lastMsg}</Text>
                  {item.unread > 0 && (
                    <View className="bg-red-500 rounded-full min-w-[18px] h-5 items-center justify-center ml-2 px-1.5">
                      <Text className="text-white text-xs font-bold">{item.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center mt-16">
              <Text className="text-gray-400">暂无消息</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}