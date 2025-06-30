const pool = require('../utils/database');

class NotificationMapper {
    constructor() {
        this.connection = null; // 事务连接
    }

    // 事务管理方法
    async beginTransaction() {
        this.connection = await pool.getConnection();
        await this.connection.beginTransaction();
    }

    async commit() {
        if (this.connection) {
            await this.connection.commit();
            this.connection.release();
            this.connection = null;
        }
    }

    async rollback() {
        if (this.connection) {
            await this.connection.rollback();
            this.connection.release();
            this.connection = null;
        }
    }

    // 核心 CRUD 操作
    async create(notificationData) {
        const conn = this.connection || pool;
        const [result] = await conn.query(
            `INSERT INTO notifications SET 
       title = ?, content = ?, user_id = ?, sender = ?`,
            [notificationData.title, notificationData.content, notificationData.user_id, notificationData.sender]
        );
        return result.insertId;
    }


    async getById(id) {
        const [rows] = await pool.query(
            `SELECT * FROM notifications WHERE id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    async update(id, updateData) {
        const conn = this.connection || pool;
        const [result] = await conn.query(
            `UPDATE notifications SET 
       title = ?, content = ?, is_read = ?
       WHERE id = ?`,
            [updateData.title, updateData.content, updateData.is_read, id]
        );
        return result.affectedRows > 0;
    }

    async delete(id) {
        const [result] = await pool.query(
            `DELETE FROM notifications WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }

    // 业务相关方法
    async markAsRead(id) {
        const [result] = await pool.query(
            `UPDATE notifications SET is_read = 1 WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }

    // 获取用户未读消息数量
    async getUnreadCount(userId) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = ? AND is_read = 0`,
            [userId]
        );
        return rows[0].count;
    }

    // 标记所有通知为已读
    async markAllAsRead(userId, sender) {
        const [result] = await pool.query(
            `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND sender = ?`,
            [userId, sender]
        );
        return result.affectedRows > 0;
    }

    async getUserNotifications(userId, page = 1, pageSize = 10,sender = "system") {
        const offset = (page - 1) * pageSize;
        const [rows] = await pool.query(
            `SELECT * FROM notifications 
       WHERE user_id = ? AND sender = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
            [userId, sender, pageSize, offset]
        );
        const [countRows] = await pool.query(
            `SELECT COUNT(*) as total FROM notifications
         WHERE user_id = ? AND sender = ?`,
            [userId, sender]
        );
        const total = countRows[0].total;
        const totalPages = Math.ceil(total / pageSize);
        return {
            pageNum: page,
            pageSize: pageSize,
            total: total,
            pages: totalPages,
            list: rows
        };
    }

    async checkOwnership(id, userId) {
        const [rows] = await pool.query(
            `SELECT id FROM notifications 
       WHERE id = ? AND user_id = ?`,
            [id, userId]
        );
        return rows.length > 0;
    }
}

module.exports = NotificationMapper;
