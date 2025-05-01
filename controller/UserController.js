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
    }

    // 用户注册
    async register(req, res) {
        try {
            const user = await this.userService.register(req.body);
            response.success(
                res,
                UserEntity.sanitize(user),
                '注册成功',
                201
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
            const user = await this.userService.updateUser(
                contextUser?.userId,
                req.body
            );
            response.success(res, UserEntity.sanitize(user));
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
}

module.exports = new UserController();