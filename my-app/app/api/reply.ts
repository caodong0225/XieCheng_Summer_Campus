// api/reply.ts
import { del, get, post, put } from "./request";

/**
 * 创建回复
 * @param data 回复数据
 */
export async function createReply(data: {
  content: string;
  thread_id: string;
  parent_id?: string;
}) {
  return post(`reply/`, data);
}

/**
 * 获取回复详情
 * @param id 回复ID
 */
export async function getReplyById(id: string) {
  return get(`reply/${id}`);
}

/**
 * 更新回复
 * @param id 回复ID
 * @param data 更新数据
 */
export async function updateReply(id: string, data: { content: string }) {
  return put(`reply/${id}`, data);
}

/**
 * 删除回复
 * @param id 回复ID
 */
export async function deleteReply(id: any) {
  return del(`reply/${id}`);
}

/**
 * 点赞/取消点赞回复
 * @param id 回复ID
 */
export async function likeReply(id: any) {
  return post(`reply/like/${id}`, {});
}

/**
 * 收藏/取消收藏回复
 * @param id 回复ID
 */
export async function collectReply(id: any) {
  return post(`reply/collect/${id}`, {});
}

/**
 * 获取回复树
 * @param replyId 根回复ID
 */
export async function getReplyTree(replyId: string) {
  return get(`reply/tree/${replyId}`);
}

/**
 * 获取评论的所有回复（树形结构）
 * @param threadId 评论ID
 */
export async function getThreadReplies(threadId: string) {
  return get(`reply/thread/${threadId}`);
}

// ===== 类型定义 =====
export interface Reply {
  id: string;
  content: string;
  user_id: string;
  thread_id: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  likes_count: number;
  collects_count: number;
  is_liked?: boolean;
  is_collected?: boolean;
  replies?: Reply[]; // 用于树形结构
}

export interface LikeCollectResult {
  action: 'added' | 'removed';
  likes_count: number;
  collects_count: number;
}