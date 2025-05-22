import { getUserById } from '@/api/user';
import { getUser } from '@/store/token';
import { getAvatar } from '@/utils/string';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import tw from 'twrnc';
import { collectionNote, getNoteDetail, likeNote } from '../../api/note';
import ImageViewer from '../../components/ImageViewer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Attachment {
  id: number;
  note_id: number;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
  weight: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
  role: string;
}

interface NoteDetail {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  del_flag: number;
  created_by: number;
  description: string;
  user: User;
  attachments: Attachment[];
  isFavorite: boolean;
  isCollection: boolean;
  likes: number;
  collections: number;
  comments: number;
}

export default function NoteDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [note, setNote] = useState<NoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCollection, setIsCollection] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  const loadUserInfo = async () => {
    try {
      const user = await getUser();
      if (user) {
        const userData = await getUserById(user.id);
        setUserInfo(userData);
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
      Toast.show({
        type: 'error',
        text1: '加载用户信息失败',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNoteDetail();
    loadUserInfo();
  }, [id]);

  const fetchNoteDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getNoteDetail(id);
      if (response.code === 200) {
        setNote(response.data);
        setIsFavorite(response.data.isFavorite);
        setIsCollection(response.data.isCollection);
      } else {
        setError(response.message || '获取游记详情失败');
      }
    } catch (err) {
      setError('获取游记详情时发生错误');
      console.error('Error fetching note detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageViewer(true);
  };

  const handleFavorite = async () => {
    if (!note?.id) return;
    try {
      const response = await likeNote(note.id);
      if (response.code === 200) {
        setIsFavorite(response.data.favorited);
        if (note) {
          setNote({
            ...note,
            likes: response.data.favorited ? note.likes + 1 : note.likes - 1
          });
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleCollection = async () => {
    if (!note?.id) return;
    try {
      const response = await collectionNote(note.id);
      if (response.code === 200) {
        setIsCollection(response.data.collected);
        if (note) {
          setNote({
            ...note,
            collections: response.data.collected ? note.collections + 1 : note.collections - 1
          });
        }
      }
    } catch (err) {
      console.error('Error toggling collection:', err);
    }
  };

  const handleComment = () => {
    if (note?.id) {
      router.push({
        pathname: '/(tabs)/profile/comment',
        params: { id: note.id }
      });
    }
  };

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={[tw`mt-2 text-gray-600`, { fontFamily: 'System' }]}>Loading...</Text>
      </View>
    );
  }

  if (error || !note) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <Text style={tw`text-red-500 text-center px-4`}>{error || '游记不存在'}</Text>
        <TouchableOpacity 
          style={tw`mt-4 px-6 py-2 bg-blue-500 rounded-full`}
          onPress={fetchNoteDetail}
        >
          <Text style={tw`text-white font-medium`}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-white`}>
      {/* 顶部导航栏 */}
      <View style={tw`flex-row items-center p-4 border-b border-gray-200 bg-white`}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={tw`mr-4 p-1`}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={tw`text-lg font-semibold flex-1`} numberOfLines={1}>{note.title}</Text>
        <TouchableOpacity style={tw`p-1`}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        {/* 作者信息 */}
        <View style={tw`p-4 flex-row items-center bg-white`}>
          <View style={tw`w-12 h-12 rounded-full bg-gray-200 mr-3 overflow-hidden`}>
            <Image
              source={{ uri: getAvatar(userInfo) }}
              style={tw`w-full h-full`}
              contentFit="cover"
            />
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`font-medium text-base`}>{note.user.username}</Text>
            <Text style={tw`text-gray-500 text-sm`}>
              {new Date(note.created_at).toLocaleString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>

        {/* 图片滑动区域 */}
        {note.attachments && note.attachments.length > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={tw`w-full`}
          >
            {note.attachments.map((attachment, index) => (
              <TouchableOpacity
                key={attachment.id}
                onPress={() => handleImagePress(index)}
                style={tw`w-[${SCREEN_WIDTH}px]`}
              >
                <Image
                  source={{ uri: attachment.value }}
                  style={tw`w-full h-80`}
                  contentFit="cover"
                  transition={200}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* 内容区域 */}
        <View style={tw`p-4 bg-white`}>
          <Text style={tw`text-xl font-semibold mb-3`}>{note.title}</Text>
          <Text style={tw`text-gray-700 leading-6 text-base`}>{note.description}</Text>
        </View>
      </ScrollView>

      {/* 底部互动栏 */}
      <View style={tw`flex-row items-center border-t border-gray-200 p-4 bg-white`}>
        <TouchableOpacity 
          style={tw`flex-1 items-center`}
          onPress={handleFavorite}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? "#ff4d4f" : "#666"} 
          />
          <Text style={tw`mt-1 text-sm ${isFavorite ? 'text-red-500' : 'text-gray-600'}`}>
            {note.likes}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={tw`flex-1 items-center`}
          onPress={handleCollection}
        >
          <Ionicons 
            name={isCollection ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={isCollection ? "#1890ff" : "#666"} 
          />
          <Text style={tw`mt-1 text-sm ${isCollection ? 'text-blue-500' : 'text-gray-600'}`}>
            {note.collections}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={tw`flex-1 items-center`}
          onPress={handleComment}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#666" />
          <Text style={tw`mt-1 text-sm text-gray-600`}>{note.comments}</Text>
        </TouchableOpacity>

      </View>

      {/* 图片查看器 */}
      {showImageViewer && note.attachments && (
        <ImageViewer
          images={note.attachments.map(att => ({
            id: att.id.toString(),
            uri: att.value,
            type: 'image',
            weight: att.weight
          }))}
          initialIndex={selectedImageIndex}
          onClose={() => setShowImageViewer(false)}
        />
      )}
    </View>
  );
} 