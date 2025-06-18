// src/mappers/UserMapper.js
const pool = require('../utils/database');
const UserEntity = require('../entity/UserEntity');

class UserMapper {
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

    // 创建用户
    async create(user) {
        const [result] = await pool.query(
            `INSERT INTO users SET 
        ${UserEntity.FIELDS.USERNAME} = ?,
        ${UserEntity.FIELDS.PASSWORD} = ?,
        ${UserEntity.FIELDS.EMAIL} = ?,
        ${UserEntity.FIELDS.ROLE} = ?`,
            [user.username, user.password, user.email, user.role || 'guest']
        );
        return this.findById(result.insertId);
    }

    // 通过ID查询
    async findById(id) {
        const [rows] = await pool.query(
            `SELECT * FROM users 
       WHERE ${UserEntity.FIELDS.ID} = ?`,
            [id]
        );
        return rows[0] || null;
    }

    // 通过ID查询用户及其扩展信息
    async findExtraById(id) {
        // 查询基础用户信息
        const [userRows] = await pool.query(
            `SELECT * FROM users 
       WHERE ${UserEntity.FIELDS.ID} = ?`,
            [id]
        );

        if (!userRows[0]) return null;

        // 查询扩展信息
        const [extRows] = await pool.query(
            `SELECT \`key\`, value FROM user_exts 
       WHERE user_id = ?`,
            [id]
        );

        // 合并扩展字段
        const userExtraInfo = extRows.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        return {
            ...userRows[0],
            userExtraInfo
        };
    }


    // 创建或更新扩展字段
    async createOrUpdateExtra(userId, key, value) {
        const executor = this.connection || pool;
        await executor.query(
            `INSERT INTO user_exts (user_id, \`key\`, value)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`,
            [userId, key, value]
        );
        return this.getExtra(userId, key);
    }

    // 获取扩展字段值
    async getExtra(userId, key) {
        const executor = this.connection || pool;
        const [rows] = await executor.query(
            `SELECT value FROM user_exts
       WHERE user_id = ? AND \`key\` = ?`,
            [userId, key]
        );
        return rows[0]?.value || null;
    }

    // 通过用户名查询
    async findByUsername(username) {
        const [rows] = await pool.query(
            `SELECT * FROM users 
       WHERE ${UserEntity.FIELDS.USERNAME} = ?`,
            [username]
        );
        return rows[0] || null;
    }

    // 通过用户邮箱查询
    async findByEmail(email) {
        const [rows] = await pool.query(
            `SELECT * FROM users 
       WHERE ${UserEntity.FIELDS.EMAIL} = ?`,
            [email]
        );
        return rows[0] || null;
    }

    // 更新用户信息
    async updatePassword(id, password) {
        const affectedRows = await pool.query(
            `UPDATE users SET 
       ${UserEntity.FIELDS.PASSWORD} = ? 
       WHERE ${UserEntity.FIELDS.ID} = ?`,
            [password, id]
        );
        return affectedRows[0].affectedRows > 0;
    }

    // 删除用户
    async delete(id) {
        await pool.query(
            `DELETE FROM users 
       WHERE ${UserEntity.FIELDS.ID} = ?`,
            [id]
        );
        return true;
    }

    // 分页查询用户列表
    async list({ page = 1, pageSize = 10, role , username, sort = 'id', order = 'desc'}) {
        page = parseInt(page, 10);
        pageSize = parseInt(pageSize, 10);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(pageSize) || pageSize < 1) pageSize = 10;

        const offset = (page - 1) * pageSize;

        let query = `SELECT * FROM users`;
        let countQuery = `SELECT COUNT(*) as total FROM users`;
        const params = [];
        const countParams = [];

        if (role) {
            query += ` WHERE ${UserEntity.FIELDS.ROLE} = ?`;
            countQuery += ` WHERE ${UserEntity.FIELDS.ROLE} = ?`;
            params.push(role);
            countParams.push(role);
        }

        if (username) {
            query += role == null ? ` WHERE ${UserEntity.FIELDS.USERNAME} LIKE ?` : ` AND ${UserEntity.FIELDS.USERNAME} LIKE ?`;
            countQuery += role == null ? ` WHERE ${UserEntity.FIELDS.USERNAME} LIKE ?` : ` AND ${UserEntity.FIELDS.USERNAME} LIKE ?`;
            params.push(`%${username}%`);
            countParams.push(`%${username}%`);
        }

        // 排序
        query += ` ORDER BY ${UserEntity.FIELDS[sort.toUpperCase()]} ${order}`;

        query += ` LIMIT ? OFFSET ?`;
        // 分页
        params.push(pageSize, offset);

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

    /**
     * 更新用户角色
     * @param {number} userId - 用户ID
     * @param {string} newRole - 新角色名称
     * @returns {Promise<boolean>} 是否更新成功
     */
    async updateUserRole(userId, newRole) {
        console.log('更新用户角色', userId, newRole);
        const [result] = await pool.query(
            `UPDATE users SET role = ? WHERE id = ?`,
            [newRole, userId]
        );
        return result.affectedRows > 0;
    }

    // 判断email是否存在
    async emailExists(email) {
        const [rows] = await pool.query(
            `SELECT 1 FROM users 
       WHERE ${UserEntity.FIELDS.EMAIL} = ? LIMIT 1`,
            [email]
        );
        return rows.length > 0;
    }

    // 查找用户喜爱的帖子列表
    async getFavoriteThreads(userId, { page = 1, pageSize = 10 }) {
        page = parseInt(page, 10);
        pageSize = parseInt(pageSize, 10);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(pageSize) || pageSize < 1) pageSize = 10;

        const offset = (page - 1) * pageSize;

        const query = `
            SELECT t.*, u.username, u.email 
            FROM note_emoji_reactions uf
            JOIN notes t ON uf.note_id = t.id
            JOIN users u ON t.created_by = u.id
            WHERE uf.user_id = ? and uf.emoji = ?
            ORDER BY t.created_at DESC
            LIMIT ? OFFSET ?`;

        const [rows] = await pool.query(query, [userId, '💖', pageSize, offset]);

        return {
            pageNum: page,
            pageSize: pageSize,
            total: rows.length,
            pages: Math.ceil(rows.length / pageSize),
            list: rows
        };
    }

    // 查找用户收藏的帖子列表
    async getCollectionThreads(userId, { page = 1, pageSize = 10 }) {
        page = parseInt(page, 10);
        pageSize = parseInt(pageSize, 10);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(pageSize) || pageSize < 1) pageSize = 10;

        const offset = (page - 1) * pageSize;

        const query = `
            SELECT t.*, u.username, u.email 
            FROM note_emoji_reactions uf
            JOIN notes t ON uf.note_id = t.id
            JOIN users u ON t.created_by = u.id
            WHERE uf.user_id = ? and uf.emoji = ?
            ORDER BY t.created_at DESC
            LIMIT ? OFFSET ?`;

        const [rows] = await pool.query(query, [userId, '🌟', pageSize, offset]);

        return {
            pageNum: page,
            pageSize: pageSize,
            total: rows.length,
            pages: Math.ceil(rows.length / pageSize),
            list: rows
        };
    }
}

module.exports = UserMapper;
