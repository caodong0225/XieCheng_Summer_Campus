import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import tw from 'twrnc';
import { deleteVideo, getMyVideos } from '../../api/video';

interface Video {
  id: number;
  created_at: string;
  description: string;
  link: string;
  thumbnail: string;
  play_count: string;
}

interface VideoListResponse {
  code: number;
  message: string;
  data: {
    videos: Video[];
    total: number;
    page: number;
    limit: number;
  };
}

export default function MyVideosScreen() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchDescription, setSearchDescription] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const pageSize = 12;

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page,
        limit: pageSize,
      };

      if (searchDescription) {
        params.description = searchDescription;
      }

      const response = await getMyVideos(params);
      
      if (response.success && response.list) {
        setVideos(response.list);
      } else {
        setError('获取视频列表失败');
      }
    } catch (err) {
      setError('获取视频列表时发生错误');
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await fetchVideos();
  }, [searchDescription]);

  useEffect(() => {
    fetchVideos();
  }, [searchDescription]);

  const handleSearch = () => {
    setSearchDescription(searchInput);
    setPage(1);
  };

  const handleReset = () => {
    setSearchInput('');
    setSearchDescription('');
    setPage(1);
  };

  const handleVideoPress = (video: Video) => {
    // 跳转到视频详情页面，传递视频ID
    router.push({
      pathname: '/video-detail',
      params: { 
        videoId: video.id.toString()
      }
    });
  };

  const handleDeleteVideo = (video: Video) => {
    setVideoToDelete(video);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;
    
    try {
      const result = await deleteVideo(videoToDelete.id);
      if (result && result.code === 200) {
        Toast.show({
          type: 'success',
          text1: '删除成功',
          text2: '视频已成功删除',
        });
        // 从本地列表中移除
        setVideos(videos.filter(v => v.id !== videoToDelete.id));
      } else {
        Toast.show({
          type: 'error',
          text1: '删除失败',
          text2: result?.message || '删除视频失败，请重试',
        });
      }
    } catch (error) {
      console.error('删除视频失败：', error);
      Toast.show({
        type: 'error',
        text1: '删除失败',
        text2: '删除视频失败，请重试',
      });
    } finally {
      setShowDeleteModal(false);
      setVideoToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setVideoToDelete(null);
  };

  const formatPlayCount = (count: string) => {
    const num = parseInt(count);
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toString();
  };

  const renderFilterBar = () => (
    <View style={tw`p-4 bg-white border-b border-gray-200`}>
      <View style={tw`flex-row gap-2 mb-2`}>
        <View style={tw`flex-1 flex-row items-center border border-gray-300 rounded-lg px-3 bg-gray-50`}>
          <Ionicons name="search" size={20} color="#666" style={tw`mr-2`} />
          <TextInput
            style={tw`flex-1 py-2 text-base`}
            placeholder="搜索视频描述"
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            placeholderTextColor="#999"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchInput('')}
              style={tw`p-1`}
            >
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={tw`bg-blue-500 px-4 rounded-lg justify-center flex-row items-center`}
          onPress={handleSearch}
        >
          <Ionicons name="search" size={18} color="white" style={tw`mr-1`} />
          <Text style={tw`text-white font-medium`}>搜索</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={tw`bg-gray-200 px-4 rounded-lg justify-center flex-row items-center`}
          onPress={handleReset}
        >
          <Ionicons name="refresh" size={18} color="#666" style={tw`mr-1`} />
          <Text style={tw`text-gray-700 font-medium`}>重置</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <Text>加载中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <Text style={tw`text-red-500`}>{error}</Text>
        <TouchableOpacity 
          style={tw`mt-4 px-4 py-2 bg-blue-500 rounded`}
          onPress={fetchVideos}
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
        <Text style={tw`text-lg font-semibold flex-1`}>我的视频</Text>
      </View>

      {renderFilterBar()}
      
      <FlatList
        data={videos}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={tw`justify-between px-2`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={tw`w-[48%] mb-3 bg-white rounded-lg overflow-hidden shadow-sm`}
            onPress={() => handleVideoPress(item)}
          >
            <View style={tw`relative`}>
              <ExpoImage
                source={{ uri: item.thumbnail }}
                style={tw`w-full h-32`}
                contentFit="cover"
              />
              <View style={tw`absolute inset-0 bg-black bg-opacity-20 justify-center items-center`}>
                <View style={tw`bg-black bg-opacity-50 rounded-full p-2`}>
                  <Ionicons name="play" size={24} color="white" />
                </View>
              </View>
              <View style={tw`absolute bottom-1 right-1 bg-black bg-opacity-70 rounded px-1 py-0.5`}>
                <Text style={tw`text-white text-xs`}>
                  {formatPlayCount(item.play_count)} 播放
                </Text>
              </View>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteVideo(item);
                }}
                style={tw`absolute top-2 right-2 bg-red-500 rounded-full p-1`}
              >
                <Ionicons name="trash-outline" size={16} color="white" />
              </TouchableOpacity>
            </View>
            <View style={tw`p-2`}>
              <Text 
                style={tw`text-sm font-medium text-gray-800 mb-1`}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.description || '暂无描述'}
              </Text>
              <Text style={tw`text-xs text-gray-500`}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={tw`flex-1 justify-center items-center p-4 bg-white`}>
            <Ionicons name="videocam-outline" size={64} color="#ccc" style={tw`mb-4`} />
            <Text style={tw`text-gray-500 text-lg mb-2`}>还没有上传视频</Text>
            <Text style={tw`text-gray-400 text-sm`}>去个人资料页面上传视频吧</Text>
          </View>
        }
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
      <Toast />
      
      {/* 自定义删除确认对话框 */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-center items-center`}>
          <View style={tw`bg-white rounded-lg p-6 mx-4 w-80`}>
            <View style={tw`items-center mb-4`}>
              <View style={tw`bg-red-100 rounded-full p-3 mb-3`}>
                <Ionicons name="trash-outline" size={32} color="#ef4444" />
              </View>
              <Text style={tw`text-lg font-bold text-gray-800`}>确认删除</Text>
            </View>
            
            <Text style={tw`text-gray-600 text-center mb-6`}>
              确定要删除这个视频吗？删除后将无法恢复。
            </Text>
            
            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                style={tw`flex-1 py-3 px-4 border border-gray-300 rounded-lg`}
                onPress={cancelDelete}
              >
                <Text style={tw`text-center text-gray-700 font-medium`}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={tw`flex-1 py-3 px-4 bg-red-500 rounded-lg`}
                onPress={confirmDelete}
              >
                <Text style={tw`text-center text-white font-medium`}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
