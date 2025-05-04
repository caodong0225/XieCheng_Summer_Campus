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


module.exports = router;