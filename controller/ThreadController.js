// src/controllers/ThreadController.js
const ThreadService = require('../service/ThreadService');
const response = require('../utils/response');
const { getContext } = require('../utils/requestContext');

class ThreadController {
    constructor() {
        this.threadService = new ThreadService();

        // 绑定this
        this.createThread = this.createThread.bind(this);
        this.getThreadById = this.getThreadById.bind(this);
        this.updateThread = this.updateThread.bind(this);
        this.deleteThread = this.deleteThread.bind(this);
        this.undoThread = this.undoThread.bind(this);
    }

    // 创建评论
    async createThread(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            const thread = await this.threadService.createThread({
                ...req.body,
                user_id: contextUser?.userId
            });
            response.success(res, thread, '评论创建成功', 200);
        } catch (error) {
            response.error(res, error.message, 400);
        }
    }

    // 获取评论详情
    async getThreadById(req, res) {
        try {
            const thread = await this.threadService.getThreadById(req.params.threadId);
            if (!thread) {
                return response.error(res, '评论不存在', 404);
            }
            response.success(res, thread);
        } catch (error) {
            response.error(res, error.message, 500);
        }
    }

    // 更新评论
    async updateThread(req, res) {
        try {
            const thread = await this.threadService.updateThread(
                req.params.threadId,
                req.body,
            );
            response.success(res, thread, '评论更新成功');
        } catch (error) {
            response.error(res, error.message, error.statusCode || 400);
        }
    }

    // 删除评论
    async deleteThread(req, res) {
        try {
            await this.threadService.deleteThread(
                req.params.threadId
            );
            response.success(res, null, '评论删除成功');
        } catch (error) {
            response.error(res, error.message, error.statusCode || 500);
        }
    }

    // 撤销评论
    async undoThread(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            await this.threadService.undoThread(
                req.params.threadId,
                contextUser?.userId
            );
            response.success(res, null, '评论删除成功');
        } catch (error) {
            response.error(res, error.message, error.statusCode || 500);
        }
    }


}

module.exports = new ThreadController();
