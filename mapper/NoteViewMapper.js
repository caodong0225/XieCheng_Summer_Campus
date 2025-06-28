// src/mapper/NoteViewMapper.js
const pool = require('../utils/database');

class NoteViewMapper {
    constructor() {
        this.connection = null; // 事务连接
    }

    // ================= 事务管理 =================
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

    // ================= 核心功能 =================

    /**
     * 记录或更新帖子观看记录
     * @param {number} userId 用户ID
     * @param {number} noteId 帖子ID
     * @returns {Promise<boolean>} 是否成功
     */
    async recordView(userId, noteId) {
        const executor = this.connection || pool;

        try {
            // 尝试更新已有记录
            const [updateResult] = await executor.query(`
                UPDATE note_views 
                SET view_count = view_count + 1, 
                    last_visited_at = CURRENT_TIMESTAMP 
                WHERE user_id = ? AND note_id = ?
            `, [userId, noteId]);

            if (updateResult.affectedRows === 0) {
                // 没有更新到记录，则插入新记录
                await executor.query(`
                    INSERT INTO note_views (user_id, note_id) 
                    VALUES (?, ?)
                `, [userId, noteId]);
            }

            return true;
        } catch (error) {
            console.error('记录帖子观看行为失败:', error);
            return false;
        }
    }

    /**
     * 获取特定用户对特定帖子的观看记录
     * @param {number} userId 用户ID
     * @param {number} noteId 帖子ID
     * @returns {Promise<Object|null>} 观看记录对象
     */
    async getUserNoteView(userId, noteId) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(`
            SELECT * 
            FROM note_views 
            WHERE user_id = ? AND note_id = ?
        `, [userId, noteId]);

        return rows[0] || null;
    }

    /**
     * 获取帖子的总观看次数
     * @param {number} noteId 帖子ID
     * @returns {Promise<number>} 总观看次数
     */
    async getTotalViewsByNoteId(noteId) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(`
            SELECT SUM(view_count) AS total_views 
            FROM note_views 
            WHERE note_id = ?
        `, [noteId]);

        return rows[0]?.total_views || 0;
    }

    /**
     * 获取用户观看过的帖子列表（分页）
     * @param {number} userId 用户ID
     * @param {number} page 页码
     * @param {number} pageSize 每页数量
     * @returns {Promise<Array>} 观看记录列表
     */
    async getViewedNotesByUserId(userId, page = 1, pageSize = 10) {
        const offset = (page - 1) * pageSize;
        const executor = this.connection || pool;

        const [rows] = await executor.query(`
            SELECT 
                nv.*,
                n.title AS note_title,
                n.content AS note_content,
                n.created_at AS note_created_at
            FROM note_views nv
            INNER JOIN notes n ON nv.note_id = n.id
            WHERE nv.user_id = ?
            ORDER BY nv.last_visited_at DESC
            LIMIT ? OFFSET ?
        `, [userId, pageSize, offset]);

        return rows;
    }

    /**
     * 获取用户最近观看的帖子
     */
    async getRecentViewedNotes(userId, page = 1, pageSize = 10) {
        const executor = this.connection || pool;

        const [rows] = await executor.query(`
            SELECT 
                nv.note_id,
                n.title AS note_title,
                nv.last_visited_at
            FROM note_views nv
            INNER JOIN notes n ON nv.note_id = n.id
            WHERE nv.user_id = ?
            ORDER BY nv.last_visited_at DESC
            LIMIT ? OFFSET ?
        `, [userId, pageSize, (page - 1) * pageSize]);

        return rows;
    }

    /**
     * 获取帖子的观看用户列表（分页）
     * @param {number} noteId 帖子ID
     * @param {number} page 页码
     * @param {number} pageSize 每页数量
     * @returns {Promise<Array>} 观看用户列表
     */
    async getNoteViewers(noteId, page = 1, pageSize = 10) {
        const offset = (page - 1) * pageSize;
        const executor = this.connection || pool;

        const [rows] = await executor.query(`
            SELECT 
                nv.*,
                u.username,
                u.avatar
            FROM note_views nv
            INNER JOIN users u ON nv.user_id = u.id
            WHERE nv.note_id = ?
            ORDER BY nv.last_visited_at DESC
            LIMIT ? OFFSET ?
        `, [noteId, pageSize, offset]);

        return rows;
    }

    /**
     * 删除特定帖子的所有观看记录
     * @param {number} noteId 帖子ID
     * @returns {Promise<boolean>} 是否成功
     */
    async deleteByNoteId(noteId) {
        const executor = this.connection || pool;
        const [result] = await executor.query(`
            DELETE FROM note_views 
            WHERE note_id = ?
        `, [noteId]);

        return result.affectedRows > 0;
    }

    /**
     * 删除特定用户的所有观看记录
     * @param {number} userId 用户ID
     * @returns {Promise<boolean>} 是否成功
     */
    async deleteByUserId(userId) {
        const executor = this.connection || pool;
        const [result] = await executor.query(`
            DELETE FROM note_views 
            WHERE user_id = ?
        `, [userId]);

        return result.affectedRows > 0;
    }

    /**
     * 删除特定观看记录
     * @param {number} id 观看记录ID
     * @returns {Promise<boolean>} 是否成功
     */
    async deleteById(id) {
        const executor = this.connection || pool;
        const [result] = await executor.query(`
            DELETE FROM note_views 
            WHERE id = ?
        `, [id]);

        return result.affectedRows > 0;
    }

    /**
     * 获取热门帖子（按观看次数排序）
     * @param {Object} options 选项
     * @param {number} options.page 页码
     * @param {number} options.pageSize 每页数量
     * @param {number} options.days 最近天数（可选）
     * @returns {Promise<Array>} 热门帖子列表
     */
    async getPopularNotes({ page = 1, pageSize = 10, days } = {}) {
        const offset = (page - 1) * pageSize;
        const executor = this.connection || pool;

        let whereClause = '';
        let params = [pageSize, offset];

        if (days) {
            whereClause = 'WHERE nv.last_visited_at >= CURDATE() - INTERVAL ? DAY';
            params.unshift(days);
        }

        const [rows] = await executor.query(`
            SELECT 
                n.id AS note_id,
                n.title,
                n.content,
                n.created_at,
                SUM(nv.view_count) AS total_views,
                COUNT(DISTINCT nv.user_id) AS unique_viewers
            FROM notes n
            INNER JOIN note_views nv ON n.id = nv.note_id
            ${whereClause}
            GROUP BY n.id
            ORDER BY total_views DESC
            LIMIT ? OFFSET ?
        `, params);

        return rows;
    }

    /**
     * 获取用户的观看历史统计
     * @param {number} userId 用户ID
     * @returns {Promise<Object>} 统计信息
     */
    async getUserViewStats(userId) {
        const executor = this.connection || pool;

        const [totalViews] = await executor.query(`
            SELECT SUM(view_count) AS total_views 
            FROM note_views 
            WHERE user_id = ?
        `, [userId]);

        const [uniqueNotes] = await executor.query(`
            SELECT COUNT(DISTINCT note_id) AS unique_notes 
            FROM note_views 
            WHERE user_id = ?
        `, [userId]);

        const [recentActivity] = await executor.query(`
            SELECT MAX(last_visited_at) AS last_viewed 
            FROM note_views 
            WHERE user_id = ?
        `, [userId]);

        return {
            totalViews: totalViews[0]?.total_views || 0,
            uniqueNotes: uniqueNotes[0]?.unique_notes || 0,
            lastViewed: recentActivity[0]?.last_viewed || null
        };
    }

    /**
     * 获取帖子的观看记录统计
     * @param {number} noteId 帖子ID
     * @returns {Promise<Object>} 统计信息
     */
    async getNoteViewStats(noteId) {
        const executor = this.connection || pool;

        const [totalViews] = await executor.query(`
            SELECT SUM(view_count) AS total_views 
            FROM note_views 
            WHERE note_id = ?
        `, [noteId]);

        const [uniqueUsers] = await executor.query(`
            SELECT COUNT(DISTINCT user_id) AS unique_users 
            FROM note_views 
            WHERE note_id = ?
        `, [noteId]);

        return {
            totalViews: totalViews[0]?.total_views || 0,
            uniqueUsers: uniqueUsers[0]?.unique_users || 0
        };
    }

    /**
     * 删除特定用户对特定帖子的观看记录
     * @param {number} userId 用户ID
     * @param {number} noteId 帖子ID
     * @returns {Promise<boolean>} 是否成功
     */
    async deleteNoteViews(userId, noteId) {
        const executor = this.connection || pool;
        const [result] = await executor.query(`
            DELETE FROM note_views 
            WHERE note_id = ? AND user_id = ?
        `, [noteId, userId]);

        return result.affectedRows > 0;
    }
}

module.exports = NoteViewMapper;