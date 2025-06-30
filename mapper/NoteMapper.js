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
        console.log(noteData)
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

    async getNoteStatus(noteId){
        const [rows] = await pool.query(
            `SELECT * FROM notes_status 
       WHERE note_id = ?`,
            [noteId]
        );
        return rows[0] || null;
    }

    async updateNoteStatusById(noteId,status){
        const [rows] = await pool.query(
            `UPDATE notes_status SET
         status = ? 
         WHERE note_id = ?`,
            [status, noteId]
        );
        return rows.affectedRows > 0;
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

    // 发送消息推送
    async sendNotification(userId,note_id, note_title, reason) {
        const [result] = await pool.query(
            `insert into notifications (title, content, user_id, sender) values
       (?, ?, ?, ?)`,
            ['游记审核未通过通知', '您的游记<note id = ' + note_id.toString() + '>' + note_title + '</note>审核未通过，未通过理由：' + reason, userId, 'system']
        );
        return result.affectedRows > 0;
    }

    async sendToAdminNotification(noteId, noteTitle, created_by, username) {
        const conn = this.connection || pool; // Use transaction connection or pool
        try {
            // Start transaction
            if (!this.connection) {
                this.connection = await pool.getConnection();
                await this.connection.beginTransaction();
            }

            // Fetch administrators
            const [administrators] = await conn.query(
                `SELECT id FROM users WHERE role = 'admin' or role = 'super-admin'`
            );

            // Insert notifications for each admin
            for (const admin of administrators) {
                const [result] = await conn.query(
                    `INSERT INTO notifications (title, content, user_id, sender)
        VALUES (?, ?, ?, ?)`,
                    [
                        `游记审核通知`,
                        `用户<user id="${created_by}">${username}</user>提交了新的游记<note id="${noteId}">${noteTitle}</note>，请尽快审核。`,
                        admin.id,
                        'admin'
                    ]
                );
                if (result.affectedRows === 0) {
                    throw new Error('发送通知失败');
                }
            }

            // Commit transaction
            if (!this.connection) {
                await this.connection.commit();
                this.connection.release();
                this.connection = null;
            }

            return true;
        } catch (error) {
            // Rollback transaction
            if (this.connection) {
                await this.connection.rollback();
                this.connection.release();
                this.connection = null;
            }
            throw error;
        }
    }

    // 获取游记列表信息
    async getNoteList({ page = 1, pageSize = 10, title , description, created_by,
                          status, sort = 'id', order = 'desc'}) {
        page = parseInt(page, 10);
        pageSize = parseInt(pageSize, 10);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(pageSize) || pageSize < 1) pageSize = 10;

        const offset = (page - 1) * pageSize;

        let query = `SELECT notes.id, notes.title,notes.created_at,notes.updated_at,notes.description,notes.created_by, users.username, users.email,notes_status.status,notes_status.reason FROM notes join users on users.id = notes.created_by join notes_status on notes_status.note_id  = notes.id  where notes.del_flag = 0`;

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

    // 获取指定note_id的所有主帖（含一级回复和统计）
    async getThreadsByNoteId(noteId) {
        const [threads] = await pool.query(`
        SELECT 
            t.*,
            u.username,
            u.email,
            COUNT(DISTINCT r.id) AS reply_count,
            COUNT(DISTINCT tr.id) AS total_reactions
        FROM threads t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN thread_replies r ON r.thread_id = t.id
        LEFT JOIN thread_emoji_reactions tr ON tr.thread_id = t.id
        WHERE t.note_id = ? and t.status = ?
        GROUP BY t.id
        ORDER BY t.weight DESC, t.created_at DESC
    `, [noteId, 'open']);
        return threads;
    }

    // 获取用户收藏/点赞帖子的总数
    async getFavoriteThreadsCount(userId) {
        const conn = this.connection || pool;
        const [result] = await conn.query(
            `SELECT COUNT(*) as total 
        FROM note_emoji_reactions 
        WHERE user_id = ? AND emoji = ?`,
            [userId, '💖']
        );
        return result[0].total;
    }

    async getCollectionThreadsCount(userId) {
        const conn = this.connection || pool;
        const [result] = await conn.query(
            `SELECT COUNT(*) as total 
        FROM note_emoji_reactions 
        WHERE user_id = ? AND emoji = ?`,
            [userId, '🌟']
        );
        return result[0].total;
    }

// 查找用户喜爱的帖子列表（带附件信息）
    async getFavoriteThreads(userId, { page = 1, pageSize = 10 }) {
        page = parseInt(page, 10);
        pageSize = parseInt(pageSize, 10);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(pageSize) || pageSize < 1) pageSize = 10;

        const offset = (page - 1) * pageSize;
        const conn = this.connection || pool; // 使用事务连接或普通连接

        // 1. 查询帖子基本信息
        const query = `
        SELECT 
            n.id, n.title, n.description, n.created_at, n.updated_at,
            u.id AS user_id, u.username, u.email
        FROM note_emoji_reactions uf
        JOIN notes n ON uf.note_id = n.id
        JOIN users u ON n.created_by = u.id
        WHERE uf.user_id = ? AND uf.emoji = ? AND n.del_flag = 0
        ORDER BY uf.id DESC
        LIMIT ? OFFSET ?`;

        const [rows] = await conn.query(query, [userId, '💖', pageSize, offset]);

        if (rows.length === 0) {
            return {
                pageNum: page,
                pageSize: pageSize,
                total: 0,
                pages: 0,
                list: []
            };
        }

        // 2. 获取帖子ID列表
        const noteIds = rows.map(row => row.id);

        // 3. 批量查询附件信息
        const attachments = await this.getAttachmentsByNoteIds(noteIds);

        // 4. 按帖子ID分组获取weight最小的附件
        const attachmentsMap = new Map();
        attachments.forEach(attachment => {
            if (!attachmentsMap.has(attachment.note_id) || attachment.weight < attachmentsMap.get(attachment.note_id).weight) {
                attachmentsMap.set(attachment.note_id, attachment);
            }
        });

        // 5. 合并帖子基本信息和附件信息
        const enrichedList = rows.map(row => {
            return {
                id: row.id,
                title: row.title,
                created_at: row.created_at,
                updated_at: row.updated_at,
                description: row.description,
                created_by: row.user_id,
                username: row.username,
                email: row.email,
                attachments: attachmentsMap.get(row.id) || []
            };
        });

        // 6. 获取总记录数
        const total = await this.getFavoriteThreadsCount(userId);
        const pages = Math.ceil(total / pageSize);

        return {
            pageNum: page,
            pageSize: pageSize,
            total: total,
            pages: pages,
            list: enrichedList
        };
    }

// 查找用户收藏的帖子列表（带附件信息）
    async getCollectionThreads(userId, { page = 1, pageSize = 10 }) {
        page = parseInt(page, 10);
        pageSize = parseInt(pageSize, 10);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(pageSize) || pageSize < 1) pageSize = 10;

        const offset = (page - 1) * pageSize;
        const conn = this.connection || pool; // 使用事务连接或普通连接

        // 1. 查询帖子基本信息
        const query = `
        SELECT 
            n.id, n.title, n.description, n.created_at, n.updated_at,
            u.id AS user_id, u.username, u.email
        FROM note_emoji_reactions uf
        JOIN notes n ON uf.note_id = n.id
        JOIN users u ON n.created_by = u.id
        WHERE uf.user_id = ? AND uf.emoji = ? AND n.del_flag = 0
        ORDER BY uf.id DESC
        LIMIT ? OFFSET ?`;

        const [rows] = await conn.query(query, [userId, '🌟', pageSize, offset]);

        if (rows.length === 0) {
            return {
                pageNum: page,
                pageSize: pageSize,
                total: 0,
                pages: 0,
                list: []
            };
        }

        // 2. 获取帖子ID列表
        const noteIds = rows.map(row => row.id);

        // 3. 批量查询附件信息
        const attachments = await this.getAttachmentsByNoteIds(noteIds);

        // 4. 按帖子ID分组获取weight最小的附件
        const attachmentsMap = new Map();
        attachments.forEach(attachment => {
            if (!attachmentsMap.has(attachment.note_id) || attachment.weight < attachmentsMap.get(attachment.note_id).weight) {
                attachmentsMap.set(attachment.note_id, attachment);
            }
        });

        // 5. 合并帖子基本信息和附件信息
        const enrichedList = rows.map(row => {
            return {
                id: row.id,
                title: row.title,
                created_at: row.created_at,
                updated_at: row.updated_at,
                description: row.description,
                created_by: row.user_id,
                username: row.username,
                email: row.email,
                attachments: attachmentsMap.get(row.id) || []
            };
        });

        // 6. 获取总记录数
        const total = await this.getCollectionThreadsCount(userId);
        const pages = Math.ceil(total / pageSize);

        return {
            pageNum: page,
            pageSize: pageSize,
            total: total,
            pages: pages,
            list: enrichedList
        };
    }

    // 判断游记状态是否为未审核通过
    async getStatusByNoteId(noteId,status){
        const [rows] = await pool.query(
            `SELECT * FROM notes_status 
       WHERE note_id = ? AND status = ?`,
            [noteId, status]
        );
        if (rows.length === 0) return null; // 没有未通过记录
        // 返回最新的未通过记录
        return rows[0];
    }

// 新增方法：批量获取帖子附件
    async getAttachmentsByNoteIds(noteIds) {
        if (noteIds.length === 0) return [];

        const conn = this.connection || pool;
        const [attachments] = await conn.query(
            `SELECT * 
        FROM notes_attachment 
        WHERE note_id IN (?) 
        ORDER BY weight ASC`,
            [noteIds]
        );

        return attachments;
    }
// 获取审批通过的游记列表
    async getApprovedNotes({ page = 1, pageSize = 10, description = null }) {
        page = parseInt(page, 10);
        pageSize = parseInt(pageSize, 10);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(pageSize) || pageSize < 1) pageSize = 10;

        const offset = (page - 1) * pageSize;

        let query = `
        SELECT n.id, n.title, n.description, n.created_at, n.updated_at, 
               u.username, u.email, ns.status, COALESCE(SUM(nv.view_count), 0) AS total_views
        FROM notes n
        JOIN users u ON n.created_by = u.id
        JOIN notes_status ns ON ns.note_id = n.id
        LEFT JOIN note_views nv ON nv.note_id = n.id
        WHERE n.del_flag = 0 AND ns.status = 'approved'
        GROUP BY n.id, u.username, u.email, ns.status`;

        let countQuery = `
        SELECT COUNT(*) as total 
        FROM notes n
        JOIN notes_status ns ON ns.note_id = n.id
        WHERE n.del_flag = 0 AND ns.status = 'approved'`;

        const params = [];
        const countParams = [];

        if (description) {
            query += ` AND n.description LIKE ?`;
            countQuery += ` AND n.description LIKE ?`;
            const likeDescription = `%${description}%`;
            params.push(likeDescription);
            countParams.push(likeDescription);
        }

        query += ` ORDER BY n.created_at DESC LIMIT ? OFFSET ?`;
        params.push(pageSize, offset);

        const [rows] = await pool.query(query, params);
        const [[{ total }]] = await pool.query(countQuery, countParams);

        return {
            pageNum: page,
            pageSize: pageSize,
            total,
            pages: Math.ceil(total / pageSize),
            list: rows
        };
    }
}

module.exports = NoteMapper;
