// src/mapper/NoteMapper.js
const pool = require('../utils/database');
const NoteEntity = require('../entity/NoteEntity');
const UserEntity = require("../entity/UserEntity");

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

    // 审计游记
    async auditNote(noteId, status, reason) {
        const [result] = await pool.query(
            `UPDATE notes_status SET 
       status = ?, reason = ?
       WHERE note_id = ?`,
            [status, reason, noteId]
        );
        return result.affectedRows > 0;
    }

    // 获取游记列表信息
    async getNoteList({ page = 1, pageSize = 10, title , description, created_by,
                          status, sort = 'id', order = 'desc'}) {
        page = parseInt(page, 10);
        pageSize = parseInt(pageSize, 10);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(pageSize) || pageSize < 1) pageSize = 10;

        const offset = (page - 1) * pageSize;

        let query = `SELECT notes.id, notes.title,notes.created_at,notes.updated_at,notes.description,notes.created_by, users.username, users.email,notes_status.status FROM notes join users on users.id = notes.created_by join notes_status on notes_status.note_id  = notes.id  where notes.del_flag = 0`;

        let countQuery = `SELECT COUNT(*) as total FROM notes join notes_status on notes_status.note_id  = notes.id  where notes.del_flag = 0`;
        const params = [];
        const countParams = [];

        if (title) {
            query += ` and notes.title LIKE ?`;
            countQuery += ` and notes.title LIKE ?`;
            params.push(`%${title}%`);
            countParams.push(`%${title}%`);
        }

        if (description) {
            query +=  ` AND notes.description LIKE ?`;
            countQuery += ` AND notes.description LIKE ?`;
            params.push(`%${description}%`);
            countParams.push(`%${description}%`);
        }

        if (created_by) {
            query += ` AND notes.created_by = ?`;
            countQuery += ` AND notes.created_by = ?`;
            params.push(created_by);
            countParams.push(created_by);
        }

        if(status){
            query += ` and notes_status.status = ?`;
            countQuery += ` and notes_status.status = ?`;
            params.push(status);
            countParams.push(status);
        }

        query += ` ORDER BY ${sort} ${order} LIMIT ?, ?`;
        params.push(offset, pageSize);
        const [[{ total }]] = await pool.query(countQuery, countParams); // 获取总数
        const [rows] = await pool.query(query, params); // 获取数据

        return {
            pageNum: page,
            pageSize: pageSize,
            total,
            pages: Math.ceil(total / pageSize),
            list: rows
        };
    }

    // 通过游记id获取附件列表
    async getAttachmentListByNoteId(noteId) {
        const [rows] = await pool.query(
            `SELECT * FROM notes_attachment 
       WHERE note_id = ?`,
            [noteId]
        );
        return rows || null;
    }
}

module.exports = NoteMapper;
