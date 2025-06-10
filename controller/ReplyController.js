// src/controllers/ReplyController.js
const ReplyService = require('../service/ReplyService');
const response = require('../utils/response');
const { getContext } = require('../utils/requestContext');

class ReplyController {
    constructor() {
        this.replyService = new ReplyService();

        // 绑定this
        this.createReply = this.createReply.bind(this);
        this.getReplyById = this.getReplyById.bind(this);
        this.updateReply = this.updateReply.bind(this);
        this.deleteReply = this.deleteReply.bind(this);
        this.toggleReplyLike = this.toggleReplyLike.bind(this);
        this.toggleReplyCollect = this.toggleReplyCollect.bind(this);
        this.getReplyTree = this.getReplyTree.bind(this);
        this.getThreadReplies = this.getThreadReplies.bind(this);
    }

    // 创建回复
    async createReply(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            const reply = await this.replyService.createReply({
                ...req.body,
                user_id: contextUser?.userId
            });
            response.success(res, reply, '回复创建成功', 201);
        } catch (error) {
            response.error(res, error.message, 400);
        }
    }

    // 获取回复详情
    async getReplyById(req, res) {
        try {
            const reply = await this.replyService.getReplyById(req.params.replyId);
            if (!reply) {
                return response.error(res, '回复不存在', 404);
            }
            response.success(res, reply);
        } catch (error) {
            response.error(res, error.message, 500);
        }
    }

    // 更新回复
    async updateReply(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            const reply = await this.replyService.updateReply(
                req.params.replyId,
                req.body,
                contextUser?.userId
            );
            response.success(res, reply, '回复更新成功');
        } catch (error) {
            response.error(res, error.message, error.statusCode || 400);
        }
    }

    // 删除回复
    async deleteReply(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            await this.replyService.deleteReply(
                req.params.replyId,
                contextUser?.userId
            );
            response.success(res, null, '回复删除成功');
        } catch (error) {
            response.error(res, error.message, error.statusCode || 500);
        }
    }

    // 点赞回复
    async toggleReplyLike(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            const result = await this.replyService.toggleLikeReply(
                contextUser?.userId,
                req.params.replyId
            );
            response.success(res, result, '点赞操作成功');
        } catch (error) {
            response.error(res, error.message, error.statusCode || 500);
        }
    }

    // 收藏回复
    async toggleReplyCollect(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            const result = await this.replyService.toggleCollectReply(
                contextUser?.userId,
                req.params.replyId
            );
            response.success(res, result, '收藏操作成功');
        } catch (error) {
            response.error(res, error.message, error.statusCode || 500);
        }
    }

    // 获取回复树
    async getReplyTree(req, res) {
        try {
            const replyTree = await this.replyService.getReplyTree(req.params.replyId);
            if (!replyTree) {
                return response.error(res, '回复不存在', 404);
            }
            response.success(res, replyTree);
        } catch (error) {
            response.error(res, error.message, 500);
        }
    }

    // 获取评论的所有回复（树形结构）
    async getThreadReplies(req, res) {
        try {
            const replies = await this.replyService.getThreadReplies(req.params.threadId);
            response.success(res, replies);
        } catch (error) {
            response.error(res, error.message, 500);
        }
    }
}

module.exports = new ReplyController();
