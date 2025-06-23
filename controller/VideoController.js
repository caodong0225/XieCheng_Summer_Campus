// src/controller/VideoController.js
const VideoService = require('../service/VideoService');
const response = require('../utils/response');
const { getContext } = require("../utils/requestContext");

class VideoController {
    constructor() {
        this.videoService = new VideoService();
        this.uploadVideo = this.uploadVideo.bind(this);
        this.toggleVideoCollection = this.toggleVideoCollection.bind(this);
        this.toggleVideoLike = this.toggleVideoLike.bind(this);
        this.getVideoList = this.getVideoList.bind(this);
        this.watchVideo = this.watchVideo.bind(this);
        this.getVideoDetails = this.getVideoDetails.bind(this);
        this.getUnreadVideos = this.getUnreadVideos.bind(this);
        this.deleteVideo = this.deleteVideo.bind(this);
        this.getViewedVideos = this.getViewedVideos.bind(this);
        this.deleteVideoView = this.deleteVideoView.bind(this);
        this.getAllVideos = this.getAllVideos.bind(this);
    }

    async uploadVideo(req, res) {
        try {
            if (!req.file) {
                return response.error(res, '请选择要上传的视频文件', 400);
            }
            console.log('上传的视频文件:', req.file);

            const contextUser = getContext()?.get('user');
            const { description = '暂无描述' } = req.body;

            // 上传到 Minio
            const videoInfo = await this.videoService.uploadVideoToMinio(
                contextUser.userId,
                req.file,
                description
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

    // 收藏视频
    async toggleVideoCollection(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            const videoId = req.params.videoId;

            const result = await this.videoService.toggleCollection(contextUser.userId, videoId);
            response.success(res, result, '视频收藏状态切换成功');
        } catch (error) {
            console.error('切换视频收藏状态失败:', error);
            response.error(res, error.message, 500);
        }
    }

    // 点赞视频
    async toggleVideoLike(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            const videoId = req.params.videoId;

            const result = await this.videoService.toggleFavorite(contextUser.userId, videoId);
            response.success(res, result, '视频点赞状态切换成功');
        } catch (error) {
            console.error('切换视频点赞状态失败:', error);
            response.error(res, error.message, 500);
        }
    }

    // 获取视频列表
    async getVideoList(req, res) {
        try {
            const { page = 1, pageSize = 10, description = null } = req.query;
            const contextUser = getContext()?.get('user');

            const videos = await this.videoService.getUserVideos(
                contextUser?.userId,
                parseInt(page, 10),
                parseInt(pageSize, 10),
                description
            );

            response.success(res, videos, '视频列表获取成功');
        } catch (error) {
            console.error('获取视频列表失败:', error);
            response.error(res, error.message, 500);
        }
    }

    // 观看视频
    async watchVideo(req, res) {
        try {
            const videoId = req.params.videoId;
            const contextUser = getContext()?.get('user');

            if (!videoId) {
                return response.error(res, '视频ID不能为空', 400);
            }

            // 记录观看记录
            await this.videoService.recordView(contextUser.userId, videoId);

            // 获取视频详情
            const videoDetails = await this.videoService.getVideoDetails(videoId,contextUser.userId);
            if (!videoDetails) {
                return response.error(res, '视频不存在或已被删除', 404);
            }

            response.success(res, videoDetails, '视频详情获取成功');
        } catch (error) {
            console.error('观看视频失败:', error);
            response.error(res, error.message, 500);
        }
    }

    // 通过视频id获取视频详情
    async getVideoDetails(req, res) {
        try {
            const videoId = req.params.videoId;
            if (!videoId) {
                return response.error(res, '视频ID不能为空', 400);
            }
            const contextUser = getContext()?.get('user');

            const videoDetails = await this.videoService.getVideoDetails(videoId,contextUser.userId);
            if (!videoDetails) {
                return response.error(res, '视频不存在或已被删除', 404);
            }

            response.success(res, videoDetails, '视频详情获取成功');
        } catch (error) {
            console.error('获取视频详情失败:', error);
            response.error(res, error.message, 500);
        }
    }

    // 获取未读视频
    async getUnreadVideos(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            const { page = 1, pageSize = 10 } = req.query;

            const unreadVideos = await this.videoService.getUnreadVideos(
                contextUser.userId,
                parseInt(page, 10),
                parseInt(pageSize, 10)
            );

            response.success(res, unreadVideos, '未读视频列表获取成功');
        } catch (error) {
            console.error('获取未读视频失败:', error);
            response.error(res, error.message, 500);
        }
    }

    // 通过id删除视频
    async deleteVideo(req, res) {
        try {
            const videoId = req.params.videoId;
            if (!videoId) {
                return response.error(res, '视频ID不能为空', 400);
            }

            const success = await this.videoService.deleteVideoById(videoId);

            if (success) {
                response.success(res, null, '视频删除成功');
            } else {
                response.error(res, '视频删除失败或视频不存在', 404);
            }
        } catch (error) {
            console.error('删除视频失败:', error);
            response.error(res, error.message, 500);
        }
    }

    // 获取用户观看过的视频列表
    async getViewedVideos(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            const { page = 1, pageSize = 10 } = req.query;

            const viewedVideos = await this.videoService.getUserHistoryVideos(
                contextUser.userId,
                parseInt(page, 10),
                parseInt(pageSize, 10)
            );

            response.success(res, viewedVideos, '用户观看过的视频列表获取成功');
        } catch (error) {
            console.error('获取用户观看过的视频列表失败:', error);
            response.error(res, error.message, 500);
        }
    }

    // 删除视频访问记录
    async deleteVideoView(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            const videoId = req.params.videoId;

            if (!videoId) {
                return response.error(res, '视频ID不能为空', 400);
            }

            const success = await this.videoService.deleteVideoViewRecord(contextUser.userId, videoId);

            if (success) {
                response.success(res, null, '视频观看记录删除成功');
            } else {
                response.error(res, '视频观看记录删除失败或记录不存在', 404);
            }
        } catch (error) {
            console.error('删除视频观看记录失败:', error);
            response.error(res, error.message, 500);
        }
    }

    // 获取所有视频
    async getAllVideos(req, res) {
        try {
            const { page = 1, pageSize = 10, description = null } = req.query;

            const videos = await this.videoService.getAllVideos(
                parseInt(page, 10),
                parseInt(pageSize, 10),
                description
            );

            response.success(res, videos, '所有视频列表获取成功');
        } catch (error) {
            console.error('获取所有视频列表失败:', error);
            response.error(res, error.message, 500);
        }
    }
}

module.exports = new VideoController();
