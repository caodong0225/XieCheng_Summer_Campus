// middlewares/auth.js
const { verifyJWT } = require('../utils/jwt');

// 通用JWT校验中间件
module.exports.verifyJWT = verifyJWT;

// 角色校验中间件
module.exports.adminRequired = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            code: 403,
            message: '需要管理员权限'
        });
    }
    next();
};