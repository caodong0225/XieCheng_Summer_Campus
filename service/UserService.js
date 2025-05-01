// src/services/UserService.js
const UserMapper = require('../mapper/UserMapper');
const UserEntity = require('../entity/UserEntity');

class UserService {
    constructor() {
        this.mapper = new UserMapper();
    }

    // 用户注册
    async register(userData) {
        // 校验输入
        const { error, value } = UserEntity.registerSchema.validate(userData);
        if (error) throw new Error(error.details[0].message);
        // 检查唯一性
        if (await this.mapper.findByUsername(value.username)) {
            throw new Error('用户名已存在');
        }

        if (await this.mapper.emailExists(value.email)) {
            throw new Error('邮箱已注册');
        }

        // 密码加密
        value.password = await UserEntity.hashPassword(value.password);
        return this.mapper.create(value);
    }

    // 用户登录
    async login(username, password) {
        const user = username.includes('@')
            ? await this.mapper.findByEmail(username)
            : await this.mapper.findByUsername(username);

        if (!user || !(await UserEntity.verifyPassword(password, user.password))) {
            throw new Error('认证失败');
        }

        return UserEntity.sanitize(user);
    }

    // 更新用户信息
    async updateUser(userId, updates) {
        const { error } = UserEntity.updateSchema.validate(updates);
        if (error) throw new Error(error.details[0].message);

        if (updates.password) {
            updates.password = await UserEntity.hashPassword(updates.password);
        }else{
            throw new Error('请输入新密码');
        }

        return this.mapper.updatePassword(userId, updates.password);
    }

    // 检查邮箱是否存在
    async emailExists(email) {
        const [rows] = await this.mapper.findByEmail(email);
        return rows.length > 0;
    }

    // 获取用户列表（带过滤）
    async listUsers(filter) {
        return this.mapper.list(filter);
    }

    // 通过用户id获取用户
    async getUserById(userId) {
        const user = await this.mapper.findById(userId);
        if (!user) throw new Error('用户不存在');
        return UserEntity.sanitize(user);
    }
}

module.exports = UserService;