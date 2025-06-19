// src/utils/videoUtils.js
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const mkdirp = require('mkdirp');
const stream = require('stream');
const minioClient = require('./minioClient');
const unlinkAsync = promisify(fs.unlink);

// 创建缩略图临时目录
const thumbnailDir = path.join(__dirname, '../temp_thumbnails');
if (!fs.existsSync(thumbnailDir)) {
    try {
        fs.mkdirSync(thumbnailDir, { recursive: true });
        console.log(`✅ 创建缩略图临时目录: ${thumbnailDir}`);
    } catch (err) {
        console.error(`❌ 创建缩略图临时目录失败: ${err.message}`);
        throw err;
    }
}

/**
 * 生成视频缩略图
 * @param {string} videoPath - 视频文件路径
 * @returns {Promise<string>} 缩略图路径
 */
async function generateThumbnail(videoPath) {
    try {
        const filename = path.basename(videoPath, path.extname(videoPath));
        const thumbnailPath = path.join(thumbnailDir, `${filename}.jpg`);

        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .on('end', () => {
                    console.log(`✅ 缩略图生成成功: ${thumbnailPath}`);
                    resolve(thumbnailPath);
                })
                .on('error', (err) => {
                    console.error(`❌ 生成缩略图失败: ${err.message}`);
                    reject(new Error('无法生成缩略图'));
                })
                .screenshots({
                    count: 1,
                    folder: thumbnailDir,
                    filename: `${filename}.jpg`,
                    size: '320x240',
                    quality: 90,
                    timemarks: ['10%'] // 在视频10%的位置截图
                });
        });
    } catch (error) {
        console.error(`❌ 缩略图生成异常: ${error.message}`);
        throw new Error('缩略图生成失败');
    }
}

/**
 * 获取视频元数据
 * @param {string} filePath - 视频文件路径
 * @returns {Promise<Object>} 视频元数据
 */
async function getVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                console.error(`❌ 获取视频元数据失败: ${err.message}`);
                resolve({
                    duration: 0,
                    format: 'unknown',
                    width: 0,
                    height: 0
                });
                return;
            }

            // 提取第一个视频流的信息
            const videoStream = metadata.streams.find(s => s.codec_type === 'video');

            resolve({
                duration: metadata.format.duration || 0,
                format: metadata.format.format_name || 'unknown',
                width: videoStream?.width || 0,
                height: videoStream?.height || 0,
                codec: videoStream?.codec_name || 'unknown',
                bit_rate: metadata.format.bit_rate || 0
            });
        });
    });
}

/**
 * 上传文件到 Minio
 * @param {string} bucket - Minio 存储桶名称
 * @param {string} objectName - 对象名称
 * @param {string} filePath - 本地文件路径
 * @param {string} contentType - MIME 类型
 * @param {Object} metadata - 元数据
 * @returns {Promise<string>} 文件 URL
 */
async function uploadToMinio(bucket, objectName, filePath, contentType, metadata = {}) {
    return new Promise((resolve, reject) => {

        function doUpload() {
            // 设置元数据
            const metaData = {
                'Content-Type': contentType,
                ...metadata
            };

            // 创建可读流
            const fileStream = fs.createReadStream(filePath);
            const fileStat = fs.statSync(filePath);

            // 上传文件
            minioClient.putObject(
                bucket,
                objectName,
                fileStream,
                fileStat.size,
                metaData,
                (err, etag) => {
                    if (err) {
                        console.error(`❌ Minio 上传失败: ${err.message}`);
                        return reject(err);
                    }

                    console.log(`✅ 文件上传成功: ${bucket}/${objectName}`);
                    const url = `${process.env.MINIO_PUBLIC_URL}/${process.env.MINIO_PORT}/${bucket}/${objectName}`;
                    resolve(url);
                }
            );
        }
    });
}

/**
 * 清理临时文件
 * @param {string[]} filePaths - 要清理的文件路径数组
 */
async function cleanupTempFiles(filePaths) {
    for (const filePath of filePaths) {
        if (fs.existsSync(filePath)) {
            try {
                await unlinkAsync(filePath);
                console.log(`🧹 清理临时文件: ${filePath}`);
            } catch (err) {
                console.error(`❌ 清理临时文件失败: ${filePath} - ${err.message}`);
            }
        }
    }
}

module.exports = {
    generateThumbnail,
    getVideoMetadata,
    uploadToMinio,
    cleanupTempFiles
};