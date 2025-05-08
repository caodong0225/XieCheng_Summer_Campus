// src/controller/FileController.js
const FileService = require('../service/FileService');
const response = require('../utils/response');
const {getContext} = require("../utils/requestContext");

class FileController {
    constructor() {
        this.fileService = new FileService();
        this.uploadFile = this.uploadFile.bind(this);
    }

    async uploadFile(req, res) {
        try {
            if (!req.file) {
                return response.error(res, '请选择要上传的文件', 400);
            }
            const contextUser = getContext()?.get('user');

            const result = await this.fileService.uploadFile(contextUser.userId,req.file);
            response.success(res, result, '文件上传成功');
        } catch (error) {
            response.error(res, error.message, 500);
        }
    }
}

module.exports = new FileController();
