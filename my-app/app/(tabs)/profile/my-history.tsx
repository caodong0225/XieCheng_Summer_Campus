import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import tw from 'twrnc';
import { deleteVideoHistory, getVideoHistory } from '../../api/video';

interface VideoHistory {
  video_id: number;
  video_title: string;
  video_thumbnail: string;
  last_visited_at: string;
}

interface VideoHistoryResponse {
  code: number;
  message: string;
  data: {
    videos: VideoHistory[];
    page: number;
    limit: number;
  };
}

export default function MyHistoryScreen() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  const fetchVideos = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const currentPage = isRefresh ? 1 : page;
      const params = {
        page: currentPage,
        limit: pageSize,
      };

      console.log('Fetching video history with params:', params);
      const response = await getVideoHistory(params);
      console.log('Video history response:', response);
      
      // 检查响应格式
      if (response && response.success) {
        const newVideos = response.list || [];
        console.log('Parsed videos:', newVideos);
        
        if (isRefresh) {
          setVideos(newVideos);
        } else {
          setVideos(prev => [...prev, ...newVideos]);
        }
        
        setPage(currentPage + 1);
        setHasMore(newVideos.length === pageSize);
      } else {
        console.error('API response error:', response);
        setError(response?.message || '获取观看历史失败');
      }
    } catch (err) {
      console.error('Error fetching video history:', err);
      setError('获取观看历史时发生错误');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = useCallback(async () => {
    await fetchVideos(true);
  }, []);

  const loadMore = () => {
    if (hasMore && !loading && !refreshing) {
      fetchVideos();
    }
  };

  useEffect(() => {
    fetchVideos(true);
  }, []);

  const handleVideoPress = (video: VideoHistory) => {
    // 跳转到视频详情页面，传递视频ID
    router.push({
      pathname: '/video-detail',
      params: { 
        videoId: video.video_id.toString()
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else if (diffInHours < 24 * 7) {
      const days = Math.floor(diffInHours / 24);
      return `${days}天前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleDelete = async (video: VideoHistory) => {
    try {
        const response = await deleteVideoHistory(video.video_id);
        if (response && response.code === 200) {
        // 从列表中移除该视频
        setVideos(prev => prev.filter(v => v.video_id !== video.video_id));
        Toast.show({
            type: 'success',
            text1: '删除成功',
            visibilityTime: 2000,
            autoHide: true,
            position: 'bottom',
        })
        } else {
        Alert.alert('错误', response?.message || '删除失败');
        }
    } catch (err) {
        console.error('Error deleting video history:', err);
        Alert.alert('错误', '删除失败，请重试');
    }
  };

  if (loading && !refreshing && videos.length === 0) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <Text>加载中...</Text>
      </View>
    );
  }

  if (error && videos.length === 0) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <Text style={tw`text-red-500`}>{error}</Text>
        <TouchableOpacity 
          style={tw`mt-4 px-4 py-2 bg-blue-500 rounded`}
          onPress={() => fetchVideos(true)}
        >
          <Text style={tw`text-white`}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-gray-100`}>
      <View style={tw`flex-row items-center p-4 border-b border-gray-200 bg-white`}>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/profile')} 
          style={tw`mr-4 p-1`}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={tw`text-lg font-semibold flex-1`}>观看历史</Text>
      </View>

      {/* 操作提示 */}
      {videos.length > 0 && (
        <View style={tw`bg-blue-50 px-4 py-2 border-b border-blue-100`}>
          <Text style={tw`text-blue-700 text-xs text-center`}>
            长按视频卡片或点击右上角删除按钮可删除观看记录
          </Text>
        </View>
      )}

      <FlatList
        data={videos}
        keyExtractor={(item) => item.video_id.toString()}
        numColumns={2}
        columnWrapperStyle={tw`justify-between px-2`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={tw`w-[48%] mb-3 bg-white rounded-lg overflow-hidden shadow-sm`}
            onPress={() => handleVideoPress(item)}
            onLongPress={() => handleDelete(item)}
            activeOpacity={0.8}
          >
            <View style={tw`relative`}>
              <ExpoImage
                source={{ uri: item.video_thumbnail }}
                style={tw`w-full h-32`}
                contentFit="cover"
              />
              <View style={tw`absolute inset-0 bg-black bg-opacity-20 justify-center items-center`}>
                <View style={tw`bg-black bg-opacity-50 rounded-full p-2`}>
                  <Ionicons name="play" size={24} color="white" />
                </View>
              </View>
              <View style={tw`absolute bottom-1 right-1 bg-black bg-opacity-70 rounded px-1 py-0.5`}>
                <Ionicons name="time" size={12} color="white" />
              </View>
              <TouchableOpacity
                style={tw`absolute top-1 right-1 bg-red-500 rounded-full w-6 h-6 justify-center items-center`}
                onPress={() => handleDelete(item)}
              >
                <Ionicons name="close" size={14} color="white" />
              </TouchableOpacity>
            </View>
            <View style={tw`p-2`}>
              <Text 
                style={tw`text-sm font-medium text-gray-800 mb-1`}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.video_title || '暂无标题'}
              </Text>
              <Text style={tw`text-xs text-gray-500`}>
                {formatDate(item.last_visited_at)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={tw`flex-1 justify-center items-center p-4 bg-white`}>
            <Ionicons name="time-outline" size={64} color="#ccc" style={tw`mb-4`} />
            <Text style={tw`text-gray-500 text-lg mb-2`}>还没有观看记录</Text>
            <Text style={tw`text-gray-400 text-sm`}>去视频页面观看视频吧</Text>
          </View>
        }
        ListFooterComponent={
          !hasMore && videos.length > 0 ? (
            <View style={tw`py-4 items-center`}>
              <Text style={tw`text-gray-500 text-sm`}>没有更多记录了</Text>
            </View>
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
            title="下拉刷新"
            titleColor="#666"
          />
        }
        contentContainerStyle={tw`pb-4`}
      />
    </View>
  );
} 