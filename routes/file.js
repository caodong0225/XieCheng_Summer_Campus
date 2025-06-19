const express = require('express');
const router = express.Router();
const FileController = require('../controller/FileController');
const { verifyJWT } = require("../utils/jwt");
const { runInContext } = require('../utils/requestContext');
const upload = require('../middlewares/upload');

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: 文件上传与管理
 */

/**
 * @swagger
 * /file/upload:
 *   post:
 *     summary: 上传单个文件
 *     tags: [Files]
 *     security:
 *       - BearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: 要上传的文件
 *     responses:
 *       200:
 *         description: 文件上传成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: 文件访问URL
 *                 filename:
 *                   type: string
 *                 size:
 *                   type: integer
 *       400:
 *         description: 没有文件被上传
 *       401:
 *         description: 未授权访问
 *       500:
 *         description: 服务器内部错误
 */
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