// utils/wsJwt.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// WebSocket 专用 JWT 验证中间件
const verifyWsJWT = (socket, next) => {
    try {
        // 从以下位置获取 token（按优先级排序）
        const token = socket.handshake.auth?.token ||
            socket.handshake.query?.token;

        if (!token) {
            return next(new Error('MISSING_TOKEN'));
        }

        // 复用原有的验证逻辑
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 将用户信息附加到 socket 对象
        socket.user = {
            id: decoded.userId,
            role: decoded.role,
            username: decoded.username,
            email: decoded.email
        };

        next();
    } catch (error) {
        let message = 'INVALID_TOKEN';
        if (error.name === 'TokenExpiredError') message = 'TOKEN_EXPIRED';
        if (error.name === 'JsonWebTokenError') message = 'MALFORMED_TOKEN';
        next(new Error(message));
    }
};

module.exports = { verifyWsJWT };
