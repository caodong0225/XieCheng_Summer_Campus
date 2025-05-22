// src/entity/ThreadEntity.js
const Joi = require('joi');

class ThreadEntity {
    static FIELDS = {
        ID: 'id',
        CONTENT: 'content',
        USER_ID: 'user_id',
        NOTE_ID: 'note_id',
        STATUS: 'status',
        WEIGHT: 'weight'
    };

    static STATUS_ENUM = ['open', 'closed', 'deleted'];

    static createSchema = Joi.object({
        content: Joi.string().required().min(2).max(2000)
            .label('评论内容'),
        user_id: Joi.number().required().positive()
            .label('用户ID'),
        note_id: Joi.number().required().positive()
            .label('游记ID'),
    });

    static updateSchema = Joi.object({
        content: Joi.string().min(2).max(2000),
        status: Joi.string().valid(...this.STATUS_ENUM),
        weight: Joi.number().min(0).max(9999)
    }).min(1);

    // 数据脱敏
    static sanitize(thread) {
        if (!thread) return null;
        const sanitized = { ...thread };
        // 移除敏感字段
        delete sanitized.user_id;
        return sanitized;
    }
}

module.exports = ThreadEntity;
