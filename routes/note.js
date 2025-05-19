// routes/note.js
const express = require('express');
const router = express.Router();
const NoteController = require('../controller/NoteController');
const {verifyJWT} = require("../utils/jwt");
const roleCheck = require("../middlewares/roleCheck");
const { runInContext } = require('../utils/requestContext');

router.post('/create',
    verifyJWT,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    NoteController.createNote
);

// 删除用户
router.put('/:noteId',
    verifyJWT,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    roleCheck('admin','super-admin'),
    NoteController.reviewNote
);

// 逻辑删除游记
router.delete('/:noteId',
    verifyJWT,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    roleCheck('admin','super-admin'),
    NoteController.deleteNote
);

// 更新游记
router.put('/update/:noteId',
    verifyJWT,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    NoteController.updateNote
);

// 删除附件
router.delete('/attachment/:attachmentId',
    verifyJWT,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    NoteController.deleteAttachment
);

// 审核游记
router.put('/review/:noteId',
    verifyJWT,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    roleCheck('admin','super-admin'),
    NoteController.auditNote
);

// 获取游记列表
router.get('/list',
    verifyJWT,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    NoteController.getNoteList
);

// 通过游记id获取游记
router.get('/:noteId',
    verifyJWT,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    NoteController.getNoteById
);

// 收藏操作
router.post('/:noteId/collection',
    verifyJWT,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    NoteController.toggleCollection
);

// 喜欢操作
router.post('/:noteId/like',
    verifyJWT,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    NoteController.toggleFavorite
);


module.exports = router;
