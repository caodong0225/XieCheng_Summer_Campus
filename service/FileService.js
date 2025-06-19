// src/service/FileService.js
const minioClient = require('../utils/minioClient');
const { v4: uuidv4 } = require('uuid');

class FileService {
    constructor() {
        this.bucketName = process.env.MINIO_BUCKET;
        this.initBucket();
    }

    async initBucket() {
        if (!await minioClient.bucketExists(this.bucketName)) {
            await minioClient.makeBucket(this.bucketName);
        }
    }

    async uploadFile(userId, file) {
        const extension = file.originalname.split('.').pop();
        const objectName = `${userId}/${uuidv4()}.${extension}`;

        await minioClient.putObject(
            this.bucketName,
            objectName,
            file.buffer,
            file.size,
            {
                'Content-Type': file.mimetype,
                'x-amz-meta-uploader': userId
            }
        );

        return {
            objectName,
            url: `${process.env.MINIO_PUBLIC_URL}/${this.bucketName}/${objectName}`
        };
    }
}

module.exports = FileService;
