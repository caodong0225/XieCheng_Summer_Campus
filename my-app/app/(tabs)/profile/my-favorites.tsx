import { getAvatar } from '@/utils/string';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';
import { getMyColllected } from '../../api/user';

interface Note {
  id: number;
  title: string;
  description: string;
  created_at: string;
  username: string;
  attachments: {
    id: number;
    key: string;
    value: string;
  };
}

interface Video {
  id: number;
  created_at: string;
  description: string;
  link: string;
  thumbnail: string;
}

export default function MyFavoritesScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<'note' | 'video'>('note');
  const pageSize = 12;

  const fetchSelected = async (type: 'note' | 'video' = selectedType) => {
    try {
      setLoading(true);
      setError(null);
      const params = { pageNum: 1, pageSize, type };
      const response = await getMyColllected(params);
      
      if (type === 'note') {
        // 正确解析API响应格式
        if (response && response.success && response.list) {
          setNotes(response.list);
          setVideos([]);
        } else {
          setError(response?.message || '获取收藏游记失败');
        }
      } else {
        if (response && response.success && response.list) {
          setVideos(response.list);
          setNotes([]);
        } else {
          setError(response?.message || '获取收藏视频失败');
        }
      }
    } catch (err: any) {
      setError(`获取收藏${selectedType === 'note' ? '游记' : '视频'}时发生错误: ` + (err.message || '未知错误'));
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSelected();
  }, [selectedType]);

  useEffect(() => {
    fetchSelected();
  }, [selectedType]);

  const handleNotePress = (id: number) => {
    router.push(`/profile/note-detail?id=${id}`);
  };

  const handleVideoPress = (video: Video) => {
    router.push({
      pathname: '/video-detail',
      params: { 
        videoId: video.id.toString()
      }
    });
  };

  if (loading && !refreshing) {
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
          onPress={() => fetchSelected()}
        >
          <Ionicons name="refresh" size={20} color="white" style={tw`mr-2`} />
          <Text style={tw`text-white font-medium`}>重新加载</Text>
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
        <Text style={tw`text-lg font-semibold flex-1`}>我的收藏</Text>
      </View>

      {/* 选择框 */}
      <View style={tw`flex-row bg-white border-b border-gray-200`}>
        <TouchableOpacity
          style={tw`flex-1 py-3 px-4 items-center ${
            selectedType === 'note' ? 'border-b-2 border-blue-500' : ''
          }`}
          onPress={() => setSelectedType('note')}
        >
          <Text style={tw`text-base font-medium ${
            selectedType === 'note' ? 'text-blue-500' : 'text-gray-500'
          }`}>
            游记
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={tw`flex-1 py-3 px-4 items-center ${
            selectedType === 'video' ? 'border-b-2 border-blue-500' : ''
          }`}
          onPress={() => setSelectedType('video')}
        >
          <Text style={tw`text-base font-medium ${
            selectedType === 'video' ? 'text-blue-500' : 'text-gray-500'
          }`}>
            视频
          </Text>
        </TouchableOpacity>
      </View>
      
      {selectedType === 'note' ? (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={tw`justify-between px-3`}
          contentContainerStyle={notes.length === 0 ? tw`flex-1` : tw`pb-4`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={tw`w-[48%] mb-4 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100`}
              onPress={() => handleNotePress(item.id)}
            >
              <View style={tw`relative`}>
                {item.attachments? (
                  <ExpoImage
                    source={{ uri: item.attachments.value }}
                    style={tw`w-full h-40`}
                    contentFit="cover"
                    transition={300}
                  />
                ) : (
                  <View style={tw`w-full h-40 bg-gray-100 justify-center items-center`}>
                    <Ionicons name="image-outline" size={40} color="#d1d5db" />
                  </View>
                )}
                <View style={tw`absolute bottom-2 right-2 bg-black bg-opacity-70 rounded-full w-8 h-8 justify-center items-center`}>
                  <Ionicons name="star-sharp" size={16} color="#ffff00" />
                </View>
              </View>
              <View style={tw`p-3`}>
                <Text 
                  style={tw`text-base font-semibold text-gray-900 mb-1`}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.title || '暂无标题'}
                </Text>
                <Text 
                  style={tw`text-sm text-gray-600 mb-2`}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.description || '暂无描述'}
                </Text>
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-row items-center`}>
                    <View style={tw`w-5 h-5 rounded-full bg-gray-300 mr-2 justify-center items-center`}>
                      <ExpoImage
                        source={{ uri: getAvatar(item) }}
                        style={tw`w-5 h-5 rounded-full`}
                        contentFit="cover"
                      />
                    </View>
                    <Text style={tw`text-xs text-gray-500`} numberOfLines={1} ellipsizeMode="tail">
                      {item.username || '未知用户'}
                    </Text>
                  </View>
                  <Text style={tw`text-xs text-gray-500`}>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : '未知日期'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={tw`flex-1 justify-center items-center p-6 bg-white`}>
              <Ionicons name="star-outline" size={64} color="#d1d5db" style={tw`mb-4`} />
              <Text style={tw`text-gray-600 text-lg mb-1`}>还没有收藏游记</Text>
              <Text style={tw`text-gray-500 text-sm text-center px-8`}>
                去发现页面收藏喜欢的游记吧
              </Text>
              <TouchableOpacity
                style={tw`mt-6 px-6 py-3 bg-blue-500 rounded-full`}
                onPress={() => router.push('/(tabs)/home')}
              >
                <Text style={tw`text-white font-medium`}>去发现</Text>
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3b82f6']}
              tintColor="#3b82f6"
            />
          }
        />
      ) : (
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
                <View style={tw`absolute bottom-2 right-2 bg-black bg-opacity-70 rounded-full w-8 h-8 justify-center items-center`}>
                  <Ionicons name="star-sharp" size={16} color="#ffff00" />
                </View>
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
              <Text style={tw`text-gray-500 text-lg mb-2`}>还没有收藏视频</Text>
              <Text style={tw`text-gray-400 text-sm`}>去视频页面收藏喜欢的视频吧</Text>
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
      )}
    </View>
  );
}