// src/mapper/VideoViewMapper.js
const pool = require('../utils/database');

class VideoViewMapper {
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
     * 记录或更新观看记录
     * @param {number} userId 用户ID
     * @param {number} videoId 视频ID
     * @returns {Promise<boolean>} 是否成功
     */
    async recordView(userId, videoId) {
        const executor = this.connection || pool;

        try {
            // 尝试更新已有记录
            const [updateResult] = await executor.query(`
                UPDATE video_views 
                SET view_count = view_count + 1, 
                    last_visited_at = CURRENT_TIMESTAMP 
                WHERE user_id = ? AND video_id = ?
            `, [userId, videoId]);

            if (updateResult.affectedRows === 0) {
                // 没有更新到记录，则插入新记录
                await executor.query(`
                    INSERT INTO video_views (user_id, video_id) 
                    VALUES (?, ?)
                `, [userId, videoId]);
            }

            return true;
        } catch (error) {
            console.error('记录观看行为失败:', error);
            return false;
        }
    }

    /**
     * 获取特定用户对特定视频的观看记录
     * @param {number} userId 用户ID
     * @param {number} videoId 视频ID
     * @returns {Promise<Object|null>} 观看记录对象
     */
    async getUserVideoView(userId, videoId) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(`
            SELECT * 
            FROM video_views 
            WHERE user_id = ? AND video_id = ?
        `, [userId, videoId]);

        return rows[0] || null;
    }

    /**
     * 获取视频的总观看次数
     * @param {number} videoId 视频ID
     * @returns {Promise<number>} 总观看次数
     */
    async getTotalViewsByVideoId(videoId) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(`
            SELECT SUM(view_count) AS total_views 
            FROM video_views 
            WHERE video_id = ?
        `, [videoId]);

        return rows[0]?.total_views || 0;
    }

    /**
     * 获取用户观看过的视频列表（分页）
     * @param {number} userId 用户ID
     * @param {number} page 页码
     * @param {number} pageSize 每页数量
     * @returns {Promise<Array>} 观看记录列表
     */
    async getViewedVideosByUserId(userId, page = 1, pageSize = 10) {
        const offset = (page - 1) * pageSize;
        const executor = this.connection || pool;

        const [rows] = await executor.query(`
            SELECT 
                vv.*,
                v.description AS video_title,
                v.thumbnail AS video_thumbnail,
                v.link AS video_link
            FROM video_views vv
            INNER JOIN videos v ON vv.video_id = v.id
            WHERE vv.user_id = ?
            ORDER BY vv.last_visited_at DESC
            LIMIT ? OFFSET ?
        `, [userId, pageSize, offset]);

        return rows;
    }

    /**
     * 获取用户最近观看的视频
     * @param {number} userId 用户ID
     * @param {number} limit 限制数量
     * @returns {Promise<Array>} 最近观看的视频列表
     */
    async getRecentViewedVideos(userId, limit = 5) {
        const executor = this.connection || pool;

        const [rows] = await executor.query(`
            SELECT 
                vv.video_id,
                v.description AS video_title,
                v.thumbnail AS video_thumbnail,
                vv.last_visited_at
            FROM video_views vv
            INNER JOIN videos v ON vv.video_id = v.id
            WHERE vv.user_id = ?
            ORDER BY vv.last_visited_at DESC
            LIMIT ?
        `, [userId, limit]);

        return rows;
    }

    /**
     * 获取视频的观看用户列表（分页）
     * @param {number} videoId 视频ID
     * @param {number} page 页码
     * @param {number} pageSize 每页数量
     * @returns {Promise<Array>} 观看用户列表
     */
    async getVideoViewers(videoId, page = 1, pageSize = 10) {
        const offset = (page - 1) * pageSize;
        const executor = this.connection || pool;

        const [rows] = await executor.query(`
            SELECT 
                vv.*,
                u.username,
                u.avatar
            FROM video_views vv
            INNER JOIN users u ON vv.user_id = u.id
            WHERE vv.video_id = ?
            ORDER BY vv.last_visited_at DESC
            LIMIT ? OFFSET ?
        `, [videoId, pageSize, offset]);

        return rows;
    }

    /**
     * 删除特定视频的所有观看记录
     * @param {number} videoId 视频ID
     * @returns {Promise<boolean>} 是否成功
     */
    async deleteByVideoId(videoId) {
        const executor = this.connection || pool;
        const [result] = await executor.query(`
            DELETE FROM video_views 
            WHERE video_id = ?
        `, [videoId]);

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
            DELETE FROM video_views 
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
            DELETE FROM video_views 
            WHERE id = ?
        `, [id]);

        return result.affectedRows > 0;
    }

    /**
     * 获取热门视频（按观看次数排序）
     * @param {Object} options 选项
     * @param {number} options.page 页码
     * @param {number} options.pageSize 每页数量
     * @param {number} options.days 最近天数（可选）
     * @returns {Promise<Array>} 热门视频列表
     */
    async getPopularVideos({ page = 1, pageSize = 10, days } = {}) {
        const offset = (page - 1) * pageSize;
        const executor = this.connection || pool;

        let whereClause = '';
        let params = [pageSize, offset];

        if (days) {
            whereClause = 'WHERE vv.last_visited_at >= CURDATE() - INTERVAL ? DAY';
            params.unshift(days);
        }

        const [rows] = await executor.query(`
            SELECT 
                v.id AS video_id,
                v.description,
                v.link,
                v.thumbnail,
                SUM(vv.view_count) AS total_views,
                COUNT(DISTINCT vv.user_id) AS unique_viewers
            FROM videos v
            INNER JOIN video_views vv ON v.id = vv.video_id
            ${whereClause}
            GROUP BY v.id
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
            FROM video_views 
            WHERE user_id = ?
        `, [userId]);

        const [uniqueVideos] = await executor.query(`
            SELECT COUNT(DISTINCT video_id) AS unique_videos 
            FROM video_views 
            WHERE user_id = ?
        `, [userId]);

        const [recentActivity] = await executor.query(`
            SELECT MAX(last_visited_at) AS last_watched 
            FROM video_views 
            WHERE user_id = ?
        `, [userId]);

        return {
            totalViews: totalViews[0]?.total_views || 0,
            uniqueVideos: uniqueVideos[0]?.unique_videos || 0,
            lastWatched: recentActivity[0]?.last_watched || null
        };
    }

    // 获取视频的观看记录统计
    async getVideoViewStats(videoId) {
        const executor = this.connection || pool;

        const [totalViews] = await executor.query(`
            SELECT SUM(view_count) AS total_views 
            FROM video_views 
            WHERE video_id = ?
        `, [videoId]);

        const [uniqueUsers] = await executor.query(`
            SELECT COUNT(DISTINCT user_id) AS unique_users 
            FROM video_views 
            WHERE video_id = ?
        `, [videoId]);

        return {
            totalViews: totalViews[0]?.total_views || 0,
            uniqueUsers: uniqueUsers[0]?.unique_users || 0
        };
    }
}

module.exports = VideoViewMapper;
