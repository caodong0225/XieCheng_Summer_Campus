import { getAvatar } from '@/utils/string';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';
import { getNoteApproved } from '../../api/note';

interface Note {
  id: number;
  title: string;
  description: string;
  created_at: string;
  username: string;
  email: string;
  status: string;
  attachments: {
    id: number;
    note_id: number;
    key: string;
    value: string;
    created_at: string;
    updated_at: string;
    weight: number;
  }[];
}

export default function HomeScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const pageSize = 10;

  const fetchNotes = async (pageNum: number = 1, isRefresh: boolean = false, keyword: string = '') => {
    try {
      if (pageNum === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      
      const params: any = { pageNum, pageSize };
      if (keyword) {
        params.description = keyword;
      }
      
      const response = await getNoteApproved(params);
      
      // 根据实际API响应格式处理数据
      if (response && response.data && response.data.list) {
        const newNotes = response.data.list;
        const total = response.data.total;
        const pages = response.data.pages;
        
        if (isRefresh || pageNum === 1) {
          setNotes(newNotes);
        } else {
          setNotes(prev => [...prev, ...newNotes]);
        }
        
        // 判断是否还有更多数据
        setHasMore(pageNum < pages);
        setCurrentPage(pageNum);
      } else {
        setError(response?.message || '获取游记失败');
      }
    } catch (err: any) {
      setError('获取游记时发生错误: ' + (err.message || '未知错误'));
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      setIsSearching(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    await fetchNotes(1, true, searchKeyword);
  }, [searchKeyword]);

  const loadMore = useCallback(async () => {
    if (!loadingMore && hasMore) {
      await fetchNotes(currentPage + 1, false, searchKeyword);
    }
  }, [loadingMore, hasMore, currentPage, searchKeyword]);

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    setCurrentPage(1);
    setHasMore(true);
    await fetchNotes(1, true, searchKeyword);
  }, [searchKeyword]);

  const clearSearch = useCallback(async () => {
    setSearchKeyword('');
    setIsSearching(true);
    setCurrentPage(1);
    setHasMore(true);
    await fetchNotes(1, true, '');
  }, []);

  useEffect(() => {
    fetchNotes(1, true, '');
  }, []);

  const handleNotePress = (id: number) => {
    router.push(`/profile/note-detail?id=${id}`);
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={tw`py-4 items-center`}>
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text style={tw`mt-2 text-gray-500 text-sm`}>加载更多...</Text>
      </View>
    );
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
          onPress={() => fetchNotes(1, true, searchKeyword)}
        >
          <Ionicons name="refresh" size={20} color="white" style={tw`mr-2`} />
          <Text style={tw`text-white font-medium`}>重新加载</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-gray-100`}>
      <View style={tw`p-4 border-b border-gray-200 bg-white`}>
        <View style={tw`flex-row items-center mb-3`}>
          <Text style={tw`text-xl font-bold text-gray-900 flex-1`}>发现游记</Text>
          <TouchableOpacity 
            style={tw`p-2`}
            onPress={() => router.push('/(tabs)/post')}
          >
            <Ionicons name="add-circle" size={28} color="#3b82f6" />
          </TouchableOpacity>
        </View>
        
        {/* 搜索框 */}
        <View style={tw`flex-row items-center bg-gray-100 rounded-full px-4 py-2`}>
          <Ionicons name="search" size={20} color="#6b7280" style={tw`mr-2`} />
          <TextInput
            style={tw`flex-1 text-base text-gray-900`}
            placeholder="搜索游记内容..."
            placeholderTextColor="#9ca3af"
            value={searchKeyword}
            onChangeText={setSearchKeyword}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchKeyword.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={tw`ml-2`}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* 搜索按钮 */}
        {searchKeyword.length > 0 && (
          <TouchableOpacity
            style={tw`mt-3 bg-blue-500 rounded-full py-2 flex-row items-center justify-center`}
            onPress={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="white" style={tw`mr-2`} />
            ) : (
              <Ionicons name="search" size={16} color="white" style={tw`mr-2`} />
            )}
            <Text style={tw`text-white font-medium`}>
              {isSearching ? '搜索中...' : '搜索'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={tw`justify-between px-3`}
        contentContainerStyle={notes.length === 0 ? tw`flex-1` : tw`pb-4`}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={tw`w-[48%] mb-4 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100`}
            onPress={() => handleNotePress(item.id)}
          >
            <View style={tw`relative`}>
              {item.attachments && item.attachments.length > 0 ? (
                <ExpoImage
                  source={{ uri: item.attachments[0].value }}
                  style={tw`w-full h-40`}
                  contentFit="cover"
                  transition={300}
                />
              ) : (
                <View style={tw`w-full h-40 bg-gray-100 justify-center items-center`}>
                  <Ionicons name="image-outline" size={40} color="#d1d5db" />
                </View>
              )}
            </View>
            <View style={tw`p-3`}>
              {/* 标题 - 显示两行，超出用省略号 */}
              <Text 
                style={tw`text-base font-semibold text-gray-900 mb-1`}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.title || '暂无标题'}
              </Text>
              
              {/* 用户信息和日期 - 分两行显示 */}
              <View style={tw`mt-2`}>
                {/* 用户名一行 */}
                <View style={tw`flex-row items-center mb-1`}>
                  <View style={tw`w-5 h-5 rounded-full bg-gray-300 mr-2 justify-center items-center`}>
                    <ExpoImage
                      source={{ uri: getAvatar(item) }}
                      style={tw`w-5 h-5 rounded-full`}
                      contentFit="cover"
                    />
                  </View>
                  <Text 
                    style={tw`text-xs text-gray-500 flex-1`} 
                    numberOfLines={1} 
                    ellipsizeMode="tail"
                  >
                    {item.username || '未知用户'}
                  </Text>
                </View>
                
                {/* 日期一行 */}
                <Text style={tw`text-xs text-gray-400 text-right`}>
                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : '未知日期'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={tw`flex-1 justify-center items-center p-6 bg-white`}>
            <Ionicons name="map-outline" size={64} color="#d1d5db" style={tw`mb-4`} />
            <Text style={tw`text-gray-600 text-lg mb-1`}>
              {searchKeyword ? '未找到相关游记' : '暂无游记'}
            </Text>
            <Text style={tw`text-gray-500 text-sm text-center px-8`}>
              {searchKeyword 
                ? `没有找到包含"${searchKeyword}"的游记，试试其他关键词吧`
                : '还没有审批通过的游记，快来发布你的第一篇游记吧'
              }
            </Text>
            {!searchKeyword && (
              <TouchableOpacity
                style={tw`mt-6 px-6 py-3 bg-blue-500 rounded-full`}
                onPress={() => router.push('/(tabs)/post')}
              >
                <Text style={tw`text-white font-medium`}>发布游记</Text>
              </TouchableOpacity>
            )}
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