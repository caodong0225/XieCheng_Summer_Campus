// src/controller/VideoController.js
const VideoService = require('../service/VideoService');
const response = require('../utils/response');
const { getContext } = require("../utils/requestContext");

class VideoController {
    constructor() {
        this.videoService = new VideoService();
        this.uploadVideo = this.uploadVideo.bind(this);
    }

    async uploadVideo(req, res) {
        try {
            if (!req.file) {
                return response.error(res, '请选择要上传的视频文件', 400);
            }

            const contextUser = getContext()?.get('user');
            const { title = '未命名视频' } = req.body;

            // 上传到 Minio
            const videoInfo = await this.videoService.uploadVideoToMinio(
                contextUser.userId,
                req.file,
                title
            );

            response.success(res, videoInfo, '视频上传成功');
        } catch (error) {
            console.error('视频上传失败:', error);

            let status = 500;
            let message = error.message;

            if (error.code === 'LIMIT_FILE_SIZE') {
                status = 413;
                message = '文件过大，最大支持500MB';
            } else if (error.message.includes('不支持的视频格式')) {
                status = 400;
            }

            response.error(res, message, status);
        }
    }
}

module.exports = new VideoController();