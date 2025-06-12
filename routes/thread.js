// routes/thread.js
const express = require('express');
const router = express.Router();
const ThreadController = require('../controller/ThreadController');
const { verifyJWT } = require("../utils/jwt");
const { runInContext } = require('../utils/requestContext');

// 删留言
router.delete('/:threadId',
    verifyJWT,
    (req, res, next) => {
        runInContext(req, next);
    },
    ThreadController.deleteThread
);

// 通过ID获取留言
router.get('/:threadId',
    verifyJWT,
    (req, res, next) => {
        runInContext(req, next);
    },
    ThreadController.getThreadById
);

// 创建留言
router.post('/',
    verifyJWT,
    (req, res, next) => {
        runInContext(req, next);
    },
    ThreadController.createThread
);

// 撤销留言
router.delete('/undo/:threadId',
    verifyJWT,
    (req, res, next) => {
        runInContext(req, next);
    },
    ThreadController.undoThread
);

// 通过id更新留言
router.put('/:threadId',
    verifyJWT,
    (req, res, next) => {
        runInContext(req, next);
    },
    ThreadController.updateThread
);

// 点赞帖子
router.post('/like/:threadId',
    verifyJWT,
    (req, res, next) => {
        runInContext(req, next);
    },
    ThreadController.toggleThreadLike
);

module.exports = router;
