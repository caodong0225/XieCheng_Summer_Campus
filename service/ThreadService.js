// src/services/ThreadService.js
const ThreadMapper = require('../mapper/ThreadMapper');
const {sanitize, createSchema, updateSchema} = require("../entity/ThreadEntity");
const UserMapper = require("../mapper/UserMapper");
const NoteMapper = require("../mapper/NoteMapper");
const NoteEmojiMapper = require("../mapper/NoteEmojiMapper");
const ThreadEmojiMapper = require("../mapper/ThreadEmojiMapper");
const webSocketServer = require("../websocketServer");

class ThreadService {
    constructor() {
        this.mapper = new ThreadMapper();
        this.userMapper = new UserMapper();
        this.noteMapper = new NoteMapper();
        this.noteEmojiMapper = new NoteEmojiMapper();
        this.threadEmojiMapper = new ThreadEmojiMapper();
        this.io = webSocketServer.getIO(); // 获取 io 实例
    }

    // 用户收藏操作
    async toggleCollection(userId, noteId) {
        if (await this.noteMapper.getNoteById(noteId) === null) {
            throw new Error('游记不存在');
        }
        const isCollected = await this.noteEmojiMapper.isCollection(userId, noteId);
        try {
            await this.noteEmojiMapper.beginTransaction();
            if (isCollected) {
                await this.noteEmojiMapper.cancelCollection(userId, noteId);
            } else {
                await this.noteEmojiMapper.collection(userId, noteId);
            }
            await this.noteEmojiMapper.commit();
            return { collected: !isCollected };
        } catch (error) {
            await this.noteEmojiMapper.rollback();
            throw new Error('收藏操作失败: ' + error.message);
        }
    }

    // 用户点赞操作
    async toggleFavorite(userId, noteId) {
        if (await this.noteMapper.getNoteById(noteId) === null) {
            throw new Error('游记不存在');
        }
        const isFavorited = await this.noteEmojiMapper.isFavorite(userId, noteId);
        try {
            await this.noteEmojiMapper.beginTransaction();
            if (isFavorited) {
                await this.noteEmojiMapper.cancelFavorite(userId, noteId);
            } else {
                await this.noteEmojiMapper.favorite(userId, noteId);
            }
            await this.noteEmojiMapper.commit();
            return { favorited: !isFavorited };
        } catch (error) {
            await this.noteEmojiMapper.rollback();
            throw new Error('点赞操作失败: ' + error.message);
        }
    }

    // 收藏帖子
    async toggleThreadCollect(userId, threadId) {
        // 判断threadId是否存在
        const thread = await this.mapper.findById(threadId);
        if (!thread) throw new Error('评论不存在');
        const isCollected = await this.threadEmojiMapper.isCollection(userId, threadId);
        try {
            await this.threadEmojiMapper.beginTransaction();
            if (isCollected) {
                await this.threadEmojiMapper.cancelCollection(userId, threadId);
            } else {
                await this.threadEmojiMapper.collection(userId, threadId);
            }
            await this.threadEmojiMapper.commit();
            return { collected: !isCollected };
        } catch (error) {
            await this.threadEmojiMapper.rollback();
            throw new Error('收藏操作失败: ' + error.message);
        }
    }

    // 创建评论
    async createThread(threadData) {
        await this.mapper.beginTransaction();
        try {
            const { error, value } = createSchema.validate(threadData);
            if (error) throw new Error(error.details[0].message);

            // 验证用户存在
            const user = await this.userMapper.findById(value.user_id);
            if (!user) throw new Error('用户不存在');

            // 验证游记存在
            const note = await this.noteMapper.getNoteById(value.note_id);
            if (!note) throw new Error('游记不存在');

            // 创建评论
            const thread = await this.mapper.create(value);

            // 发送通知
            await this.mapper.sendNotification(
                user.username,
                note.created_by,
                note.id,
                note.title,
                value.user_id,
                value.content
            );

            // 提交事务
            await this.mapper.commit();
            // 发送前检查房间是否存在
            if (this.io.sockets.adapter.rooms.has(`user_${note.created_by}`)) {
                console.log(`发送新通知到房间 user_${note.created_by}`)
                this.io.to(`user_${note.created_by}`).emit('new_notification',
                    {
                        'title': "用户" + user.username + "在游记《" + note.title + "》下评论了你",
                        'message': value.content,
                    }
                );
            }else{
                console.warn(`房间 user_${note.created_by} 不存在，无法发送通知`);
            }
            return thread;
        } catch (error) {
            await this.mapper.rollback();
            throw new Error('创建评论失败: ' + error.message);
        }
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

    // 检查用户操作帖子的权限
    async checkThreadPermission(userId, id) {
        const thread = await this.mapper.findById(id);
        if (thread?.user_id !== userId) {
            throw new Error('你没有操作权限');
        }
        return true;
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

    // 点赞帖子
    async toggleThreadLike(userId, threadId) {
        // 判断threadId是否存在
        const thread = await this.mapper.findById(threadId);
        if (!thread) throw new Error('评论不存在');
        const isLiked = await this.threadEmojiMapper.isFavorite(userId, threadId);
        try {
            await this.threadEmojiMapper.beginTransaction();
            if (isLiked) {
                await this.threadEmojiMapper.cancelFavorite(userId, threadId);
            } else {
                await this.threadEmojiMapper.favorite(userId, threadId);
            }
            await this.threadEmojiMapper.commit();
            return { liked: !isLiked };
        } catch (error) {
            await this.threadEmojiMapper.rollback();
            throw new Error('点赞操作失败: ' + error.message);
        }
    }

}

module.exports = ThreadService;
