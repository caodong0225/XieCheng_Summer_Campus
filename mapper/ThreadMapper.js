// src/mappers/ThreadMapper.js
const pool = require('../utils/database');

class ThreadMapper {
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

    // 创建评论
    async create(content, user_id, note_id) {
        const executor = this.connection || pool;
        const [result] = await executor.query(
            `INSERT INTO threads SET
                content = ?,
                user_id = ?,
                note_id = ?`
            [
                content,
                user_id,
                note_id
            ]
        );
        return this.findById(result.insertId);
    }

    // 通过ID查询
    async findById(id) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(
            `SELECT * FROM threads 
            WHERE id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    // 通过note_id查询帖子数量
    async countReplyByNoteId(note_id) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(
            `SELECT COUNT(*) as count FROM threads 
            WHERE note_id = ?`,
            [note_id]
        );
        return rows[0].count;
    }

    async countFavoriteByNoteId(note_id) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(
            `SELECT COUNT(*) as count FROM thread_emoji_reactions 
        WHERE note_id = ? AND emoji = ?`,  // 使用参数占位符
            [note_id, '💖']  // 添加emoji参数
        );
        return rows[0].count;
    }

    // 计算收藏数
    async countCollectionByNoteId(note_id) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(
            `SELECT COUNT(*) as count FROM thread_emoji_reactions 
            WHERE note_id = ? and emoji = ?`,
            [note_id, '🌟']  // 使用参数占位符
        );
        console.log(rows);
        return rows[0].count;
    }

    // 判断用户是否有喜欢
    async isFavorite(user_id, note_id) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(
            `SELECT COUNT(*) as count FROM thread_emoji_reactions 
            WHERE user_id = ? and note_id = ? and emoji = ?`,
            [user_id, note_id, '💖']  // 使用参数占位符
        );
        return rows[0].count > 0;
    }

    // 判断用户是否有收藏
    async isCollection(user_id, note_id) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(
            `SELECT COUNT(*) as count FROM thread_emoji_reactions 
            WHERE user_id = ? and note_id = ? and emoji = ?`,
            [user_id, note_id, '🌟']  // 使用参数占位符
        );
        return rows[0].count > 0;
    }

    // 收藏
    async collection(user_id, note_id) {
        const executor = this.connection || pool;
        const [result] = await executor.query(
            `INSERT INTO thread_emoji_reactions (user_id, note_id, emoji) 
            VALUES (?, ?, ?)`,
            [user_id, note_id, '🌟']
        );
        return result.affectedRows > 0;
    }
    // 取消收藏
    async cancelCollection(user_id, note_id) {
        const executor = this.connection || pool;
        const [result] = await executor.query(
            `DELETE FROM thread_emoji_reactions 
            WHERE user_id = ? and note_id = ? and emoji = ?`,
            [user_id, note_id, '🌟']
        );
        return result.affectedRows > 0;
    }
    // 喜欢
    async favorite(user_id, note_id) {
        const executor = this.connection || pool;
        const [result] = await executor.query(
            `INSERT INTO thread_emoji_reactions (user_id, note_id, emoji) 
            VALUES (?, ?, ?)`,
            [user_id, note_id, '💖']
        );
        return result.affectedRows > 0;
    }
    // 取消喜欢
    async cancelFavorite(user_id, note_id) {
        const executor = this.connection || pool;
        const [result] = await executor.query(
            `DELETE FROM thread_emoji_reactions 
            WHERE user_id = ? and note_id = ? and emoji = ?`,
            [user_id, note_id, '💖']
        );
        return result.affectedRows > 0;
    }

}

module.exports = ThreadMapper;
