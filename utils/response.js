// utils/response.js
const responseUtil = {
    /**
     * 基础响应方法
     */
    send(res, code, message, data = null) {
        const response = { code, message };
        if (data !== null) response.data = data;
        res.status(code).json(response);
    },

    /**
     * 成功响应
     */
    success(res, data = null, message = 'Success', code = 200) {
        this.send(res, code, message, data);
    },

    /**
     * 错误响应
     */
    error(res, message = 'Internal Server Error', code = 500) {
        this.send(res, code, message);
    }
};

module.exports = responseUtil;