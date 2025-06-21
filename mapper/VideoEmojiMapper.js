// src/mapper/VideoEmojiMapper.js
const pool = require('../utils/database');

class VideoEmojiMapper {
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

    // 判断用户是否喜欢视频
    async isFavorite(user_id, video_id) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(
            `SELECT COUNT(*) as count FROM video_emoji_reactions 
            WHERE user_id = ? AND video_id = ? AND emoji = ?`,
            [user_id, video_id, '💖']
        );
        return rows[0].count > 0;
    }

    // 判断用户是否收藏视频
    async isCollection(user_id, video_id) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(
            `SELECT COUNT(*) as count FROM video_emoji_reactions 
            WHERE user_id = ? AND video_id = ? AND emoji = ?`,
            [user_id, video_id, '🌟']
        );
        return rows[0].count > 0;
    }

    // 收藏视频
    async collection(user_id, video_id) {
        const executor = this.connection || pool;
        const [result] = await executor.query(
            `INSERT INTO video_emoji_reactions (user_id, video_id, emoji) 
            VALUES (?, ?, ?)`,
            [user_id, video_id, '🌟']
        );
        return result.affectedRows > 0;
    }

    // 取消收藏视频
    async cancelCollection(user_id, video_id) {
        const executor = this.connection || pool;
        const [result] = await executor.query(
            `DELETE FROM video_emoji_reactions 
            WHERE user_id = ? AND video_id = ? AND emoji = ?`,
            [user_id, video_id, '🌟']
        );
        return result.affectedRows > 0;
    }

    // 喜欢视频
    async favorite(user_id, video_id) {
        const executor = this.connection || pool;
        const [result] = await executor.query(
            `INSERT INTO video_emoji_reactions (user_id, video_id, emoji) 
            VALUES (?, ?, ?)`,
            [user_id, video_id, '💖']
        );
        return result.affectedRows > 0;
    }

    // 取消喜欢视频
    async cancelFavorite(user_id, video_id) {
        const executor = this.connection || pool;
        const [result] = await executor.query(
            `DELETE FROM video_emoji_reactions 
            WHERE user_id = ? AND video_id = ? AND emoji = ?`,
            [user_id, video_id, '💖']
        );
        return result.affectedRows > 0;
    }

    // 获取视频的收藏总数
    async getCollectionCount(video_id) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) as count FROM video_emoji_reactions 
            WHERE video_id = ? AND emoji = ?`,
            [video_id, '🌟']
        );
        return rows[0].count;
    }

    // 获取视频的喜欢总数
    async getFavoriteCount(video_id) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) as count FROM video_emoji_reactions 
            WHERE video_id = ? AND emoji = ?`,
            [video_id, '💖']
        );
        return rows[0].count;
    }
}

module.exports = VideoEmojiMapper;
