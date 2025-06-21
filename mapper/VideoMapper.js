// src/mappers/VideoMapper.js
const pool = require('../utils/database');

class VideoMapper {
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

    // ================= 基础CRUD操作 =================
    async create(videoData) {
        const executor = this.connection || pool;
        const [result] = await executor.query(
            `INSERT INTO videos SET ?`,
            [videoData]
        );
        return this.findById(result.insertId);
    }

    async findById(id) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(
            `SELECT * FROM videos WHERE id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    async update(id, updates) {
        const executor = this.connection || pool;
        const [result] = await executor.query(
            `UPDATE videos SET ? WHERE id = ?`,
            [updates, id]
        );
        if (result.affectedRows === 0) return null;
        return this.findById(id);
    }

    async delete(id) {
        const executor = this.connection || pool;
        const [result] = await executor.query(
            `DELETE FROM videos WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }

    // ================= 高级查询方法 =================

    /**
     * 通过ID查询视频及用户信息
     * @param {number} id 视频ID
     * @returns {Promise<Object>} 包含用户信息的视频对象
     */
    async findByIdWithUser(id) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(`
            SELECT 
                v.id, 
                v.created_at, 
                v.updated_at, 
                v.description, 
                v.link, 
                v.thumbnail,
                u.id AS user_id,
                u.username,
                u.email
            FROM videos v
            INNER JOIN users u ON v.created_by = u.id
            WHERE v.id = ?
        `, [id]);
        return rows[0] || null;
    }

    /**
     * 根据用户ID查询其上传的所有视频
     */
    async findByUserId(userId, page = 1, pageSize = 10, description = null) {
        const offset = (page - 1) * pageSize;
        const executor = this.connection || pool;

        if (description == null) {
            const [rows] = await executor.query(`
            SELECT 
                v.id, 
                v.created_at, 
                v.description, 
                v.link, 
                v.thumbnail,
                IFNULL(SUM(vv.view_count), 0) AS play_count
            FROM videos v
            LEFT JOIN video_views vv ON v.id = vv.video_id
            WHERE v.created_by = ?
            GROUP BY v.id
            ORDER BY v.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, pageSize, offset]);
            return rows;
        }else{
            const [rows] = await executor.query(`
            SELECT 
                v.id, 
                v.created_at, 
                v.description, 
                v.link, 
                v.thumbnail,
                IFNULL(SUM(vv.view_count), 0) AS play_count
            FROM videos v
            LEFT JOIN video_views vv ON v.id = vv.video_id
            WHERE v.created_by = ? AND v.description LIKE ?
            GROUP BY v.id
            ORDER BY v.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, `%${description}%`, pageSize, offset]);
            return rows;
        }
    }

    /**
     * 获取用户上传的视频总数
     * @param {number} userId 用户ID
     * @returns {Promise<number>} 视频总数
     */
    async countByUserId(userId,description = null) {
        const executor = this.connection || pool;
        if (description == null) {
            const [rows] = await executor.query(`
            SELECT COUNT(*) AS total 
            FROM videos 
            WHERE created_by = ?
        `, [userId]);
            return rows[0]?.total || 0;
        }else{
            const [rows] = await executor.query(`
            SELECT COUNT(*) AS total 
            FROM videos 
            WHERE created_by = ? AND description LIKE ?
        `, [userId, `%${description}%`]);
            return rows[0]?.total || 0;
        }
    }

    /**
     * 获取最新视频列表（带分页）
     * @param {Object} options 分页选项
     * @param {number} options.page 页码
     * @param {number} options.pageSize 每页数量
     * @returns {Promise<Array>} 视频列表
     */
    async findLatest({ page = 1, pageSize = 10 } = {}) {
        const offset = (page - 1) * pageSize;
        const executor = this.connection || pool;

        const [rows] = await executor.query(`
            SELECT 
                v.id, 
                v.created_at, 
                v.description, 
                v.link, 
                v.thumbnail,
                u.username
            FROM videos v
            INNER JOIN users u ON v.created_by = u.id
            ORDER BY v.created_at DESC
            LIMIT ? OFFSET ?
        `, [pageSize, offset]);

        return rows;
    }

    /**
     * 获取视频总数
     * @returns {Promise<number>} 视频总数
     */
    async countAll() {
        const executor = this.connection || pool;
        const [rows] = await executor.query(
            `SELECT COUNT(*) AS total FROM videos`
        );
        return rows[0]?.total || 0;
    }

    /**
     * 通过链接查找视频（用于避免重复上传）
     * @param {string} link 视频链接
     * @returns {Promise<Object>} 视频对象
     */
    async findByLink(link) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(
            `SELECT * FROM videos WHERE link = ?`,
            [link]
        );
        return rows[0] || null;
    }

    /**
     * 通过缩略图链接查找视频
     * @param {string} thumbnail 缩略图链接
     * @returns {Promise<Object>} 视频对象
     */
    async findByThumbnail(thumbnail) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(
            `SELECT * FROM videos WHERE thumbnail = ?`,
            [thumbnail]
        );
        return rows[0] || null;
    }

    // ================= 批量操作 =================

    /**
     * 批量删除用户的所有视频
     * @param {number} userId 用户ID
     * @returns {Promise<boolean>} 是否成功
     */
    async deleteAllByUserId(userId) {
        const executor = this.connection || pool;
        const [result] = await executor.query(
            `DELETE FROM videos WHERE created_by = ?`,
            [userId]
        );
        return result.affectedRows > 0;
    }

    /**
     * 批量更新视频描述
     * @param {Array<number>} ids 视频ID数组
     * @param {string} description 新的描述
     * @returns {Promise<boolean>} 是否成功
     */
    async batchUpdateDescription(ids, description) {
        if (!ids.length) return false;

        const executor = this.connection || pool;
        const [result] = await executor.query(`
            UPDATE videos 
            SET description = ? 
            WHERE id IN (?)
        `, [description, ids]);

        return result.affectedRows > 0;
    }

    // 获取未读视频列表
    async getUnreadVideos(userId, page = 1, pageSize = 10) {
        const offset = (page - 1) * pageSize;
        const executor = this.connection || pool;

        const [rows] = await executor.query(`
            SELECT v.id, v.created_at, v.description, v.link, v.thumbnail
            FROM videos v
            WHERE v.id not IN (
                SELECT video_id FROM video_views WHERE user_id = ?
            )
            ORDER BY v.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, pageSize, offset]);

        return rows;
    }
}

module.exports = VideoMapper;
