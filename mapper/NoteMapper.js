// src/mapper/NoteMapper.js
const pool = require('../utils/database');
const NoteEntity = require('../entity/NoteEntity');

class NoteMapper {
    constructor() {
        this.connection = null; // 事务连接
    }

    // 开启事务
    async beginTransaction() {
        this.connection = await pool.getConnection();
        await this.connection.beginTransaction();
    }

    // 提交事务
    async commit() {
        if (this.connection) {
            await this.connection.commit();
            this.connection.release();
            this.connection = null;
        }
    }

    // 回滚事务
    async rollback() {
        if (this.connection) {
            await this.connection.rollback();
            this.connection.release();
            this.connection = null;
        }
    }

    async insertAttachment(noteId, attachment) {
        // 重点修改：使用事务连接
        const conn = this.connection || pool;
        await conn.query(
            `INSERT INTO notes_attachment SET 
            note_id = ?, \`key\` = ?, value = ?, weight = ?`, // 转义key
            [noteId, attachment.type, attachment.link || '', attachment.weight]
        );
    }

    async createNote(noteData) {
        const conn = this.connection || pool; // 使用事务连接
        const [noteResult] = await conn.query(
            `INSERT INTO notes SET 
            title = ?, description = ?, created_by = ?`,
            [noteData.title, noteData.description, noteData.createdBy]
        );
        return noteResult.insertId;
    }

    async setDefaultStatus(noteId) {
        const conn = this.connection || pool; // 使用事务连接
        await conn.query(
            `INSERT INTO notes_status SET 
            note_id = ?, status = 'checking'`,
            [noteId]
        );
        return true;
    }


    /**
     * 更新审核状态
     */
    async updateStatus(noteId, statusData) {
        const [result] = await pool.query(
            `UPDATE notes_status SET 
       status = ?, reason = ?
       WHERE note_id = ?`,
            [statusData.status, statusData.reason, noteId]
        );
        return result.affectedRows > 0;
    }

    /**
     * 逻辑删除游记
     */
    async deleteNote(noteId) {
        const [result] = await pool.query(
            `UPDATE notes SET 
       del_flag = 1
       WHERE id = ?`,
            [noteId]
        );
        return result.affectedRows > 0;
    }

    // 通过id获取游记
    async getNoteById(noteId) {
        const [rows] = await pool.query(
            `SELECT * FROM notes 
       WHERE id = ?`,
            [noteId]
        );
        return rows[0] || null;
    }

    // 更改游记内容
    async updateNote(noteId, noteData) {
        const [result] = await pool.query(
            `UPDATE notes SET 
       title = ?, description = ?
       WHERE id = ?`,
            [noteData.title, noteData.description, noteId]
        );
        return result.affectedRows > 0;
    }

    // 比较userId和noteId是否吻合
    async compareUserIdAndNoteId(userId, noteId) {
        const [rows] = await pool.query(
            `SELECT * FROM notes 
       WHERE id = ? AND created_by = ?`,
            [noteId, userId]
        );
        return rows.length > 0;
    }

    // 检查note状态是否为已删除
    async checkNoteStatus(noteId) {
        const [rows] = await pool.query(
            `SELECT * FROM notes 
       WHERE id = ?`,
            [noteId]
        );
        if (rows.length === 0) throw new Error('游记不存在');
        if (rows[0].del_flag == 1) throw new Error('游记已被删除');
        return true;
    }

    // 通过id删除note附件
    async deleteAttachmentById(attachmentId) {
        const [result] = await pool.query(
            `DELETE FROM notes_attachment 
       WHERE id = ?`,
            [attachmentId]
        );
        return result.affectedRows > 0;
    }

    // 通过id获取游记附件
    async getAttachmentById(attachmentId) {
        const [rows] = await pool.query(
            `SELECT * FROM notes_attachment 
       WHERE id = ?`,
            [attachmentId]
        );
        return rows[0] || null;
    }

    // 通过noteId获取attachment的个数
    async getAttachmentCountByNoteId(noteId) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) AS count FROM notes_attachment 
       WHERE note_id = ?`,
            [noteId]
        );
        return rows[0].count || 0;
    }
}

module.exports = NoteMapper;