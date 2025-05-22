// src/services/ThreadService.js
const ThreadMapper = require('../mapper/ThreadMapper');
const {sanitize, createSchema, updateSchema} = require("../entity/ThreadEntity");
const UserMapper = require("../mapper/UserMapper");
const NoteMapper = require("../mapper/NoteMapper");

class ThreadService {
    constructor() {
        this.mapper = new ThreadMapper();
        this.userMapper = new UserMapper();
        this.noteMapper = new NoteMapper();
    }

    // 用户收藏操作
    async toggleCollection(userId, noteId) {
        const isCollected = await this.mapper.isCollection(userId, noteId);
        try {
            await this.mapper.beginTransaction();
            if (isCollected) {
                await this.mapper.cancelCollection(userId, noteId);
            } else {
                await this.mapper.collection(userId, noteId);
            }
            await this.mapper.commit();
            return { collected: !isCollected };
        } catch (error) {
            await this.mapper.rollback();
            throw new Error('收藏操作失败: ' + error.message);
        }
    }

    // 用户点赞操作
    async toggleFavorite(userId, noteId) {
        const isFavorited = await this.mapper.isFavorite(userId, noteId);
        try {
            await this.mapper.beginTransaction();
            if (isFavorited) {
                await this.mapper.cancelFavorite(userId, noteId);
            } else {
                await this.mapper.favorite(userId, noteId);
            }
            await this.mapper.commit();
            return { favorited: !isFavorited };
        } catch (error) {
            await this.mapper.rollback();
            throw new Error('点赞操作失败: ' + error.message);
        }
    }

    // 创建评论
    async createThread(threadData) {
        const { error, value } = createSchema.validate(threadData);
        if (error) throw new Error(error.details[0].message);

        // 验证用户存在
        if (!await this.userMapper.findById(value.user_id)) {
            throw new Error('用户不存在');
        }

        // 验证游记存在
        if (!await this.noteMapper.getNoteById(value.note_id)) {
            throw new Error('游记不存在');
        }

        return this.mapper.create(value);
    }

    // 获取评论详情
    async getThreadById(id) {
        const thread = await this.mapper.findByIdWithUser(id);
        if (!thread) throw new Error('评论不存在');
        return sanitize(thread);
    }

    // 更新评论
    async updateThread(id, updates) {
        const { error } = updateSchema.validate(updates);
        if (error) throw new Error(error.details[0].message);

        const thread = await this.mapper.findById(id);
        if (!thread) throw new Error('评论不存在');

        return this.mapper.update(id, updates);
    }

    // 删除评论
    async deleteThread(id) {
        const thread = await this.mapper.findById(id);
        if (!thread) throw new Error('评论不存在');
        await this.mapper.delete(id);
        return true;
    }

    // 撤回评论
    async undoThread(id,userId) {
        const thread = await this.mapper.findById(id);
        if (!thread) throw new Error('评论不存在');
        if (thread.user_id !== userId) throw new Error('无权限撤回评论');

        await this.mapper.delete(id);
        return true;
    }
}

module.exports = ThreadService;
