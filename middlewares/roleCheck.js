// middlewares/roleCheck.js
const response = require('../utils/response');

/**
 * 角色权限校验中间件
 * @param {string[]} allowedRoles 允许访问的角色数组
 */
const roleCheck = (...allowedRoles) => {
    return (req, res, next) => {
        // 从JWT中获取用户角色
        const userRole = req.user?.role;

        if (!userRole || !allowedRoles.includes(userRole)) {
            return response.error(
                res,
                '权限不足，仅限管理员操作',
                403
            );
        }

        next();
    };
};

module.exports = roleCheck;