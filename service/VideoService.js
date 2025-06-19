// src/service/VideoService.js
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { generateThumbnail, getVideoMetadata} = require('../utils/videoUtils');
const minioClient = require('../utils/minioClient');

const unlinkAsync = promisify(fs.unlink);

class VideoService {
    constructor() {
        this.videoBucket = process.env.MINIO_VIDEO_BUCKET;
        this.thumbnailBucket = process.env.MINIO_THUMBNAIL_BUCKET;
        this.endpoint = process.env.MINIO_ENDPOINT
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

    async uploadVideoToMinio(userId, file, title) {
        try {
            const filePath = file.path;
            const filename = file.filename;
            const originalName = file.originalname;
            const fileSize = file.size;

            // 1. 上传视频到Minio
            await minioClient.fPutObject(
                this.videoBucket,
                filename,
                filePath,
                {
                    'Content-Type': file.mimetype,
                    'x-amz-meta-original-filename': originalName,
                    'x-amz-meta-user-id': userId,
                    // 'x-amz-meta-title': title
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
                title,
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

            // 5. 清理临时文件
            await this.cleanupTempFiles([filePath, thumbnailPath]);

            return {
                ...videoData
            };
        } catch (error) {
            console.error('Minio上传失败:', error);
            throw new Error('视频上传到存储失败');
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

}

module.exports = VideoService;
