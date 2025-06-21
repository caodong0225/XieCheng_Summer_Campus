import { getAvatar } from '@/utils/string';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import tw from 'twrnc';
import { getNoteDetail } from './api/note';

interface NoteDetail {
  id: number;
  title: string;
  description: string;
  attachments: Array<{
    id: number;
    type: string;
    link: string;
    weight: number;
  }>;
  created_at: string;
  user: {
    id: number;
    username: string;
    email?: string;
  };
}

export default function NoteDetailScreen() {
  const router = useRouter();
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const [noteDetail, setNoteDetail] = useState<NoteDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (noteId) {
      fetchNoteDetail();
    }
  }, [noteId]);

  const fetchNoteDetail = async () => {
    try {
      setLoading(true);
      const result = await getNoteDetail(noteId);
      if (result) {
        setNoteDetail(result);
      }
    } catch (error) {
      console.error('获取游记详情失败：', error);
      Toast.show({
        type: 'error',
        text1: '获取失败',
        text2: '获取游记详情失败，请重试'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={tw`flex-1 bg-white justify-center items-center`}>
        <Text style={tw`text-gray-600`}>加载中...</Text>
      </View>
    );
  }

  if (!noteDetail) {
    return (
      <View style={tw`flex-1 bg-white justify-center items-center`}>
        <Text style={tw`text-gray-600`}>游记不存在</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={tw`flex-1 bg-white`}>
        {/* 头部导航 */}
        <View style={tw`px-4 py-3 border-b border-gray-100 flex-row items-center`}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={tw`mr-3`}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={tw`text-lg font-bold text-gray-800 flex-1`}>游记详情</Text>
        </View>

        {/* 游记内容 */}
        <View style={tw`p-4`}>
          {/* 标题 */}
          <Text style={tw`text-2xl font-bold text-gray-800 mb-3`}>
            {noteDetail.title}
          </Text>

          {/* 作者信息 */}
          <View style={tw`flex-row items-center mb-4`}>
              <Image
              source={{ uri: getAvatar(noteDetail.user) }}
              style={tw`w-16 h-16 rounded-full mr-4`}
              />
            <Text style={tw`text-gray-600`}>{noteDetail.user.username}</Text>
            <Text style={tw`text-gray-400 ml-2`}>
              {new Date(noteDetail.created_at).toLocaleDateString()}
            </Text>
          </View>

          {/* 图片/视频 */}
          {noteDetail.attachments && noteDetail.attachments.length > 0 && (
            <View style={tw`mb-4`}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={tw`mb-2`}
              >
                {noteDetail.attachments
                  .sort((a, b) => a.weight - b.weight)
                  .map((attachment, index) => (
                    <View key={attachment.id} style={tw`mr-2`}>
                      <Image
                        source={{ uri: attachment.link }}
                        style={tw`w-32 h-32 rounded-lg`}
                        contentFit="cover"
                      />
                    </View>
                  ))}
              </ScrollView>
            </View>
          )}

          {/* 描述内容 */}
          <Text style={tw`text-base text-gray-700 leading-6`}>
            {noteDetail.description}
          </Text>
        </View>
      </ScrollView>
      <Toast />
    </>
  );
} 