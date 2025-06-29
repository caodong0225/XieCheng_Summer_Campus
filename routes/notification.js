// routes/notification.js
const express = require('express');
const router = express.Router();
const NotificationController = require('../controller/NotificationController');
const {verifyJWT} = require("../utils/jwt");
const roleCheck = require("../middlewares/roleCheck");
const { runInContext } = require('../utils/requestContext');

router.post('/create',
    verifyJWT,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    roleCheck('admin','super-admin'),
    NotificationController.createNotification
);

router.delete('/:id',
    verifyJWT,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    NotificationController.deleteNotification
);

router.put('/:id/mark-as-read',
    verifyJWT,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    NotificationController.markAsRead
);

router.put('/markAllAsRead/:sender',
    verifyJWT,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    NotificationController.markAsReadAll
);

router.get('/list',
    verifyJWT,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    NotificationController.listUserNotifications
);

module.exports = router;
