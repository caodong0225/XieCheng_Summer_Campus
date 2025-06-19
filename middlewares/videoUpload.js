// middlewares/videoUpload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const crypto = require('crypto');


// 创建临时上传目录
const tempDir = path.join(__dirname, '../temp_uploads');
if (!fs.existsSync(tempDir)) {
    // 递归创建目录
    try {
        fs.mkdirSync(tempDir, { recursive: true });
        console.log(`✅ 创建临时上传目录: ${tempDir}`);
    } catch (err) {
        console.error(`❌ 创建临时上传目录失败: ${err.message}`);
        throw err;
    }
}

// 生成安全的随机文件名
const generateFilename = (originalname) => {
    const ext = path.extname(originalname).toLowerCase();
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    return `video-${timestamp}-${uniqueSuffix}${ext}`;
};

// 配置存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        cb(null, generateFilename(file.originalname));
    }
});

// 文件过滤 - 更严格的视频类型检查
const fileFilter = (req, file, cb) => {
    // 支持的 MIME 类型
    const allowedTypes = [
        'video/mp4',
        'video/quicktime', // mov
        'video/x-msvideo', // avi
        'video/webm',
        'video/x-matroska', // mkv
        'video/3gpp',
        'video/mpeg'
    ];

    // 支持的扩展名
    const allowedExtensions = [
        '.mp4', '.mov', '.avi',
        '.webm', '.mkv', '.3gp', '.mpeg'
    ];

    const ext = path.extname(file.originalname).toLowerCase();

    // 检查 MIME 类型和扩展名是否都有效
    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        const error = new Error(`不支持的文件类型: ${file.mimetype}${ext ? ` (扩展名: ${ext})` : ''}`);
        error.code = 'UNSUPPORTED_MEDIA_TYPE';
        cb(error, false);
    }
};

// 创建 multer 实例
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 500, // 500MB
        files: 1 // 只允许上传一个文件
    }
});

// 错误处理中间件
const handleUploadErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Multer 错误 (如文件大小超出限制)
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                success: false,
                message: '文件过大，最大支持500MB'
            });
        }
        return res.status(400).json({
            success: false,
            message: `上传错误: ${err.message}`
        });
    } else if (err) {
        // 其他错误 (如文件类型不支持)
        if (err.code === 'UNSUPPORTED_MEDIA_TYPE') {
            return res.status(415).json({
                success: false,
                message: err.message
            });
        }
        return res.status(500).json({
            success: false,
            message: '服务器处理上传时出错'
        });
    }
    next();
};

module.exports = {
    single: upload.single('video'),
    handleUploadErrors
};