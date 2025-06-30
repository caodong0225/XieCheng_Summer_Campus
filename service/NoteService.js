// src/services/NoteService.js
const NoteMapper = require('../mapper/NoteMapper');
const NoteEntity = require('../entity/NoteEntity');
const NoteEmojiMapper = require("../mapper/NoteEmojiMapper");
const UserMapper = require("../mapper/UserMapper");
const ReplyEmojiMapper = require("../mapper/ReplyEmojiMapper");
const ThreadMapper = require("../mapper/ThreadMapper");
const NoteViewMapper = require("../mapper/NoteViewMapper");
const VideoEmojiMapper = require("../mapper/VideoEmojiMapper");
const NotificationMapper = require("../mapper/NotificationMapper");

class NoteService {
    constructor() {
        this.mapper = new NoteMapper();
        this.noteEmojiMapper = new NoteEmojiMapper();
        this.replyEmojiMapper = new ReplyEmojiMapper();
        this.videoEmojiMapper = new VideoEmojiMapper();
        this.userMapper = new UserMapper();
        this.threadMapper = new ThreadMapper();
        this.noteViewMapper = new NoteViewMapper();
        this.notificationMapper = new NotificationMapper();
    }

    /**
     * 创建游记（自动添加审核状态）
     */
    async createNote(userId, noteData) {
        const { error } = NoteEntity.createSchema.validate(noteData);
        if (error) throw new Error(error.details[0].message);
        const user = await this.userMapper.findById(userId);

        try {
            // 开启事务
            await this.mapper.beginTransaction();

            const results = {};

            noteData.createdBy = userId;

            // 插入游记
            const noteId = await this.mapper.createNote({
                ...noteData,
            });
            results.noteId = noteId;
            // 插入附件
            if (noteData.attachments) {
                for (const attachment of noteData.attachments) {
                    await this.mapper.insertAttachment(noteId, attachment);
                }
            }
            else{
                // 报错让事务回滚
                throw new Error('attachments is required');
            }
            // 设置默认审核状态
            await this.mapper.setDefaultStatus(noteId);

            // 告知管理员审核通知
            await this.mapper.sendToAdminNotification(noteId,noteData.title, userId, user.username)

            // 提交事务
            await this.mapper.commit();
            return noteId;
        } catch (error) {
            // 回滚事务
            await this.mapper.rollback();
            throw error;
        }
    }

    // 插入附件
    async insertAttachment(noteId, attachment) {
        // 先检查游记是否存在
        if(!await this.mapper.checkNoteStatus(noteId)){
            throw new Error('游记不存在');
        }
        return this.mapper.insertAttachment(noteId, attachment);
    }

    /**
     * 审核游记
     */
    async reviewNote(noteId, statusData) {
        const { error } = NoteEntity.statusSchema.validate(statusData);
        if (error) throw new Error(error.details[0].message);

        // 先检查游记是否存在
        if(await this.mapper.checkNoteStatus(noteId)){
            throw new Error('游记不存在');
        }

        return this.mapper.updateStatus(noteId, statusData);
    }

    /**
     * 逻辑删除游记
     */
    async deleteNote(noteId) {
        // 先检查游记是否存在
        const note = await this.mapper.getNoteById(noteId);
        if (!note) throw new Error('游记不存在');
        // 检查游记是否已经被删除
        if (note.del_flag == 1) throw new Error('游记已被删除');
        return this.mapper.deleteNote(noteId);
    }

    // 通过id获取游记
    async getNoteById(noteId) {
        const note = await this.mapper.getNoteById(noteId);
        if (!note) throw new Error('游记不存在');
        return note;
    }

    // 更改游记内容
// 更改游记内容
    async updateNote(noteId, noteData, user) {
        const { error } = NoteEntity.createSchema.validate(noteData);
        if (error) throw new Error(error.details[0].message);

        try {
            // 开启事务
            await this.mapper.beginTransaction();

            // 检查游记状态
            const noteStatus = await this.mapper.getNoteStatus(noteId);
            console.log("noteStatus",noteStatus)
            if (!noteStatus) {
                throw new Error('游记不存在');
            }

            if (noteStatus.status === 'approved') {
                throw new Error('已审批通过的游记不能更新');
            }

            if (noteStatus.status === 'rejected') {
                // 如果状态是rejected，更新为checking
                await this.mapper.updateNoteStatusById(noteId, 'checking');
                await this.mapper.sendToAdminNotification(noteId,noteData.title, user.userId, user.username)
            }

            // 更新游记内容
            const result = await this.mapper.updateNote(noteId, noteData);

            // 提交事务
            await this.mapper.commit();
            return result;
        } catch (error) {
            // 回滚事务
            await this.mapper.rollback();
            throw error;
        }
    }

    async checkNotePermission(userId, noteId) {
        const note = await this.mapper.compareUserIdAndNoteId(userId, noteId);
        if (!note) throw new Error('无权限或者游记不存在');
        return true;
    }

    async checkAttachmentPermission(userId, attachmentId) {
        const attachment = await this.mapper.getAttachmentById(attachmentId);
        if (!attachment) throw new Error('游记不存在');
        const note = await this.mapper.getNoteById(attachment.note_id);
        if (!note) throw new Error('游记不存在');
        if (note.created_by != userId) throw new Error('无权限');
        return true;
    }

    // 删除游记附件
    async deleteAttachment(attachmentId) {
        const attachment = await this.mapper.getAttachmentById(attachmentId);
        if (!attachment) throw new Error('附件不存在');
        // 检查游记是否已经被删除
        await this.mapper.checkNoteStatus(attachment.note_id);
        if(await this.mapper.getAttachmentCountByNoteId(attachment.note_id) <= 1){
            throw new Error('游记至少需要一个附件');
        }
        return this.mapper.deleteAttachmentById(attachmentId);
    }

    // 审计游记
    async auditNote(noteId, result) {
        try {
            await this.mapper.beginTransaction();
            const note = await this.mapper.getNoteById(noteId);
            if (!note) throw new Error('游记不存在');
            if (note.del_flag == 1) throw new Error('游记已被删除');
            const {error} = NoteEntity.statusSchema.validate(result);
            if (error) throw new Error(error.details[0].message);
            if(await this.mapper.auditNote(noteId, result.status, result.reason)){
                // 如果审核通过，发送通知
                if(result.status === 'rejected'){
                    await this.mapper.sendNotification(note.created_by,noteId,note.title,result.reason)
                }
                // 提交事务
                await this.mapper.commit();
                return true;
            }else{
                throw new Error('审核失败');
            }
        }
        catch (error) {
            // 回滚事务
            await this.mapper.rollback();
            throw error;
        }
    }

    // 获取游记列表
    async getNoteList(filter) {
        const notes = await this.mapper.getNoteList(filter);
        for (const note of notes.list) {
            // 获取游记附件
            const attachments = await this.mapper.getAttachmentListByNoteId(note.id);
            note.attachments = attachments;
        }

        return notes;
    }

    // 通过note_id获取note详细信息
    async getNoteDetail(userId,noteId) {
        const note = await this.mapper.getNoteById(noteId);
        if (!note) throw new Error('游记不存在');
        if (note.del_flag == 1) throw new Error('游记已被删除');
        // 获取游记附件
        const attachments = await this.mapper.getAttachmentListByNoteId(note.id);
        // 获取游记作者信息
        const user = await this.userMapper.findById(note.created_by);
        // 记录游记访问记录
        await this.noteViewMapper.recordView(userId, noteId)
        // 屏蔽用户敏感信息
        user.password = undefined;
        note.user = user;
        // 获取游记评论数
        const comments = await this.noteEmojiMapper.countReplyByNoteId(note.id);
        // 获取喜欢数
        const likes = await this.noteEmojiMapper.countFavoriteByNoteId(note.id);
        // 获取收藏数
        const collections = await this.noteEmojiMapper.countCollectionByNoteId(note.id);
        // 是否用户有喜欢
        const isFavorite = await this.noteEmojiMapper.isFavorite(userId, note.id);
        // 是否用户有收藏
        const isCollection = await this.noteEmojiMapper.isCollection(userId, note.id);
        const getRejected = await this.mapper.getStatusByNoteId(note.id,'rejected')
        const getChecking = await this.mapper.getStatusByNoteId(note.id,'checking')
        // 获取游记是否是被拒绝状态
        const isRejected = getRejected != null;
        if(isRejected){
            note.rejectedReason = getRejected.reason;
        }
        note.isFavorite = isFavorite;
        note.isCollection = isCollection;
        note.likes = likes;
        note.collections = collections;
        note.comments = comments;
        note.attachments = attachments;
        note.isRejected = isRejected;
        note.isChecking = getChecking != null;
        return note;
    }

    // 组合查询服务
    async getThreadsWithRepliesByNote(noteId) {
        // 1. 获取主帖基础数据
        const threads = await this.mapper.getThreadsByNoteId(noteId);
        if (threads.length === 0) return [];
        // 2. 并行查询关联数据
        const threadIds = threads.map(t => t.id);
        const [threadReactions] = await Promise.all([
            this.threadMapper.getThreadReactions(threadIds),
            this.threadMapper.getFirstLevelReplies(threadIds)
        ]);

        // 3. 获取所有层级的回复
        const replies = await this.threadMapper.getAllReplies(threadIds);

        // 4. 处理回复数据
        const replyIds = replies.map(r => r.id);
        const replyReactions = await this.replyEmojiMapper.getReplyReactions(replyIds);

        // 4. 构建表情映射
        const buildReactionMap = (data, idField) =>
            data.reduce((map, item) => {
                const id = item[idField];
                map[id] = map[id] || {};
                map[id][item.emoji] = {
                    count: item.count,
                    users: item.users.split(',').map(Number)
                };
                return map;
            }, {});

        const threadReactionMap = buildReactionMap(threadReactions, 'thread_id');
        const replyReactionMap = buildReactionMap(replyReactions, 'thread_reply_id');

        // 5. 组合最终数据结构
        const replyMap = replies.reduce((map, reply) => {
            reply.reactions = replyReactionMap[reply.id] || {};
            map[reply.thread_id] = map[reply.thread_id] || [];
            map[reply.thread_id].push(reply);
            return map;
        }, {});

        return threads.map(thread => ({
            ...thread,
            reactions: threadReactionMap[thread.id] || {},
            replies: replyMap[thread.id] || []
        }));
    }

    // 查询用户喜欢的帖子
    async getUserFavorites(userId, filter) {
        try {
            // 验证用户ID
            if (!userId || typeof userId !== 'number') {
                throw new Error('无效的用户ID');
            }

            const type = filter?.type
            delete filter.type;

            if(!type || type === 'note') {
                // 获取喜欢的帖子列表
                return await this.mapper.getFavoriteThreads(userId, filter);
            }
            // 获取喜欢的视频列表
            if(type === 'video'){
                return await this.videoEmojiMapper.getFavoriteVideos(userId, filter)
            }
            return null
        } catch (error) {
            console.error('获取用户喜欢失败:', error);
            throw new Error('获取用户喜欢失败: ' + error.message);
        }
    }

    // 查询用户收藏的帖子
    async getUserCollections(userId, filter) {
        try {
            // 验证用户ID
            if (!userId || typeof userId !== 'number') {
                throw new Error('无效的用户ID');
            }

            const type = filter?.type
            delete filter.type;
            if(!type || type === 'note') {
                // 获取收藏的帖子列表
                return await this.mapper.getCollectionThreads(userId, filter);
            }
            // 获取收藏的视频列表
            if(type === 'video'){
                return await this.videoEmojiMapper.getCollectionVideos(userId, filter);
            }

            return null;
        } catch (error) {
            console.error('获取用户收藏失败:', error);
            throw new Error('获取用户收藏失败: ' + error.message);
        }
    }

    // 获取所有审批通过的游记
    async getApprovedNotes(filter) {
        try {
            // 获取所有审批通过的游记,包括图片等相信信息
            const notes = await this.mapper.getApprovedNotes(filter);
            for (const note of notes.list) {
                // 获取游记附件并筛选出weight最小的附件
                const attachments = await this.mapper.getAttachmentListByNoteId(note.id);
                const smallestAttachment = attachments.reduce((min, attachment) => {
                    return !min || attachment.weight < min.weight ? attachment : min;
                }, null);
                note.attachments = smallestAttachment ? [smallestAttachment] : [];
            }
            return notes;
        } catch (error) {
            console.error('获取审批通过的游记失败:', error);
            throw new Error('获取审批通过的游记失败: ' + error.message);
        }
    }

}

module.exports = NoteService;
