// routes/reply.js
const express = require('express');
const router = express.Router();
const ReplyController = require('../controller/ReplyController');
const { verifyJWT } = require("../utils/jwt");
const { runInContext } = require('../utils/requestContext');
const roleCheck = require("../middlewares/roleCheck");

// 创建回复
router.post('/',
    verifyJWT,
    (req, res, next) => {
        runInContext(req, next);
    },
    ReplyController.createReply
);

// 获取回复详情
router.get('/:replyId',
    verifyJWT,
    (req, res, next) => {
        runInContext(req, next);
    },
    ReplyController.getReplyById
);

// 更新回复
router.put('/:replyId',
    verifyJWT,
    (req, res, next) => {
        runInContext(req, next);
    },
    ReplyController.updateReply
);

// 删除回复（管理员权限）
router.delete('/:replyId',
    verifyJWT,
    (req, res, next) => {
        runInContext(req, next);
    },
    roleCheck('admin', 'super-admin'),
    ReplyController.deleteReply
);

// 点赞回复
router.post('/like/:replyId',
    verifyJWT,
    (req, res, next) => {
        runInContext(req, next);
    },
    ReplyController.toggleReplyLike
);

// 收藏回复
router.post('/collect/:replyId',
    verifyJWT,
    (req, res, next) => {
        runInContext(req, next);
    },
    ReplyController.toggleReplyCollect
);

// 获取回复树形结构
router.get('/tree/:replyId',
    verifyJWT,
    (req, res, next) => {
        runInContext(req, next);
    },
    ReplyController.getReplyTree
);

// 获取评论的所有回复（树形结构）
router.get('/thread/:threadId',
    verifyJWT,
    (req, res, next) => {
        runInContext(req, next);
    },
    ReplyController.getThreadReplies
);

module.exports = router;
