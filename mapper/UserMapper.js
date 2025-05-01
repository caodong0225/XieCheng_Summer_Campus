// src/mappers/UserMapper.js
const pool = require('../utils/database');
const UserEntity = require('../entity/UserEntity');

class UserMapper {
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
        await pool.query(
            `UPDATE users SET 
       ${UserEntity.FIELDS.PASSWORD} = ? 
       WHERE ${UserEntity.FIELDS.ID} = ?`,
            [password, id]
        );
        return this.findById(id);
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
    async list({ page = 1, pageSize = 10, role }) {
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

        query += ` LIMIT ? OFFSET ?`;
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


    // 判断email是否存在
    async emailExists(email) {
        const [rows] = await pool.query(
            `SELECT 1 FROM users 
       WHERE ${UserEntity.FIELDS.EMAIL} = ? LIMIT 1`,
            [email]
        );
        return rows.length > 0;
    }
}

module.exports = UserMapper;