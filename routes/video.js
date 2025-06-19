// routes/video.js
const express = require('express');
const router = express.Router();
const { verifyJWT } = require("../utils/jwt");
const { runInContext } = require('../utils/requestContext');
const { single: videoUpload, handleUploadErrors } = require('../middlewares/videoUpload');
const VideoController = require('../controller/VideoController');

/**
 * @swagger
 * tags:
 *   name: Videos
 *   description: 视频上传与管理
 */

/**
 * @swagger
 * /video/upload:
 *   post:
 *     summary: 上传视频文件
 *     description: 支持进度监控的视频上传
 *     tags: [Videos]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: 要上传的视频文件 (最大500MB)
 *               title:
 *                 type: string
 *                 description: 视频标题
 *                 example: 我的精彩视频
 *     responses:
 *       200:
 *         description: 视频上传成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Video'
 *       400:
 *         description: 无效请求
 *       413:
 *         description: 文件过大
 *       415:
 *         description: 不支持的媒体类型
 *       500:
 *         description: 服务器错误
 *
 * components:
 *   schemas:
 *     Video:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 视频ID
 *         userId:
 *           type: string
 *           description: 用户ID
 *         title:
 *           type: string
 *           description: 视频标题
 *         duration:
 *           type: number
 *           description: 视频时长(秒)
 *         size:
 *           type: integer
 *           description: 文件大小(字节)
 *         videoUrl:
 *           type: string
 *           description: 视频访问URL
 *         thumbnailUrl:
 *           type: string
 *           description: 缩略图访问URL
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 */
router.post('/upload',
    verifyJWT,
    videoUpload,
    (req, res, next) => {
        // 将用户信息注入上下文
        runInContext(req, next);
    },
    VideoController.uploadVideo
);

module.exports = router;
