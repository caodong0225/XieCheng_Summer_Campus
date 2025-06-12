// src/entity/ReplyEntity.js
const Joi = require('joi');

const createSchema = Joi.object({
    content: Joi.string().min(1).max(1000).required(),
    user_id: Joi.number().integer().positive().required(),
    thread_id: Joi.number().integer().positive(),
    reply_id: Joi.number().integer().positive(),
}).or('thread_id', 'reply_id');

const updateSchema = Joi.object({
    content: Joi.string().min(1).max(1000),
}).min(1);

const sanitize = (reply) => {
    if (!reply) return null;
    const { created_at, updated_at, ...sanitized } = reply;
    return sanitized;
};

module.exports = {
    createSchema,
    updateSchema,
    sanitize
};
