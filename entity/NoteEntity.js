// src/entities/NoteEntity.js
const Joi = require('joi');

class NoteEntity {
    // 字段定义
    static FIELDS = {
        ID: 'id',
        TITLE: 'title',
        DESCRIPTION: 'description',
        CREATED_BY: 'created_by'
    };

    // 创建校验规则
    static createSchema = Joi.object({
        title: Joi.string().min(1).max(255).required(),
        description: Joi.string().min(1).max(10000).required(),
        attachments: Joi.array().items()
    });

    // 状态更新校验规则
    static statusSchema = Joi.object({
        status: Joi.string().valid('checking', 'approved', 'rejected').required(),
        reason: Joi.string().when('status', {
            is: 'rejected',
            then: Joi.string().min(1).required(),
            otherwise: Joi.string().optional()
        })
    });
}

module.exports = NoteEntity;