// src/mapper/ThreadEmojiMapper.js
const pool = require('../utils/database');

class ThreadEmojiMapper {
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


    // 判断用户是否有喜欢
    async isFavorite(user_id, thread_id) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(
            `SELECT COUNT(*) as count FROM thread_emoji_reactions 
            WHERE user_id = ? and thread_id = ? and emoji = ?`,
            [user_id, thread_id, '💖']  // 使用参数占位符
        );
        return rows[0].count > 0;
    }

    // 判断用户是否有收藏
    async isCollection(user_id, thread_id) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(
            `SELECT COUNT(*) as count FROM thread_emoji_reactions 
            WHERE user_id = ? and thread_id = ? and emoji = ?`,
            [user_id, thread_id, '🌟']  // 使用参数占位符
        );
        return rows[0].count > 0;
    }

    // 收藏
    async collection(user_id, thread_id) {
        const executor = this.connection || pool;
        const [result] = await executor.query(
            `INSERT INTO thread_emoji_reactions (user_id, thread_id, emoji) 
            VALUES (?, ?, ?)`,
            [user_id, thread_id, '🌟']
        );
        return result.affectedRows > 0;
    }
    // 取消收藏
    async cancelCollection(user_id, thread_id) {
        const executor = this.connection || pool;
        const [result] = await executor.query(
            `DELETE FROM thread_emoji_reactions 
            WHERE user_id = ? and thread_id = ? and emoji = ?`,
            [user_id, thread_id, '🌟']
        );
        return result.affectedRows > 0;
    }
    // 喜欢
    async favorite(user_id, thread_id) {
        const executor = this.connection || pool;
        const [result] = await executor.query(
            `INSERT INTO thread_emoji_reactions (user_id, thread_id, emoji) 
            VALUES (?, ?, ?)`,
            [user_id, thread_id, '💖']
        );
        return result.affectedRows > 0;
    }
    // 取消喜欢
    async cancelFavorite(user_id, thread_id) {
        const executor = this.connection || pool;
        const [result] = await executor.query(
            `DELETE FROM thread_emoji_reactions 
            WHERE user_id = ? and thread_id = ? and emoji = ?`,
            [user_id, thread_id, '💖']
        );
        return result.affectedRows > 0;
    }

}

module.exports = ThreadEmojiMapper;
