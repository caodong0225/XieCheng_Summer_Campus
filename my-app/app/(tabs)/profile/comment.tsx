import { getUser } from '@/store/token';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import tw from 'twrnc';
import { commentNote, deleteComment, getNoteReplyByNoteId } from '../../api/note';
import { createReply, deleteReply, likeReply } from '../../api/reply';
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
  children?: Reply[];
  liked?: boolean;
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
  liked?: boolean;
}

export default function CommentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ type: 'comment' | 'reply', id: number, username: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    fetchComments();
    getCurrentUser();
  }, [id]);

  const getCurrentUser = async () => {
    try {
      const user = await getUser();
      setCurrentUserId(user?.id || null);
    } catch (err) {
      console.error('Error getting current user:', err);
    }
  };

  const fetchComments = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const response = await getNoteReplyByNoteId(id);
      const user = await getUser();
      
      if (response.code === 200) {
        // 将扁平回复列表转换为树形结构，并正确初始化点赞状态
        const commentsWithTree = (response.data || []).map((comment: any) => {
          return {
            ...comment,
            liked: comment.reactions?.['💖']?.users?.includes(user?.id) || false,
            replies: buildReplyTree(comment.replies || [], user?.id)
          };
        });
        setComments(commentsWithTree);
        console.log('评论数据已更新:', commentsWithTree.length, '条评论');
      } else {
        setError(response.message || '获取评论失败');
      }
    } catch (err) {
      setError('获取评论时发生错误');
      console.error('Error fetching comments:', err);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  // 构建树形回复结构，并初始化点赞状态
  const buildReplyTree = (replies: Reply[], userId?: number): Reply[] => {
    const replyMap: Record<number, Reply> = {};
    const replyTree: Reply[] = [];
    
    // 创建回复映射，并初始化点赞状态
    replies.forEach(reply => {
      replyMap[reply.id] = {
        ...reply,
        children: [],
        liked: reply.reactions?.['💖']?.users?.includes(userId) || false
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

  // 在组件中添加这个函数
  const getThreadIdForReply = (replyId: number): string => {
    // 遍历所有评论和回复，找到该回复所属的thread_id
    for (const comment of comments) {
      // 检查一级评论的回复
      const findInReplies = (replies: Reply[]): number | null => {
        for (const reply of replies) {
          if (reply.id === replyId) {
            return comment.id; // 找到匹配的回复，返回所属的thread_id
          }
          if (reply.children && reply.children.length > 0) {
            const found = findInReplies(reply.children);
            if (found) return found;
          }
        }
        return null;
      };
      
      const threadId = findInReplies(comment.replies);
      if (threadId) {
        return threadId.toString();
      }
    }
    
    // 如果找不到，默认使用第一个评论ID（或根据您的业务逻辑处理）
    return comments.length > 0 ? comments[0].id.toString() : '0';
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      setSubmitting(true);
      const user = await getUser();
      
      if (replyTo) {
        // 确定thread_id
        let threadId: string;
        
        if (replyTo.type === 'comment') {
          // 回复评论：thread_id就是该评论ID
          threadId = replyTo.id.toString();
        } else {
          // 回复回复：查找所属的thread_id
          threadId = getThreadIdForReply(replyTo.id);
        }
        
        const replyData = {
          content: commentText,
          thread_id: threadId,
          reply_id: replyTo.type === 'reply' ? replyTo.id.toString() : undefined
        };
        
        const response = await createReply(replyData);
        
        if (response.code === 200) {
          Toast.show({
            type: 'success',
            text1: '回复成功',
            text2: '回复已发布',
          });
          setCommentText('');
          setReplyTo(null);
          // 重载数据
          fetchComments(true);
        } else {
          Toast.show({
            type: 'error',
            text1: '回复失败',
            text2: response.message || '请稍后再试',
          });
        }
      } else {
        // 评论游记（创建一级评论）
        const commentData = {
          note_id: id,
          content: commentText
        };
        
        const response = await commentNote(commentData);
        
        if (response.code === 200) {
          Toast.show({
            type: 'success',
            text1: '评论成功',
            text2: '评论已发布',
          });
          setCommentText('');
          await fetchComments(false);
        } else {
          Toast.show({
            type: 'error',
            text1: '评论失败',
            text2: response.message || '请稍后再试',
          });
        }
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: '操作失败',
        text2: '网络错误，请检查连接',
      });
      console.error('Error submitting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // 点赞评论
  const handleLikeComment = async (commentId: number) => {
    try {
      const response = await likeThread(commentId);
      
      if (response.code === 200) {
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            // 根据当前点赞状态计算新的点赞数量
            const currentLiked = comment.liked;
            const currentReactions = comment.reactions?.['💖'] || { count: 0, users: [] };
            const newCount = currentLiked ? currentReactions.count - 1 : currentReactions.count + 1;
            
            // 更新reactions数据
            const updatedReactions = {
              ...comment.reactions,
              '💖': {
                count: Math.max(0, newCount),
                users: currentLiked 
                  ? (currentReactions.users || []).filter((id: number) => id !== 6) // 移除当前用户
                  : [...(currentReactions.users || []), 6] // 添加当前用户
              }
            };
            
            const updatedComment = {
              ...comment,
              liked: !currentLiked, // 切换点赞状态
              total_reactions: Math.max(0, newCount),
              reactions: updatedReactions
            };
            
            return updatedComment;
          }
          return comment;
        }));
        
        Toast.show({
          type: 'success',
          text1: '操作成功',
          text2: '点赞状态已更新',
        });
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
      const response = await likeReply(replyId);
      
      if (response.code === 200) {
        setComments(prev => prev.map(comment => {
          const updateReplies = (replies: Reply[]): Reply[] => {
            return replies.map(reply => {
              if (reply.id === replyId) {
                // 根据当前点赞状态计算新的点赞数量
                const currentLiked = reply.liked;
                const currentReactions = reply.reactions?.['💖'] || { count: 0, users: [] };
                const newCount = currentLiked ? currentReactions.count - 1 : currentReactions.count + 1;
                
                // 更新reactions数据
                const updatedReactions = {
                  ...reply.reactions,
                  '💖': {
                    count: Math.max(0, newCount),
                    users: currentLiked 
                      ? (currentReactions.users || []).filter((id: number) => id !== 6) // 移除当前用户
                      : [...(currentReactions.users || []), 6] // 添加当前用户
                  }
                };
                
                const updatedReply = {
                  ...reply,
                  liked: !currentLiked, // 切换点赞状态
                  reactions: updatedReactions
                };
                
                return updatedReply;
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
        
        Toast.show({
          type: 'success',
          text1: '操作成功',
          text2: '点赞状态已更新',
        });
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

  const handleReply = (type: 'comment' | 'reply', id: number, username: string) => {
    setReplyTo({ type, id, username });
    // 自动添加@用户名到输入框
    // setCommentText(`@${username} `);
  };

  const cancelReply = () => {
    setReplyTo(null);
    setCommentText('');
  };

  // 删除评论
  const handleDeleteComment = async (commentId: number) => {
    try {
      const response = await deleteComment(commentId);
      
      if (response.code === 200) {
        Toast.show({
          type: 'success',
          text1: '删除成功',
          text2: '评论已删除',
        });
        // 重新获取评论列表
        await fetchComments(false);
      } else {
        Toast.show({
          type: 'error',
          text1: '删除失败',
          text2: response.message || '请稍后再试',
        });
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: '删除失败',
        text2: '网络错误，请检查连接',
      });
      console.error('Error deleting comment:', err);
    }
  };

  // 删除回复
  const handleDeleteReply = async (replyId: number) => {
    try {
      const response = await deleteReply(replyId);
      
      if (response.code === 200) {
        Toast.show({
          type: 'success',
          text1: '删除成功',
          text2: '回复已删除',
        });
        // 重新获取评论列表
        await fetchComments(false);
      } else {
        Toast.show({
          type: 'error',
          text1: '删除失败',
          text2: response.message || '请稍后再试',
        });
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: '删除失败',
        text2: '网络错误，请检查连接',
      });
      console.error('Error deleting reply:', err);
    }
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

  // 获取特定表情的点赞数量
  const getReactionCount = (reactions: Record<string, any>, emoji: string) => {
    if (!reactions || !reactions[emoji]) return 0;
    return reactions[emoji].count || 0;
  };

  // 优化后的回复树渲染函数 - 最多两级缩进
  const renderReplyTree = (replies: Reply[], depth = 0, parentUsername?: string) => {
    if (!replies || replies.length === 0) return null;
    
    return (
      <View style={tw`mt-2`}>
        {replies.map((reply) => (
          <View key={reply.id} style={tw`mb-3`}>
            <View style={tw`flex-row items-start`}>
              {/* 深度指示器 - 仅用于视觉效果 */}
              {depth > 0 && (
                <View style={tw`w-4 mr-1 justify-center items-center`}>
                  <Ionicons name="return-down-forward" size={14} color="#9ca3af" />
                </View>
              )}
              
              <View style={tw`flex-1`}>
                <View style={tw`flex-row items-center justify-between mb-1`}>
                  <View style={tw`flex-row items-center flex-1`}>
                    <Text style={tw`font-medium text-sm text-gray-900`}>
                      {reply.username}
                    </Text>
                    <Text style={tw`text-gray-400 text-xs ml-2`}>
                      {formatTime(reply.created_at)}
                    </Text>
                  </View>
                  {reply.user_id === currentUserId && (
                    <TouchableOpacity 
                      style={tw`p-1`}
                      onPress={() => handleDeleteReply(reply.id)}
                    >
                      <Ionicons name="trash-outline" size={14} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
                
                {reply.reply_id && parentUsername && (
                  <Text style={tw`text-blue-600 text-xs mb-1`}>
                    回复 @{parentUsername}
                  </Text>
                )}
                
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
                    <Text style={tw`text-gray-500 text-xs ml-1`}>
                      {getReactionCount(reply.reactions, '💖') > 0 ? getReactionCount(reply.reactions, '💖') : '点赞'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={tw`flex-row items-center`}
                    onPress={() => handleReply('reply', reply.id, reply.username)}
                  >
                    <Ionicons name="chatbubble-outline" size={14} color="#666" />
                    <Text style={tw`text-gray-500 text-xs ml-1`}>
                      {reply.child_replies_count > 0 ? reply.child_replies_count : '回复'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            {/* 子回复 - 不再缩进，仅用图标表示层级关系 */}
            {reply.children && reply.children.length > 0 && (
              <View style={tw`mt-2 ml-4`}>
                {renderReplyTree(reply.children, depth + 1, reply.username)}
              </View>
            )}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchComments(true)}
          />
        }
      >
        {error ? (
          <View style={tw`p-4 items-center`}>
            <Text style={tw`text-red-500`}>{error}</Text>
            <TouchableOpacity 
              style={tw`mt-4 px-6 py-2 bg-blue-500 rounded-full`}
              onPress={() => fetchComments(false)}
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
                  <View style={tw`flex-row items-center justify-between mb-1`}>
                    <View style={tw`flex-row items-center flex-1`}>
                      <Text style={tw`font-medium text-base text-gray-900`}>
                        {comment.username}
                      </Text>
                      <Text style={tw`text-gray-400 text-sm ml-2`}>
                        {formatTime(comment.created_at)}
                      </Text>
                    </View>
                    {/* 删除按钮 - 只有自己创建的评论才显示 */}
                    {comment.user_id === currentUserId && (
                      <TouchableOpacity 
                        style={tw`p-1`}
                        onPress={() => handleDeleteComment(comment.id)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    )}
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
                        {getReactionCount(comment.reactions, '💖') > 0 ? getReactionCount(comment.reactions, '💖') : '点赞'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={tw`flex-row items-center mr-4`}
                      onPress={() => handleReply('comment', comment.id, comment.username)}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color="#666" />
                      <Text style={tw`text-gray-500 text-sm ml-1`}>
                        {comment.reply_count > 0 ? comment.reply_count : '回复'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* 回复列表 - 使用树形结构 */}
                  {/* {renderReplyTree(comment.replies)} */}
                  {/* 回复列表 - 最多两级缩进 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <View style={tw`mt-3 ml-2`}>
                      {renderReplyTree(comment.replies, 0, comment.username)}
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 底部评论输入 */}
      <View style={tw`px-4 py-3 border-t border-gray-200 bg-white`}>
        {/* 回复提示 */}
        {replyTo && (
          <View style={tw`flex-row items-center justify-between mb-2 px-3 py-2 bg-blue-50 rounded-lg`}>
            <Text style={tw`text-blue-600 text-sm`}>
              回复 @{replyTo.username}
            </Text>
            <TouchableOpacity onPress={cancelReply}>
              <Ionicons name="close" size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={tw`flex-row items-end`}>
          <View style={tw`flex-1 bg-gray-100 rounded-2xl px-4 py-2 mr-2 min-h-[40px] max-h-[100px]`}>
            <TextInput
              style={tw`text-base text-gray-900`}
              placeholder={replyTo ? "写下你的回复..." : "写下你的评论..."}
              placeholderTextColor="#9ca3af"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={200}
            />
          </View>
          <TouchableOpacity
            style={tw`px-4 py-2 bg-blue-500 rounded-full ${(!commentText.trim() || submitting) ? 'opacity-50' : ''}`}
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={tw`text-white font-medium`}>
                {replyTo ? '回复' : '发送'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}