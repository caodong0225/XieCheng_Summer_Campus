// src/mapper/ReplyMapper.js
const pool = require('../utils/database');

class ReplyMapper {
    constructor() {
        this.connection = null; // 事务连接
    }

    // 事务方法
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

    // 创建回复
    async create(replyData) {
        const executor = this.connection || pool;
        const [result] = await executor.query(
            `INSERT INTO thread_replies SET ?`,
            [replyData]
        );
        return this.findByIdWithUser(result.insertId);
    }

    // 通过ID查询回复
    async findById(id) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(
            `SELECT * FROM thread_replies WHERE id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    // 通过ID查询回复（带用户信息）
    async findByIdWithUser(id) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(
            `SELECT r.*, u.username, u.email 
             FROM thread_replies r
             JOIN users u ON r.user_id = u.id
             WHERE r.id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    // 更新回复
    async update(id, updates) {
        const executor = this.connection || pool;
        const [result] = await executor.query(
            `UPDATE thread_replies SET ?
             WHERE id = ?`,
            [updates, id]
        );
        if (result.affectedRows === 0) return null;
        return this.findByIdWithUser(id);
    }

    // 删除回复
    async delete(id) {
        const executor = this.connection || pool;
        await executor.query(
            `DELETE FROM thread_replies WHERE id = ?`,
            [id]
        );
        return true;
    }

    // 查找子回复
    async findChildren(parentId) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(
            `SELECT r.*, u.username, u.email 
             FROM thread_replies r
             JOIN users u ON r.user_id = u.id
             WHERE r.reply_id = ?`,
            [parentId]
        );
        return rows;
    }

    // 根据评论ID查找所有一级回复
    async findByThreadId(threadId) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(
            `SELECT r.*, u.username, u.email 
             FROM thread_replies r
             JOIN users u ON r.user_id = u.id
             WHERE r.thread_id = ? AND r.reply_id IS NULL`,
            [threadId]
        );
        return rows;
    }
}

module.exports = ReplyMapper;
