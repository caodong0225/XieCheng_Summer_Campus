import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';
import { getNoteList } from '../../api/note';

interface Attachment {
  id: number;
  note_id: number;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
  weight: number;
}

interface Note {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  description: string;
  created_by: number;
  username: string;
  email: string;
  reason: string;
  status: 'checking' | 'approved' | 'rejected';
  attachments: Attachment[];
}

interface NoteListResponse {
  code: number;
  message: string;
  data: {
    pageNum: number;
    pageSize: number;
    total: number;
    pages: number;
    list: Note[];
  };
}

export default function MyTravelsScreen() {
  const router = useRouter();
  const [travels, setTravels] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTitle, setSearchTitle] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Note['status'] | ''>('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const pageSize = 12;

  const fetchTravels = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        pageNum: page,
        pageSize,
      };

      if (searchTitle) {
        params.title = searchTitle;
      }

      if (selectedStatus) {
        params.status = selectedStatus;
      }

      const response = await getNoteList(
        params,
        { created_at: 'desc' },
        {}
      );
      
      if (response.success && response.list) {
        setTravels(response.list);
      } else {
        setError('获取游记列表失败');
      }
    } catch (err) {
      setError('获取游记列表时发生错误');
      console.error('Error fetching travels:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await fetchTravels();
  }, [searchTitle, selectedStatus]);

  useEffect(() => {
    fetchTravels();
  }, [selectedStatus, searchTitle]);

  const handleSearch = () => {
    setSearchTitle(searchInput);
    setPage(1);
  };

  const handleReset = () => {
    setSearchInput('');
    setSearchTitle('');
    setSelectedStatus('');
    setPage(1);
  };

  const getStatusText = (status: Note['status']) => {
    const statusMap = {
      checking: '审核中',
      approved: '已通过',
      rejected: '已拒绝'
    };
    return statusMap[status];
  };

  const getStatusColor = (status: Note['status']) => {
    const colorMap = {
      checking: 'text-yellow-500',
      approved: 'text-green-500',
      rejected: 'text-red-500'
    };
    return colorMap[status];
  };

  const handleNotePress = (id: number) => {
    router.push(`/profile/note-detail?id=${id}`);
  };

  const renderFilterBar = () => (
    <View style={tw`p-4 bg-white border-b border-gray-200`}>
      <View style={tw`flex-row gap-2 mb-2`}>
        <View style={tw`flex-1 flex-row items-center border border-gray-300 rounded-lg px-3 bg-gray-50`}>
          <Ionicons name="search" size={20} color="#666" style={tw`mr-2`} />
          <TextInput
            style={tw`flex-1 py-2 text-base`}
            placeholder="搜索标题"
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
      <View style={tw`flex-row gap-2`}>
        <TouchableOpacity
          style={tw`px-3 py-1 rounded-full ${selectedStatus === '' ? 'bg-blue-500' : 'bg-gray-200'}`}
          onPress={() => setSelectedStatus('')}
        >
          <Text style={tw`${selectedStatus === '' ? 'text-white' : 'text-gray-700'}`}>全部</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={tw`px-3 py-1 rounded-full ${selectedStatus === 'checking' ? 'bg-yellow-500' : 'bg-gray-200'}`}
          onPress={() => setSelectedStatus('checking')}
        >
          <Text style={tw`${selectedStatus === 'checking' ? 'text-white' : 'text-gray-700'}`}>审核中</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={tw`px-3 py-1 rounded-full ${selectedStatus === 'approved' ? 'bg-green-500' : 'bg-gray-200'}`}
          onPress={() => setSelectedStatus('approved')}
        >
          <Text style={tw`${selectedStatus === 'approved' ? 'text-white' : 'text-gray-700'}`}>已通过</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={tw`px-3 py-1 rounded-full ${selectedStatus === 'rejected' ? 'bg-red-500' : 'bg-gray-200'}`}
          onPress={() => setSelectedStatus('rejected')}
        >
          <Text style={tw`${selectedStatus === 'rejected' ? 'text-white' : 'text-gray-700'}`}>已拒绝</Text>
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
          onPress={fetchTravels}
        >
          <Text style={tw`text-white`}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-white`}>
      <View style={tw`flex-row items-center p-4 border-b border-gray-200 bg-white`}>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/profile')} 
          style={tw`mr-4 p-1`}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={tw`text-lg font-semibold flex-1`}>我的游记</Text>
      </View>

      {renderFilterBar()}
      <FlatList
        data={travels}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={tw`p-4 border-b border-gray-200 bg-white`}
            onPress={() => handleNotePress(item.id)}
          >
            {item.attachments && item.attachments.length > 0 && (
              <ExpoImage
                source={{ uri: item.attachments[0].value }}
                style={tw`w-full h-48 rounded-lg mb-2`}
                contentFit="cover"
              />
            )}
            <View style={tw`flex-row justify-between items-center`}>
              <Text style={tw`text-lg font-semibold flex-1 mr-2`}>{item.title}</Text>
              <View style={tw`flex-row items-center`}>
                <Text style={tw`${getStatusColor(item.status)} text-sm mr-2`}>
                  {getStatusText(item.status)}
                </Text>
                {(item.status === 'checking' || item.status === 'rejected') && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push(`/profile/edit-note?id=${item.id}`);
                    }}
                    style={tw`p-1`}
                  >
                    <Ionicons name="create-outline" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Text style={tw`text-gray-400 text-sm mt-2`}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
            {item.status === 'rejected' && item.reason && (
              <View style={tw`mt-2 p-2 bg-red-50 border border-red-200 rounded-lg`}>
                <Text style={tw`text-red-600 text-sm font-medium`}>拒绝原因：</Text>
                <Text style={tw`text-red-500 text-sm mt-1`}>{item.reason}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={tw`flex-1 justify-center items-center p-4 bg-white`}>
            <Text style={tw`text-gray-500`}>没有找到相关游记</Text>
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
      />
    </View>
  );
}