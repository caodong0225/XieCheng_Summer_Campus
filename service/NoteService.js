// src/services/NoteService.js
const NoteMapper = require('../mapper/NoteMapper');
const NoteEntity = require('../entity/NoteEntity');
const ThreadMapper = require("../mapper/ThreadMapper");
const UserMapper = require("../mapper/UserMapper");

class NoteService {
    constructor() {
        this.mapper = new NoteMapper();
        this.threadMapper = new ThreadMapper();
        this.userMapper = new UserMapper();
    }

    /**
     * 创建游记（自动添加审核状态）
     */
    async createNote(userId, noteData) {
        const { error } = NoteEntity.createSchema.validate(noteData);
        if (error) throw new Error(error.details[0].message);

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

            // 提交事务
            await this.mapper.commit();
            return noteId;
        } catch (error) {
            // 回滚事务
            await this.mapper.rollback();
            throw error;
        }
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
    async updateNote(noteId, noteData) {
        const { error } = NoteEntity.createSchema.validate(noteData);
        if (error) throw new Error(error.details[0].message);
        if(await this.mapper.checkNoteStatus(noteId)){
            throw new Error('游记不存在');
        }
        return this.mapper.updateNote(noteId, noteData);
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
        const note = await this.mapper.getNoteById(noteId);
        if (!note) throw new Error('游记不存在');
        if (note.del_flag == 1) throw new Error('游记已被删除');
        const { error } = NoteEntity.statusSchema.validate(result);
        if (error) throw new Error(error.details[0].message);

        return this.mapper.auditNote(noteId, result.status, result.reason);
    }

    // 获取游记列表
    async getNoteList(filter) {
        console.log(filter)
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
        // 屏蔽用户敏感信息
        user.password = undefined;
        note.user = user;
        // 获取游记评论数
        const comments = await this.threadMapper.countReplyByNoteId(note.id);
        // 获取喜欢数
        const likes = await this.threadMapper.countFavoriteByNoteId(note.id);
        // 获取收藏数
        const collections = await this.threadMapper.countCollectionByNoteId(note.id);
        // 是否用户有喜欢
        const isFavorite = await this.threadMapper.isFavorite(userId, note.id);
        // 是否用户有收藏
        const isCollection = await this.threadMapper.isCollection(userId, note.id);
        note.isFavorite = isFavorite;
        note.isCollection = isCollection;
        note.likes = likes;
        note.collections = collections;
        note.comments = comments;
        note.attachments = attachments;
        return note;
    }

}

module.exports = NoteService;
