const Joi = require('joi');
const { ALLOWED_SENDER } = require('../constants');

class NotificationEntity {
    // 字段常量
    static FIELDS = {
        ID: 'id',
        TITLE: 'title',
        CONTENT: 'content',
        USER_ID: 'user_id',
        IS_READ: 'is_read',
        CREATED_AT: 'created_at',
        UPDATED_AT: 'updated_at'
    };

    // 创建校验规则
    static createSchema = Joi.object({
        title: Joi.string().min(1).max(255).required(),
        content: Joi.string().min(1).max(255).required(),
        user_id: Joi.number().integer().min(1).required(),
        sender: Joi.string().valid(...ALLOWED_SENDER).default('system')
    });

    // 更新校验规则
    static updateSchema = Joi.object({
        title: Joi.string().min(1).max(255),
        content: Joi.string().min(1).max(255),
        is_read: Joi.number().valid(0, 1)
    });
}

module.exports = NotificationEntity;
