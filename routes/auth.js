// routes/auth.js
const express = require('express');
const router = express.Router();
const UserController = require('../controller/UserController');
const {verifyJWT} = require("../utils/jwt");
const roleCheck = require("../middlewares/roleCheck");
const { runInContext } = require('../utils/requestContext');

// 用户注册
router.post('/register', UserController.register);

// 用户登录
router.post('/login', UserController.login);

// 分页查询用户列表
router.get('/list', UserController.listUsers);

router.put('/update',
    verifyJWT,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    // roleCheck('super-admin'),
    UserController.updateProfile
);

// 更新用户额外信息
router.put('/update/extra',
    verifyJWT,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    UserController.updateExtras
);


// 删除用户
router.delete('/:userId',
    verifyJWT,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    roleCheck('super-admin'),
    UserController.deleteUser
);

// 通过用户id获取用户，通过路径传入userId的值
router.get('/:userId', UserController.getUserById);

// 更新用户角色
router.put('/update/:userId/role',
    verifyJWT,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    roleCheck('super-admin'),
    UserController.changeUserRole
);

// 通过用户id更改用户密码
router.put('/update/:userId/password',
    verifyJWT,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    roleCheck('super-admin'),
    UserController.updateUserProfile
);

module.exports = router;