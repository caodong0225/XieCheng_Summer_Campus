import {
  deleteNotificationById,
  getNotificationList,
  markReadNotificationAll,
  markReadNotificationById,
  Notification
} from '@/api/notification';
import { useSocket } from '@/utils/useSocket';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

export default function NotificationScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'system' | 'user'>('system');
  const [pageNum, setPageNum] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const pageSize = 15;
  
  // 使用WebSocket监听新通知
  const { socket } = useSocket('new_notification', () => {
    if (isInitialized) {
      fetchNotifications(activeTab, 1);
    }
  });

  // 获取通知数据
  const fetchNotifications = async (type: 'system' | 'user' = activeTab, page: number = 1) => {
    try {
      if (page === 1) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const params = {
        sender: type,
        page,
        pageSize
      };
      
      const response = await getNotificationList(params);
      
      if (response && response.list !== undefined) {
        const newList = response.list || [];
        
        if (page === 1) {
          setNotifications(newList);
          setHasMore(newList.length >= pageSize);
        } else {
          setNotifications(prev => [...prev, ...newList]);
          setHasMore(newList.length > 0);
        }
        setPageNum(page);
      } else {
        setError(response?.message || '获取通知失败，返回数据格式不正确');
      }
    } catch (err: any) {
      setError(`获取通知时发生错误: ${err.message || '未知错误'}`);
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 处理下拉刷新
  const onRefresh = useCallback(() => {
    fetchNotifications(activeTab, 1);
  }, [activeTab]);

  // 处理选项卡切换
  const handleTabChange = (tab: 'system' | 'user') => {
    setActiveTab(tab);
    fetchNotifications(tab, 1);
  };

  // 标记单条通知为已读
  const markAsRead = async (id: number) => {
    try {
      await markReadNotificationById(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
      );
    } catch (err) {
      console.error('标记已读失败:', err);
    }
  };

  // 标记当前选项卡全部已读
  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await markReadNotificationAll(activeTab);
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: 1 }))
      );
    } catch (err) {
      console.error('标记全部已读失败:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  // 删除通知
  const handleDelete = async (id: number) => {
    try {
      await deleteNotificationById(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('删除通知失败:', err);
    }
  };

  // 进入页面时加载数据
  useFocusEffect(
    useCallback(() => {
      fetchNotifications(activeTab, 1);
      setIsInitialized(true);
      return () => {};
    }, [activeTab])
  );

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return '刚刚';
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}小时前`;
    } else if (diffHours < 48) {
      return '昨天';
    } else {
      return date.toLocaleDateString();
    }
  };

  // 处理内容中的标签（支持 note 和 user）
  const renderContentWithTags = (content: string) => {
    // 匹配 <note id=...>...</note> 或 <user id=...>...</user>
    const tagRegex = /<(note|user) id=(\d+)>(.*?)<\/\1>/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
      // 添加标签前的文本
      if (match.index > lastIndex) {
        parts.push(
          <Text key={`text-${lastIndex}`} style={tw`text-gray-500`}>
            {content.substring(lastIndex, match.index)}
          </Text>
        );
      }

      // 提取标签信息
      const tagType = match[1]; // 'note' 或 'user'
      const id = match[2];
      const displayText = match[3];
      
      // 根据标签类型渲染可点击元素
      if (tagType === 'note') {
        parts.push(
          <TouchableOpacity 
            key={`${tagType}-${id}`}
            onPress={() => router.push(`/profile/note-detail?id=${id}`)}
          >
            <Text style={tw`text-blue-500 font-medium`}>{displayText}</Text>
          </TouchableOpacity>
        );
      } else if (tagType === 'user') {
        parts.push(
          <TouchableOpacity 
            key={`${tagType}-${id}`}
            //onPress={() => router.push(`/profile/user-detail?id=${id}`)}
          >
            <Text style={tw`text-purple-500 font-medium`}>{displayText}</Text>
          </TouchableOpacity>
        );
      }

      lastIndex = tagRegex.lastIndex;
    }

    // 添加剩余的文本
    if (lastIndex < content.length) {
      parts.push(
        <Text key={`text-${lastIndex}`} style={tw`text-gray-500`}>
          {content.substring(lastIndex)}
        </Text>
      );
    }

    return parts;
  };

  // 计算未读数量
  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  // 渲染空状态
  const renderEmpty = () => (
    <View style={tw`flex-1 justify-center items-center p-6 bg-white`}>
      <Ionicons 
        name={activeTab === 'system' ? "notifications-outline" : "chatbubble-ellipses-outline"} 
        size={64} 
        color="#d1d5db" 
        style={tw`mb-4`} 
      />
      <Text style={tw`text-gray-600 text-lg mb-1`}>
        {activeTab === 'system' ? '暂无系统消息' : '暂无用户消息'}
      </Text>
      <Text style={tw`text-gray-500 text-sm text-center px-8`}>
        {activeTab === 'system' 
          ? '系统通知将在这里显示' 
          : '用户私信将在这里显示'}
      </Text>
    </View>
  );

  // 渲染通知项
  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={tw`bg-white px-4 py-3 border-b border-gray-100`}
      onPress={() => markAsRead(item.id)}
    >
      <View style={tw`flex-row items-start`}>
        {/* 图标 */}
        <View style={tw`mr-3`}>
          {activeTab === 'system' ? (
            <View style={tw`bg-blue-50 rounded-full p-2`}>
              <Ionicons 
                name="notifications" 
                size={24} 
                color={item.is_read ? "#9ca3af" : "#3b82f6"} 
              />
            </View>
          ) : (
            <View style={tw`bg-purple-50 rounded-full p-2`}>
              <Ionicons 
                name="person-circle" 
                size={24} 
                color={item.is_read ? "#9ca3af" : "#8b5cf6"} 
              />
            </View>
          )}
        </View>

        {/* 内容区域 */}
        <View style={tw`flex-1`}>
          <View style={tw`flex-row justify-between items-start`}>
            <Text 
              style={tw`font-medium text-base ${
                item.is_read ? 'text-gray-600' : 'text-gray-900'
              }`}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={tw`text-gray-400 text-xs`}>
              {formatTime(item.created_at)}
            </Text>
          </View>

          <View style={tw`mt-1 flex-row flex-wrap`}>
            {renderContentWithTags(item.content)}
          </View>
        </View>

        {/* 未读标记 */}
        {item.is_read === 0 && (
          <View style={tw`ml-2 self-center`}>
            <View style={tw`w-2 h-2 rounded-full bg-red-500`} />
          </View>
        )}
      </View>

      {/* 操作按钮 */}
      <View style={tw`flex-row justify-end mt-2`}>
        <TouchableOpacity 
          style={tw`px-3 py-1 rounded-full bg-gray-100`}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={tw`text-gray-500 text-sm`}>删除</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // 加载更多指示器
  const renderFooter = () => {
    if (!loading || !hasMore) return null;
    return (
      <View style={tw`py-4`}>
        <ActivityIndicator size="small" color="#3b82f6" />
      </View>
    );
  };

  if (loading && !refreshing && notifications.length === 0) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={tw`mt-2 text-gray-500`}>加载中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <Ionicons name="warning" size={48} color="#ef4444" style={tw`mb-4`} />
        <Text style={tw`text-red-500 text-center px-6 mb-4`}>{error}</Text>
        <TouchableOpacity 
          style={tw`px-6 py-3 bg-blue-500 rounded-full flex-row items-center`}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={20} color="white" style={tw`mr-2`} />
          <Text style={tw`text-white font-medium`}>重新加载</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-gray-100`}>
      {/* 顶部导航栏 */}
      <View style={tw`bg-white py-4 px-4 border-b border-gray-200 flex-row justify-between items-center`}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={tw`p-1`}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={tw`text-xl font-bold text-gray-900`}>消息通知</Text>
        
        {/* 全部已读按钮 */}
        <TouchableOpacity 
          onPress={markAllAsRead}
          disabled={markingAll || unreadCount === 0}
          style={tw`px-3 py-1 rounded-full bg-blue-100 flex-row items-center`}
        >
          {markingAll ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={16} color="#3b82f6" style={tw`mr-1`} />
              <Text style={tw`text-blue-500 text-sm`}>全部已读</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* 选项卡 */}
      <View style={tw`flex-row bg-white border-b border-gray-200`}>
        <TouchableOpacity
          style={tw`flex-1 py-4 items-center ${
            activeTab === 'system' ? 'border-b-2 border-blue-500' : ''
          }`}
          onPress={() => handleTabChange('system')}
        >
          <Text style={tw`text-base font-medium ${
            activeTab === 'system' ? 'text-blue-500' : 'text-gray-500'
          }`}>
            系统通知
          </Text>
          {unreadCount > 0 && activeTab === 'system' && (
            <View style={tw`absolute top-2 right-6 bg-red-500 rounded-full w-5 h-5 justify-center items-center`}>
              <Text style={tw`text-white text-xs`}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={tw`flex-1 py-4 items-center ${
            activeTab === 'user' ? 'border-b-2 border-blue-500' : ''
          }`}
          onPress={() => handleTabChange('user')}
        >
          <Text style={tw`text-base font-medium ${
            activeTab === 'user' ? 'text-blue-500' : 'text-gray-500'
          }`}>
            用户消息
          </Text>
          {unreadCount > 0 && activeTab === 'user' && (
            <View style={tw`absolute top-2 right-6 bg-red-500 rounded-full w-5 h-5 justify-center items-center`}>
              <Text style={tw`text-white text-xs`}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 消息列表 */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
        contentContainerStyle={notifications.length === 0 ? tw`flex-1` : tw`pb-4`}
        onEndReached={() => {
          if (hasMore && !loading) {
            fetchNotifications(activeTab, pageNum + 1);
          }
        }}
        onEndReachedThreshold={0.1}
      />
    </View>
  );
}