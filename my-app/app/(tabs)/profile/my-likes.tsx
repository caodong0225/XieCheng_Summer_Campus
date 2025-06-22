import { getAvatar } from '@/utils/string';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';
import { getMyFavouriteNote } from '../../api/note';

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

export default function MyLikesScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const pageSize = 12;

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { pageNum: 1, pageSize };
      const response = await getMyFavouriteNote(params);
      
      // 根据实际API响应格式处理数据
      if (response && response.list) {
        setNotes(response.list);
      } else {
        setError(response?.message || '获取点赞游记失败');
      }
    } catch (err: any) {
      setError('获取点赞游记时发生错误: ' + (err.message || '未知错误'));
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotes();
  }, []);

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleNotePress = (id: number) => {
    router.push(`/profile/note-detail?id=${id}`);
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
          onPress={fetchNotes}
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
        <Text style={tw`text-lg font-semibold flex-1`}>我的点赞</Text>
      </View>
      
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
                <Ionicons name="heart" size={16} color="#f87171" />
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
            <Ionicons name="heart-outline" size={64} color="#d1d5db" style={tw`mb-4`} />
            <Text style={tw`text-gray-600 text-lg mb-1`}>还没有点赞游记</Text>
            <Text style={tw`text-gray-500 text-sm text-center px-8`}>
              去发现页面点赞喜欢的游记吧
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
    </View>
  );
}