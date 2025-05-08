// routes/file.js
const express = require('express');
const router = express.Router();
const FileController = require('../controller/FileController');
const { verifyJWT } = require("../utils/jwt");
const { runInContext } = require('../utils/requestContext');
const upload = require('../middlewares/upload');

router.post('/upload',
    verifyJWT,
    upload.single('file'),
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    FileController.uploadFile
);

module.exports = router;
