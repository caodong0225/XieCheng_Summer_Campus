// src/services/NoteService.js
const NoteMapper = require('../mapper/NoteMapper');
const NoteEntity = require('../entity/NoteEntity');

class NoteService {
    constructor() {
        this.mapper = new NoteMapper();
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

}

module.exports = NoteService;