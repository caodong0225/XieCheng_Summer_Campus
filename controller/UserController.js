// src/controllers/UserController.js
const UserService = require('../service/UserService');
const response = require('../utils/response');
const UserEntity = require('../entity/UserEntity');
const { generateJWT } = require('../utils/jwt');
const {getContext} = require("../utils/requestContext");

class UserController {
    constructor() {
        this.userService = new UserService();

        // 绑定 this，否则路由里调用时 this 会丢失
        this.register = this.register.bind(this);
        this.login = this.login.bind(this);
        this.getUserById = this.getUserById.bind(this);
        this.updateProfile = this.updateProfile.bind(this);
        this.listUsers = this.listUsers.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
        this.updateExtras = this.updateExtras.bind(this);
        this.changeUserRole = this.changeUserRole.bind(this);
        this.updateUserProfile = this.updateUserProfile.bind(this);
    }

    // 用户注册
    async register(req, res) {
        try {
            const user = await this.userService.register(req.body);
            response.success(
                res,
                UserEntity.sanitize(user),
                '注册成功',
                200
            );
        } catch (error) {
            response.error(res, error.message, 400);
        }
    }

    // 用户登录
    async login(req, res) {
        try {
            const { username, password } = req.body;
            const user = await this.userService.login(username, password);

            // 生成 JWT Token（需自行实现）
            const token = generateJWT(user);

            response.success(res, {
                user: UserEntity.sanitize(user),
                token
            });
        } catch (error) {
            response.error(res, error.message, 401);
        }
    }

    // 更新用户信息
    async updateProfile(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            const result = await this.userService.updateUser(
                contextUser?.userId,
                req.body
            );
            if(result){
                response.success(res, null, '更新成功');
            }
            else{
                response.error(res, '更新失败', 500);
            }
        } catch (error) {
            response.error(res, error.message, 400);
        }
    }

    // 获取用户列表（管理员）
    async listUsers(req, res) {
        try {
            const result = await this.userService.listUsers(req.query);

            // 脱敏用户数据
            result.list = result.list.map(UserEntity.sanitize);

            response.success(res, result);
        } catch (error) {
            response.error(res, '获取用户列表失败', 500);
        }
    }

    // 通过用户id获取用户
    async getUserById(req, res) {
        try {
            const user = await this.userService.getUserById(req.params.userId);
            if (!user) {
                return response.error(res, '用户不存在', 404);
            }
            response.success(res, UserEntity.sanitize(user));
        } catch (error) {
            response.error(res, error.message, 500);
        }
    }

    // 统一更新扩展字段（单个/批量）
    async updateExtras(req, res) {
        try {
            // 获取当前用户信息
            const contextUser = getContext()?.get('user');
            if (!contextUser) {
                return response.error(res, '用户未认证', 401);
            }

            // 验证请求体格式
            if (typeof req.body !== 'object' || req.body === null) {
                return response.error(res, '请求体必须为JSON对象', 400);
            }

            // 执行批量更新
            const results = await this.userService.batchUpdateExtras(
                contextUser.userId,
                req.body
            );

            response.success(res, results);
        } catch (error) {
            response.error(res, error.message, 400);
        }
    }

    // 删除用户
    async deleteUser(req, res) {
        try {
            const userId = req.params.userId;
            const contextUser = getContext()?.get('user');
            // 不能删除自己
            if (userId == contextUser?.userId) {
                return response.error(res, '不能删除自己', 403);
            }
            await this.userService.deleteUser(userId);
            response.success(res, null, '用户删除成功');
        } catch (error) {
            response.error(res, error.message, 500);
        }
    }

    async changeUserRole(req, res) {
        try {
            const  targetUserId  = req.params.userId;
            const { role: newRole } = req.body;

            await this.userService.changeUserRole(
                targetUserId,
                newRole
            );

            response.success(res, null, '角色更新成功');
        } catch (error) {
            response.error(
                res,
                error.message,
                error.statusCode || 500
            );
        }
    }

    // 更新用户密码
    async updateUserProfile(req, res) {
        try{
            const targetUserId  = req.params.userId;
            const { password } = req.body;

            const result = await this.userService.changePassword(
                targetUserId,
                password
            );
            if(result){
                response.success(res, null, '密码更新成功');
            }
            else{
                response.error(res, '密码更新失败', 500);
            }
        } catch (error) {
            response.error(
                res,
                error.message,
                error.statusCode || 500
            );
        }
    }
}

module.exports = new UserController();