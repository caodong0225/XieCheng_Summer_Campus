// src/entities/UserEntity.js
const Joi = require('joi');
const bcrypt = require('bcrypt');
const { ROLES } = require('../constants');

class UserEntity {
    // 字段定义
    static FIELDS = {
        ID: 'id',
        USERNAME: 'username',
        PASSWORD: 'password',
        EMAIL: 'email',
        ROLE: 'role',
        CREATED_AT: 'created_at',
        UPDATED_AT: 'updated_at'
    };

    // 注册校验规则
    static registerSchema = Joi.object({
        [this.FIELDS.USERNAME]: Joi.string().alphanum().min(3).max(30).required(),
        [this.FIELDS.EMAIL]: Joi.string().email().required(),
        [this.FIELDS.PASSWORD]: Joi.string().min(6).required(),
        [this.FIELDS.ROLE]: Joi.string().valid(...ROLES).default('guest')
    });

    // 更新校验规则
    static updateSchema = Joi.object({
        [this.FIELDS.USERNAME]: Joi.string().alphanum().min(3).max(30),
        [this.FIELDS.EMAIL]: Joi.string().email(),
        [this.FIELDS.PASSWORD]: Joi.string().min(6)
    });

    // 数据脱敏
    static sanitize(user) {
        const { password, ...safeData } = user;
        return safeData;
    }

    // 密码加密
    static async hashPassword(password) {
        return bcrypt.hash(password, 10);
    }

    // 密码验证
    static async verifyPassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = UserEntity;