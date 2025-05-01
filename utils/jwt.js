// utils/jwt.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_CONFIG = {
    expiresIn: '7d',          // Token 有效期
    algorithm: 'HS256'        // 加密算法
};

// 生成 JWT
const generateJWT = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            role: user.role,
            username: user.username,
            email: user.email
        },
        process.env.JWT_SECRET,
        JWT_CONFIG
    );
};

// 验证 JWT 中间件
const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ code: 401, message: '缺少访问令牌' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 解码后的用户信息存入请求对象
        req.user = jwt.verify(token, process.env.JWT_SECRET);

        // 附加到全局上下文（可选）
        global.currentUser = req.user; // 注意：需配合下文说明使用

        next();
    } catch (error) {
        const message = error.name === 'TokenExpiredError'
            ? '访问令牌已过期'
            : '无效的访问令牌';
        return res.status(401).json({ code: 401, message });
    }
};

module.exports = { generateJWT, verifyJWT };