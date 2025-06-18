// src/services/UserService.js
const UserMapper = require('../mapper/UserMapper');
const UserEntity = require('../entity/UserEntity');
const {ROLES} = require("../constants");

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
        const user = await this.mapper.findExtraById(userId);
        if (!user) throw new Error('用户不存在');
        return UserEntity.sanitize(user);
    }

    // 更新用户额外信息
    async batchUpdateExtras(userId, updates) {
        // 字段白名单验证
        const invalidKeys = Object.keys(updates).filter(
            key => !UserEntity.isAllowedExtraKey(key)
        );
        if (invalidKeys.length > 0) {
            throw new Error(`非法字段: ${invalidKeys.join(', ')}`);
        }

        try {
            // 开启事务
            await this.mapper.beginTransaction();

            const results = {};
            for (const [key, value] of Object.entries(updates)) {
                UserEntity.validateExtraValue(key, value);
                results[key] = await this.mapper.createOrUpdateExtra(userId, key, value);
            }

            // 提交事务
            await this.mapper.commit();
            return results;
        } catch (error) {
            // 回滚事务
            await this.mapper.rollback();
            throw error;
        }
    }

    /**
     * 更改用户角色
     * @param {number} targetUserId - 目标用户ID
     * @param {string} newRole - 新角色
     */
    async changeUserRole(targetUserId, newRole) {
        // 1. 验证目标用户存在
        const targetUser = await this.mapper.findById(targetUserId);
        if (!targetUser) {
            throw new Error('用户不存在');
        }

        // 3. 验证角色合法性
        if (!ROLES.includes(newRole)) {
            throw new Error(`无效角色: ${newRole}`);
        }

        // 4. 执行更新
        const isUpdated = await this.mapper.updateUserRole(targetUserId, newRole);
        if (!isUpdated) {
            throw new Error('角色更新失败');
        }

        return true;
    }

    // 根据id删除用户
    async deleteUser(userId) {
        const user = await this.mapper.findById(userId);
        if (!user) throw new Error('用户不存在');
        await this.mapper.delete(userId);
        return { message: '用户已删除' };
    }

    // 根据用户id更改密码
    async changePassword(userId, newPassword) {
        // 验证密码格式
        if (!newPassword || newPassword.length < 6) {
            throw new Error('密码长度至少为6个字符');
        }
        const user = await this.mapper.findById(userId);
        if (!user) throw new Error('用户不存在');
        const hashedPassword = await UserEntity.hashPassword(newPassword);
        return this.mapper.updatePassword(userId, hashedPassword);
    }

    // 查询用户喜欢的帖子
    async getUserFavorites(userId,filter) {
        return this.mapper.getFavoriteThreads(userId, filter);
    }

    // 查询用户收藏的帖子
    async getUserCollections(userId, filter) {
        return this.mapper.getCollectionThreads(userId, filter);
    }
}

module.exports = UserService;
