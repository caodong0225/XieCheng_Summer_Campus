import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user: {
    id: number;
    username: string;
    avatar?: string;
  };
}

export default function CommentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchComments();
  }, [id]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      // ģ�����ݣ������ԽӺ��
      setTimeout(() => {
        setComments([
          {
            id: 1,
            content: "�羰�治���´���ҲҪȥ��",
            created_at: new Date().toISOString(),
            user: {
              id: 1,
              username: "���д���",
            }
          },
          {
            id: 2,
            content: "��Ƭ�ĵ���ã���������ʲô����ĵģ�",
            created_at: new Date(Date.now() - 3600000).toISOString(),
            user: {
              id: 2,
              username: "��Ӱ������",
            }
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('��ȡ����ʱ��������');
      console.error('Error fetching comments:', err);
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    // ģ���ύ���ۣ������ԽӺ��
    const newComment: Comment = {
      id: Date.now(),
      content: commentText.trim(),
      created_at: new Date().toISOString(),
      user: {
        id: 1, // ģ�⵱ǰ�û�
        username: "��",
      }
    };
    setComments(prev => [newComment, ...prev]);
    setCommentText('');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '�ո�';
    if (diffMins < 60) return `${diffMins}����ǰ`;
    if (diffHours < 24) return `${diffHours}Сʱǰ`;
    if (diffDays < 7) return `${diffDays}��ǰ`;
    
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={tw`mt-2 text-gray-600`}>������...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tw`flex-1 bg-white`}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* ���������� */}
      <View style={tw`flex-row items-center px-4 py-3 border-b border-gray-200 bg-white`}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={tw`mr-4 p-1`}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={tw`text-lg font-semibold flex-1`}>���� {comments.length}</Text>
      </View>

      <ScrollView 
        style={tw`flex-1`} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-4`}
      >
        {error ? (
          <View style={tw`p-4 items-center`}>
            <Text style={tw`text-red-500`}>{error}</Text>
            <TouchableOpacity 
              style={tw`mt-4 px-6 py-2 bg-blue-500 rounded-full`}
              onPress={fetchComments}
            >
              <Text style={tw`text-white font-medium`}>����</Text>
            </TouchableOpacity>
          </View>
        ) : comments.length === 0 ? (
          <View style={tw`p-8 items-center justify-center`}>
            <Ionicons name="chatbubble-outline" size={48} color="#d1d5db" />
            <Text style={tw`mt-4 text-gray-500 text-center`}>��������</Text>
            <Text style={tw`mt-2 text-gray-400 text-sm text-center`}>�������һ�����۰�</Text>
          </View>
        ) : (
          comments.map(comment => (
            <View key={comment.id} style={tw`px-4 py-3 border-b border-gray-100`}>
              <View style={tw`flex-row items-start`}>
                <View style={tw`w-10 h-10 rounded-full bg-gray-200 mr-3 overflow-hidden`}>
                  <Image
                    source={{ uri: `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user.username}` }}
                    style={tw`w-full h-full`}
                    contentFit="cover"
                  />
                </View>
                <View style={tw`flex-1`}>
                  <View style={tw`flex-row items-center mb-1`}>
                    <Text style={tw`font-medium text-base text-gray-900`}>
                      {comment.user.username}
                    </Text>
                    <Text style={tw`text-gray-400 text-sm ml-2`}>
                      {formatTime(comment.created_at)}
                    </Text>
                  </View>
                  <Text style={tw`text-gray-700 leading-5`}>{comment.content}</Text>
                  <View style={tw`flex-row items-center mt-2`}>
                    <TouchableOpacity style={tw`flex-row items-center mr-4`}>
                      <Ionicons name="heart-outline" size={16} color="#666" />
                      <Text style={tw`text-gray-500 text-sm ml-1`}>����</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={tw`flex-row items-center`}>
                      <Ionicons name="chatbubble-outline" size={16} color="#666" />
                      <Text style={tw`text-gray-500 text-sm ml-1`}>�ظ�</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ��������� */}
      <View style={tw`px-4 py-3 border-t border-gray-200 bg-white`}>
        <View style={tw`flex-row items-end`}>
          <View style={tw`flex-1 bg-gray-100 rounded-2xl px-4 py-2 mr-2 min-h-[40px] max-h-[100px]`}>
            <TextInput
              style={tw`text-base text-gray-900`}
              placeholder="д���������..."
              placeholderTextColor="#9ca3af"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={200}
            />
          </View>
          <TouchableOpacity
            style={tw`px-4 py-2 bg-blue-500 rounded-full ${!commentText.trim() ? 'opacity-50' : ''}`}
            onPress={handleSubmitComment}
            disabled={!commentText.trim()}
          >
            <Text style={tw`text-white font-medium`}>����</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
} 