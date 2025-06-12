// src/services/ReplyService.js
const ReplyMapper = require('../mapper/ReplyMapper');
const ReplyEmojiMapper = require('../mapper/ReplyEmojiMapper');
const { sanitize, createSchema, updateSchema } = require("../entity/ReplyEntity");
const UserMapper = require("../mapper/UserMapper");
const ThreadMapper = require("../mapper/ThreadMapper");

class ReplyService {
    constructor() {
        this.mapper = new ReplyMapper();
        this.emojiMapper = new ReplyEmojiMapper();
        this.userMapper = new UserMapper();
        this.threadMapper = new ThreadMapper();
    }

    // 创建回复
    async createReply(replyData) {
        const { error, value } = createSchema.validate(replyData);
        if (error) throw new Error(error.details[0].message);

        // 验证用户存在
        if (!await this.userMapper.findById(value.user_id)) {
            throw new Error('用户不存在');
        }

        // 验证父级存在（可能是评论或回复）
        if (value.thread_id && !await this.threadMapper.findById(value.thread_id)) {
            throw new Error('评论不存在');
        }
        if (value.reply_id && !await this.mapper.findById(value.reply_id)) {
            throw new Error('回复不存在');
        }

        return this.mapper.create(value);
    }

    // 获取回复详情
    async getReplyById(id) {
        const reply = await this.mapper.findByIdWithUser(id);
        if (!reply) throw new Error('回复不存在');
        return sanitize(reply);
    }

    // 更新回复
    async updateReply(id, updates) {
        const { error } = updateSchema.validate(updates);
        if (error) throw new Error(error.details[0].message);

        const reply = await this.mapper.findById(id);
        if (!reply) throw new Error('回复不存在');

        return this.mapper.update(id, updates);
    }

    // 删除回复
    async deleteReply(id) {
        const reply = await this.mapper.findById(id);
        if (!reply) throw new Error('回复不存在');
        await this.mapper.delete(id);
        return true;
    }

    // 检查用户操作帖子的权限
    async checkReplyPermission(userId, id){
        const reply = await this.mapper.findById(id);
        if(reply?.user_id !== userId){
            throw new Error('你没有操作权限');
        }
        return true;
    }

    // 用户点赞回复操作
    async toggleLikeReply(userId, replyId) {
        const reply = await this.mapper.findById(replyId);
        if (!reply) throw new Error('回复不存在');

        const isLiked = await this.emojiMapper.isFavorite(userId, replyId);
        try {
            await this.emojiMapper.beginTransaction();
            if (isLiked) {
                await this.emojiMapper.cancelFavorite(userId, replyId);
            } else {
                await this.emojiMapper.favorite(userId, replyId);
            }
            await this.emojiMapper.commit();
            return { liked: !isLiked };
        } catch (error) {
            await this.emojiMapper.rollback();
            throw new Error('点赞操作失败: ' + error.message);
        }
    }

    // 用户收藏回复操作
    async toggleCollectReply(userId, replyId) {
        const reply = await this.mapper.findById(replyId);
        if (!reply) throw new Error('回复不存在');

        const isCollected = await this.emojiMapper.isCollection(userId, replyId);
        try {
            await this.emojiMapper.beginTransaction();
            if (isCollected) {
                await this.emojiMapper.cancelCollection(userId, replyId);
            } else {
                await this.emojiMapper.collection(userId, replyId);
            }
            await this.emojiMapper.commit();
            return { collected: !isCollected };
        } catch (error) {
            await this.emojiMapper.rollback();
            throw new Error('收藏操作失败: ' + error.message);
        }
    }

    // 获取回复的表情反应
    async getReplyReactions(replyIds) {
        if (!replyIds || replyIds.length === 0) return {};
        return this.emojiMapper.getReplyReactions(replyIds);
    }

    // 获取回复树结构（递归获取子回复）
    async getReplyTree(replyId) {
        const rootReply = await this.mapper.findByIdWithUser(replyId);
        if (!rootReply) return null;

        const buildTree = async (reply) => {
            const children = await this.mapper.findChildren(reply.id);
            if (children && children.length > 0) {
                reply.children = [];
                for (const child of children) {
                    const childTree = await buildTree(child);
                    reply.children.push(childTree);
                }
            }
            return reply;
        };

        return buildTree(rootReply);
    }

    // 获取评论的所有回复（树形结构）
    async getThreadReplies(threadId) {
        const rootReplies = await this.mapper.findByThreadId(threadId);
        if (!rootReplies || rootReplies.length === 0) return [];

        const buildTrees = async (replies) => {
            const trees = [];
            for (const reply of replies) {
                const tree = await this.getReplyTree(reply.id);
                trees.push(tree);
            }
            return trees;
        };

        return buildTrees(rootReplies);
    }
}

module.exports = ReplyService;
