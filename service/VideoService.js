// src/service/VideoService.js
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { generateThumbnail, getVideoMetadata} = require('../utils/videoUtils');
const minioClient = require('../utils/minioClient');
const VideoMapper = require("../mapper/VideoMapper");
const VideoEmojiMapper = require("../mapper/VideoEmojiMapper");
const UserMapper = require("../mapper/UserMapper");
const VideoViewMapper = require("../mapper/VideoViewMapper");

const unlinkAsync = promisify(fs.unlink);

class VideoService {
    constructor() {
        this.videoBucket = process.env.MINIO_VIDEO_BUCKET;
        this.thumbnailBucket = process.env.MINIO_THUMBNAIL_BUCKET;
        this.endpoint = process.env.MINIO_ENDPOINT;
        this.mapper = new VideoMapper();
        this.videoEmojiMapper = new VideoEmojiMapper();
        this.userMapper = new UserMapper();
        this.viewMapper = new VideoViewMapper();
        this.ensureBucketsExist();
    }

    async ensureBucketsExist() {
        try {
            // 确保视频存储桶存在
            const videoBucketExists = await minioClient.bucketExists(this.videoBucket);
            if (!videoBucketExists) {
                await minioClient.makeBucket(this.videoBucket);
                console.log(`✅ 创建Minio存储桶: ${this.videoBucket}`);
            }

            // 确保缩略图存储桶存在
            const thumbnailBucketExists = await minioClient.bucketExists(this.thumbnailBucket);
            if (!thumbnailBucketExists) {
                await minioClient.makeBucket(this.thumbnailBucket);
                console.log(`✅ 创建Minio存储桶: ${this.thumbnailBucket}`);
            }
        } catch (err) {
            console.error('❌ 初始化Minio存储桶失败:', err);
        }
    }

    async uploadVideoToMinio(userId, file, description) {
        try {
            const filePath = file.path;
            const filename = file.filename;
            const originalName = file.originalname;
            const fileSize = file.size;

            // 1. 使用流式上传视频
            const videoStream = fs.createReadStream(filePath);
            await minioClient.putObject(
                this.videoBucket,
                filename,
                videoStream, // 使用流而不是文件路径
                fileSize,
                {
                    'Content-Type': file.mimetype,
                    'x-amz-meta-original-filename': originalName,
                    'x-amz-meta-user-id': userId,
                }
            );

            // 2. 获取视频元数据
            const metadata = await getVideoMetadata(filePath);

            // 3. 生成缩略图并上传
            const thumbnailPath = await generateThumbnail(filePath);
            const thumbnailName = path.basename(thumbnailPath);

            await minioClient.fPutObject(
                this.thumbnailBucket,
                thumbnailName,
                thumbnailPath,
                {
                    'Content-Type': 'image/jpeg',
                    'x-amz-meta-video-id': filename
                }
            );

            // 4. 保存到数据库
            const videoData = {
                userId,
                description,
                filename,
                originalName,
                size: fileSize,
                duration: metadata.duration,
                format: metadata.format,
                videoUrl: `https://${this.endpoint}/${this.videoBucket}/${filename}`,
                thumbnailUrl: `https://${this.endpoint}/${this.thumbnailBucket}/${thumbnailName}`,
                bucket: this.videoBucket,
                thumbnailBucket: this.thumbnailBucket
            };

            // 处理数据库操作
            await this.mapper.create({
                description: description,
                created_by: userId, // 用户ID
                link: videoData.videoUrl,
                thumbnail: videoData.thumbnailUrl,
            })

            // 5. 清理临时文件
            await this.cleanupTempFiles([filePath, thumbnailPath]);

            return {
                ...videoData
            };
        } catch (error) {
            console.error('Minio上传失败详情:', {
                message: error.message,
                stack: error.stack,
                bucket: this.videoBucket,
                userId
            });

            // 保留原始错误信息
            throw new Error(`视频上传失败: ${error.message}`);
        }
    }

    async cleanupTempFiles(filePaths) {
        try {
            for (const filePath of filePaths) {
                if (fs.existsSync(filePath)) {
                    await unlinkAsync(filePath);
                }
            }
        } catch (error) {
            console.error('清理临时文件失败:', error);
        }
    }

    // 分页查询用户上传的视频
    async getUserVideos(userId, page = 1, limit = 10, description = null) {

        const videos = await this.mapper.findByUserId(userId,  page, limit, description );
        const total = await this.mapper.countByUserId(userId,description);

        return {
            videos,
            total,
            page,
            limit
        };
    }

    // ================= 点赞和收藏功能 =================

    // 视频收藏操作
    async toggleCollection(userId, videoId) {
        // 验证视频是否存在
        const video = await this.mapper.findById(videoId);
        if (!video) {
            throw new Error('视频不存在');
        }

        // 验证用户是否存在
        const user = await this.userMapper.findById(userId);
        if (!user) {
            throw new Error('用户不存在');
        }

        const isCollected = await this.videoEmojiMapper.isCollection(userId, videoId);

        try {
            await this.videoEmojiMapper.beginTransaction();

            if (isCollected) {
                await this.videoEmojiMapper.cancelCollection(userId, videoId);
            } else {
                await this.videoEmojiMapper.collection(userId, videoId);
            }

            await this.videoEmojiMapper.commit();

            return {
                collected: !isCollected,
                videoId,
                collectionCount: await this.videoEmojiMapper.getCollectionCount(videoId)
            };
        } catch (error) {
            await this.videoEmojiMapper.rollback();
            throw new Error('收藏操作失败: ' + error.message);
        }
    }

    // 视频点赞操作
    async toggleFavorite(userId, videoId) {
        // 验证视频是否存在
        const video = await this.mapper.findById(videoId);
        if (!video) {
            throw new Error('视频不存在');
        }

        // 验证用户是否存在
        const user = await this.userMapper.findById(userId);
        if (!user) {
            throw new Error('用户不存在');
        }

        const isFavorited = await this.videoEmojiMapper.isFavorite(userId, videoId);

        try {
            await this.videoEmojiMapper.beginTransaction();

            if (isFavorited) {
                await this.videoEmojiMapper.cancelFavorite(userId, videoId);
            } else {
                await this.videoEmojiMapper.favorite(userId, videoId);
            }

            await this.videoEmojiMapper.commit();

            return {
                favorited: !isFavorited,
                videoId,
                favoriteCount: await this.videoEmojiMapper.getFavoriteCount(videoId)
            };
        } catch (error) {
            await this.videoEmojiMapper.rollback();
            throw new Error('点赞操作失败: ' + error.message);
        }
    }

    // 通过id删除视频
    async deleteVideoById(videoId) {
        try{
            await this.mapper.delete(videoId);
            return true;
        }catch (error) {
            console.error('删除视频失败:', error);
            throw new Error('删除视频失败: ' + error.message);
        }
    }

    // 判断视频是不是该用户发布的
    async isUserVideo(userId, videoId) {
        try {
            const video = await this.mapper.findById(videoId);
            if (!video) {
                throw new Error('视频不存在');
            }
            return video.created_by === userId;
        } catch (error) {
            console.error('检查视频所有者失败:', error);
            throw new Error('检查视频所有者失败: ' + error.message);
        }
    }

    /**
     * 记录视频观看行为
     * @param {number} userId 用户ID
     * @param {number} videoId 视频ID
     */
    async recordView(userId, videoId) {
        try {
            await this.viewMapper.beginTransaction();
            const success = await this.viewMapper.recordView(userId, videoId);
            await this.viewMapper.commit();
            return success;
        } catch (error) {
            await this.viewMapper.rollback();
            console.error('记录观看失败:', error);
            return false;
        }
    }

    // 通过视频id获取视频详情，要求包括点赞数，收藏数，观看数等
    async getVideoDetails(videoId,userId) {
        try {
            const video = await this.mapper.findById(videoId);
            if (!video) {
                throw new Error('视频不存在');
            }

            const [likeCount, collectionCount,isCollected,isLiked, viewCount] = await Promise.all([
                this.videoEmojiMapper.getFavoriteCount(videoId),
                this.videoEmojiMapper.getCollectionCount(videoId),
                this.videoEmojiMapper.isCollection(userId, videoId),
                this.videoEmojiMapper.isFavorite(userId, videoId),
                this.viewMapper.getVideoViewStats(videoId)
            ]);

            return {
                ...video,
                likeCount,
                collectionCount,
                isCollected,
                isLiked,
                viewCount
            };
        } catch (error) {
            console.error('获取视频详情失败:', error);
            throw new Error('获取视频详情失败: ' + error.message);
        }
    }

    // 获取未读视频
    async getUnreadVideos(userId, page = 1, limit = 10) {
        try {
            const unreadVideos = await this.mapper.getUnreadVideos(userId, page, limit);

            return {
                videos: unreadVideos,
                page,
                limit
            };
        } catch (error) {
            console.error('获取未读视频失败:', error);
            throw new Error('获取未读视频失败: ' + error.message);
        }
    }

    // 获取用户历史观看视频列表
    async getUserHistoryVideos(userId, page = 1, limit = 10) {
        try {
            const historyVideos = await this.viewMapper.getRecentViewedVideos(userId, page, limit);

            return {
                videos: historyVideos,
                page,
                limit
            };
        } catch (error) {
            console.error('获取用户历史观看视频失败:', error);
            throw new Error('获取用户历史观看视频失败: ' + error.message);
        }
    }

    // 删除视频访问记录
    async deleteVideoViewRecord(userId, videoId) {
        try {
            const success = await this.viewMapper.deleteVideoViews(userId, videoId);
            return success;
        } catch (error) {
            console.error('删除视频访问记录失败:', error);
            throw new Error('删除视频访问记录失败: ' + error.message);
        }
    }

    // 获取所有视频
    async getAllVideos(page = 1, limit = 10, description = null) {
        try {
            const videos = await this.mapper.findAllVideos(page, limit, description);

            return videos;
        } catch (error) {
            console.error('获取所有视频失败:', error);
            throw new Error('获取所有视频失败: ' + error.message);
        }
    }

}

module.exports = VideoService;
