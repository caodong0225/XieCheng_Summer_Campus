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

    async create(threadData) {
        const [result] = await pool.query(
            `INSERT INTO threads SET ?
            `,
            [threadData]
        );
        return this.findByIdWithUser(result.insertId);
    }

    async findById(id) {
        const [rows] = await pool.query(
            `SELECT * FROM threads WHERE id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    async findByIdWithUser(id) {
        const [rows] = await pool.query(`
            SELECT t.*, u.username, u.email
            FROM threads t
            LEFT JOIN users u ON t.user_id = u.id
            WHERE t.id = ?
        `, [id]);
        return rows[0] || null;
    }

    async update(id, updates) {
        const [result] = await pool.query(
            `UPDATE threads SET ?
             WHERE id = ?`,
            [updates, id]
        );
        if (result.affectedRows === 0) return null;
        return this.findByIdWithUser(id);
    }

    async delete(id) {
        await pool.query(
            `DELETE FROM threads WHERE id = ?`,
            [id]
        );
        return true;
    }

    // 获取主帖表情反应
    async getThreadReactions(threadIds) {
        if (threadIds.length === 0) return [];
        const [reactions] = await pool.query(`
        SELECT 
            thread_id,
            emoji,
            COUNT(*) AS count,
            GROUP_CONCAT(user_id) AS users
        FROM thread_emoji_reactions
        WHERE thread_id IN (?)
        GROUP BY thread_id, emoji
    `, [threadIds]);
        return reactions;
    }

    // 获取一级回复及子回复统计
    async getFirstLevelReplies(threadIds) {
        if (threadIds.length === 0) return [];
        const [replies] = await pool.query(`
        SELECT 
            r.*,
            u.username,
            u.email,
            COUNT(child.id) AS child_replies_count
        FROM thread_replies r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN thread_replies child ON child.reply_id = r.id
        WHERE r.thread_id IN (?)
          AND r.reply_id IS NULL
        GROUP BY r.id
        ORDER BY r.created_at ASC
    `, [threadIds]);
        return replies;
    }

    async getAllReplies(threadIds) {
        if (threadIds.length === 0) return [];
        const [replies] = await pool.query(`
        SELECT 
            r.*,
            u.username,
            u.email,
            COUNT(child.id) AS child_replies_count
        FROM thread_replies r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN thread_replies child ON child.reply_id = r.id
        WHERE r.thread_id IN (?)
        GROUP BY r.id
        ORDER BY r.created_at ASC
    `, [threadIds]);
        return replies;
    }
}

module.exports = ThreadMapper;
