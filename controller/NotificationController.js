const NotificationService = require('../service/NotificationService');
const {getContext} = require("../utils/requestContext");
const response = require("../utils/response");

class NotificationController {
    constructor() {
        this.service = new NotificationService();

        // 绑定 this，否则路由里调用时 this 会丢失
        this.createNotification = this.createNotification.bind(this);
        this.deleteNotification = this.deleteNotification.bind(this);
        this.markAsRead = this.markAsRead.bind(this);
        this.listUserNotifications = this.listUserNotifications.bind(this);
        this.markAsReadAll = this.markAsReadAll.bind(this);
    }

    async createNotification(req, res) {
        try {
            const notificationId = await this.service.createNotification(req.body);
            response.success(res, {id : notificationId}); // 使用 200 Created 状态码
        } catch (error) {
            response.error(res, error.message, 400); // 400 Bad Request
        }
    }

    async deleteNotification(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            if(contextUser.role !== 'admin' && contextUser.role !== 'super-admin'){
                await this.service.checkNotificationPermission(Number(req.params.id), req.user.id);
            }
            const result = await this.service.deleteNotification(Number(req.params.id));
            response.success(res,  result);
        } catch (error) {
            const status = error.message.includes('无操作权限') ? 403 : 404;
            response.error(res, error.message, status);
        }
    }

    async markAsRead(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            await this.service.checkNotificationPermission(Number(req.params.id), contextUser.userId);
            const result = await this.service.markNotificationAsRead(Number(req.params.id));
            response.success(res, result);
        } catch (error) {
            const status = error.message.includes('无操作权限') ? 403 : 400;
            response.error(res, error.message, status);
        }
    }

    async markAsReadAll(req, res) {
        try {
            const contextUser = getContext()?.get('user');
            const result = await this.service.markAllNotificationsAsRead(contextUser.userId, String(req.params.sender));
            response.success(res, result);
        } catch (error) {
            const status = error.message.includes('无操作权限') ? 403 : 400;
            response.error(res, error.message, status);
        }
    }

    async listUserNotifications(req, res) {
        try {
            const page = Math.max(Number(req.query.page) || 1, 1);
            const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 100);
            const sender = req.query?.sender || "system";
            const contextUser = getContext()?.get('user');

            const result = await this.service.getUserNotifications(
                contextUser.userId,
                page,
                pageSize,
                sender
            );

            response.success(res, result);
        } catch (error) {
            response.error(res, error.message, 500);
        }
    }
}

module.exports = new NotificationController();
