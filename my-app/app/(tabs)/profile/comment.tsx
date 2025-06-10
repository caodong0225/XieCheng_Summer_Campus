import { getUser } from '@/store/token';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import tw from 'twrnc';
import { getNoteReplyByNoteId } from '../../api/note'; // 新增点赞API
import { likeReply } from '../../api/reply';
import { likeThread } from '../../api/thread';
import { getAvatar } from '../../utils/string';

interface Reply {
  id: number;
  user_id: number;
  thread_id: number;
  reply_id: number | null;
  content: string;
  created_at: string;
  updated_at: string;
  username: string;
  email: string;
  child_replies_count: number;
  reactions: Record<string, any>;
  children?: Reply[]; // 新增子回复字段
  liked?: boolean; // 新增点赞状态
}

interface Comment {
  id: number;
  content: string;
  user_id: number;
  note_id: number;
  created_at: string;
  updated_at: string;
  status: string;
  weight: number;
  username: string;
  email: string;
  reply_count: number;
  total_reactions: number;
  reactions: Record<string, any>;
  replies: Reply[];
  liked?: boolean; // 新增点赞状态
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
      const response = await getNoteReplyByNoteId(id);
      const user = await getUser();
      if (response.code === 200) {
        // 将扁平回复列表转换为树形结构
        const commentsWithTree = (response.data || []).map((comment: any) => {
          return {
            ...comment,
            liked: comment.reactions?.['💖']?.users.includes(user?.id),
            replies: buildReplyTree(comment.replies || [])
          };
        });
        setComments(commentsWithTree);
      } else {
        setError(response.message || '获取评论失败');
      }
    } catch (err) {
      setError('获取评论时发生错误');
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  // 构建树形回复结构
  const buildReplyTree = (replies: Reply[]): Reply[] => {
    const replyMap: Record<number, Reply> = {};
    const replyTree: Reply[] = [];
    
    // 创建回复映射
    replies.forEach(reply => {
      replyMap[reply.id] = {
        ...reply,
        children: [],
        liked: false
      };
    });
    
    // 构建树形结构
    replies.forEach(reply => {
      if (reply.reply_id && replyMap[reply.reply_id]) {
        replyMap[reply.reply_id].children?.push(replyMap[reply.id]);
      } else {
        replyTree.push(replyMap[reply.id]);
      }
    });
    
    return replyTree;
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    
    // TODO: 实现提交评论的API调用
    Toast.show({
      type: 'info',
      text1: '评论功能开发中',
      text2: '请稍后再试',
    });
    setCommentText('');
  };

  // 点赞评论
  const handleLikeComment = async (commentId: number) => {
    try {
      // 调用点赞API
      const response = await likeThread(commentId);
      
      if (response.code === 200) {
        // 更新UI状态
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            const isLiked = !comment.liked;
            const increment = isLiked ? 1 : -1;
            
            return {
              ...comment,
              liked: isLiked,
              total_reactions: comment.total_reactions + increment
            };
          }
          return comment;
        }));
      } else {
        Toast.show({
          type: 'error',
          text1: '操作失败',
          text2: response.message || '请稍后再试',
        });
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: '操作失败',
        text2: '网络错误，请检查连接',
      });
      console.error('Error liking comment:', err);
    }
  };

  // 点赞回复
  const handleLikeReply = async (replyId: number) => {
    try {
      // 调用点赞API
      const response = await likeReply(replyId);
      
      if (response.code === 200) {
        // 更新UI状态
        setComments(prev => prev.map(comment => {
          // 递归查找并更新回复
          const updateReplies = (replies: Reply[]): Reply[] => {
            return replies.map(reply => {
              if (reply.id === replyId) {
                const isLiked = !reply.liked;
                return {
                  ...reply,
                  liked: isLiked
                };
              }
              
              if (reply.children && reply.children.length > 0) {
                return {
                  ...reply,
                  children: updateReplies(reply.children)
                };
              }
              
              return reply;
            });
          };
          
          return {
            ...comment,
            replies: updateReplies(comment.replies)
          };
        }));
      } else {
        Toast.show({
          type: 'error',
          text1: '操作失败',
          text2: response.message || '请稍后再试',
        });
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: '操作失败',
        text2: '网络错误，请检查连接',
      });
      console.error('Error liking reply:', err);
    }
  };

  const handleReply = (commentId: number) => {
    // TODO: 实现回复功能
    Toast.show({
      type: 'info',
      text1: '回复功能开发中',
      text2: '请稍后再试',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderReactions = (reactions: Record<string, any>) => {
    if (!reactions || Object.keys(reactions).length === 0) return null;
    
    return Object.entries(reactions).map(([emoji, data]: [string, any]) => (
      <View key={emoji} style={tw`flex-row items-center mr-2`}>
        <Text style={tw`text-sm`}>{emoji}</Text>
        <Text style={tw`text-xs text-gray-500 ml-1`}>{data.count}</Text>
      </View>
    ));
  };

  // 递归渲染回复树
  const renderReplyTree = (replies: Reply[], depth = 0) => {
    if (!replies || replies.length === 0) return null;
    
    // 限制最大嵌套深度
    const maxDepth = 4;
    if (depth >= maxDepth) return null;

    return (
      <View style={tw`ml-${depth > 0 ? 6 : 8} mt-2 border-l-2 border-gray-100 pl-3`}>
        {replies.map((reply) => (
          <View key={reply.id} style={tw`mb-3`}>
            <View style={tw`flex-row items-start`}>
              <View style={tw`w-8 h-8 rounded-full bg-gray-200 mr-2 overflow-hidden`}>
                <Image
                  source={{ uri: getAvatar({ email: reply.email }) }}
                  style={tw`w-full h-full`}
                  contentFit="cover"
                />
              </View>
              <View style={tw`flex-1`}>
                <View style={tw`flex-row items-center mb-1`}>
                  <Text style={tw`font-medium text-sm text-gray-900`}>
                    {reply.username}
                  </Text>
                  <Text style={tw`text-gray-400 text-xs ml-2`}>
                    {formatTime(reply.created_at)}
                  </Text>
                </View>
                <Text style={tw`text-gray-700 leading-4 text-sm`}>{reply.content}</Text>
                <View style={tw`flex-row items-center mt-1`}>
                  <TouchableOpacity 
                    style={tw`flex-row items-center mr-3`}
                    onPress={() => handleLikeReply(reply.id)}
                  >
                    <Ionicons 
                      name={reply.liked ? "heart" : "heart-outline"} 
                      size={14} 
                      color={reply.liked ? "#ef4444" : "#666"} 
                    />
                    <Text style={tw`text-gray-500 text-xs ml-1`}>点赞</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={tw`flex-row items-center`}
                    onPress={() => handleReply(reply.id)}
                  >
                    <Ionicons name="chatbubble-outline" size={14} color="#666" />
                    <Text style={tw`text-gray-500 text-xs ml-1`}>回复</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            {/* 递归渲染子回复 */}
            {reply.children && reply.children.length > 0 && renderReplyTree(reply.children, depth + 1)}
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={tw`mt-2 text-gray-600`}>加载中...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tw`flex-1 bg-white`}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* 顶部导航栏 */}
      <View style={tw`flex-row items-center px-4 py-3 border-b border-gray-200 bg-white`}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={tw`mr-4 p-1`}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={tw`text-lg font-semibold flex-1`}>评论 {comments.length}</Text>
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
              <Text style={tw`text-white font-medium`}>重试</Text>
            </TouchableOpacity>
          </View>
        ) : comments.length === 0 ? (
          <View style={tw`p-8 items-center justify-center`}>
            <Ionicons name="chatbubble-outline" size={48} color="#d1d5db" />
            <Text style={tw`mt-4 text-gray-500 text-center`}>暂无评论</Text>
            <Text style={tw`mt-2 text-gray-400 text-sm text-center`}>来发表第一条评论吧</Text>
          </View>
        ) : (
          comments.map(comment => (
            <View key={comment.id} style={tw`px-4 py-3 border-b border-gray-100`}>
              <View style={tw`flex-row items-start`}>
                <View style={tw`w-10 h-10 rounded-full bg-gray-200 mr-3 overflow-hidden`}>
                  <Image
                    source={{ uri: getAvatar({ email: comment.email }) }}
                    style={tw`w-full h-full`}
                    contentFit="cover"
                  />
                </View>
                <View style={tw`flex-1`}>
                  <View style={tw`flex-row items-center mb-1`}>
                    <Text style={tw`font-medium text-base text-gray-900`}>
                      {comment.username}
                    </Text>
                    <Text style={tw`text-gray-400 text-sm ml-2`}>
                      {formatTime(comment.created_at)}
                    </Text>
                  </View>
                  <Text style={tw`text-gray-700 leading-5`}>{comment.content}</Text>
                  
                  <View style={tw`flex-row items-center mt-2`}>
                    <TouchableOpacity 
                      style={tw`flex-row items-center mr-4`}
                      onPress={() => handleLikeComment(comment.id)}
                    >
                      <Ionicons 
                        name={comment.liked ? "heart" : "heart-outline"} 
                        size={16} 
                        color={comment.liked ? "#ef4444" : "#666"} 
                      />
                      <Text style={tw`text-gray-500 text-sm ml-1`}>
                        {comment.total_reactions > 0 ? comment.total_reactions : '点赞'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={tw`flex-row items-center mr-4`}
                      onPress={() => handleReply(comment.id)}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color="#666" />
                      <Text style={tw`text-gray-500 text-sm ml-1`}>
                        {comment.reply_count > 0 ? comment.reply_count : '回复'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* 回复列表 - 使用树形结构 */}
                  {renderReplyTree(comment.replies)}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 底部评论输入 */}
      <View style={tw`px-4 py-3 border-t border-gray-200 bg-white`}>
        <View style={tw`flex-row items-end`}>
          <View style={tw`flex-1 bg-gray-100 rounded-2xl px-4 py-2 mr-2 min-h-[40px] max-h-[100px]`}>
            <TextInput
              style={tw`text-base text-gray-900`}
              placeholder="写下你的评论..."
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
            <Text style={tw`text-white font-medium`}>发送</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}