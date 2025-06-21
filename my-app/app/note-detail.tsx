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
      console.error('��ȡ�μ�����ʧ�ܣ�', error);
      Toast.show({
        type: 'error',
        text1: '��ȡʧ��',
        text2: '��ȡ�μ�����ʧ�ܣ�������'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={tw`flex-1 bg-white justify-center items-center`}>
        <Text style={tw`text-gray-600`}>������...</Text>
      </View>
    );
  }

  if (!noteDetail) {
    return (
      <View style={tw`flex-1 bg-white justify-center items-center`}>
        <Text style={tw`text-gray-600`}>�μǲ�����</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={tw`flex-1 bg-white`}>
        {/* ͷ������ */}
        <View style={tw`px-4 py-3 border-b border-gray-100 flex-row items-center`}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={tw`mr-3`}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={tw`text-lg font-bold text-gray-800 flex-1`}>�μ�����</Text>
        </View>

        {/* �μ����� */}
        <View style={tw`p-4`}>
          {/* ���� */}
          <Text style={tw`text-2xl font-bold text-gray-800 mb-3`}>
            {noteDetail.title}
          </Text>

          {/* ������Ϣ */}
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

          {/* ͼƬ/��Ƶ */}
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

          {/* �������� */}
          <Text style={tw`text-base text-gray-700 leading-6`}>
            {noteDetail.description}
          </Text>
        </View>
      </ScrollView>
      <Toast />
    </>
  );
} 