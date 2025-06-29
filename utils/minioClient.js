// src/utils/minioClient.js
const Minio = require('minio');

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    buckets: {
        videos: process.env.MINIO_VIDEO_BUCKET || 'videos',
        thumbnails: process.env.MINIO_THUMBNAIL_BUCKET || 'thumbnails'
    },
    partSize: 50 * 1024 * 1024, // 关键：设置50MB分片大小
    maxRetries: 7,             // 最大重试次数
    retryDelay: 5000,          // 重试延迟(ms)
    requestTimeout: 120 * 1000 // 请求超时120秒
});

module.exports = minioClient;
