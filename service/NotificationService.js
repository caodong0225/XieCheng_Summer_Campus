const NotificationMapper = require('../mapper/NotificationMapper');
const NotificationEntity = require('../entity/NotificationEntity');
const UserMapper = require("../mapper/UserMapper");
const { ALLOWED_SENDER } = require('../constants');
class NotificationService {
    constructor() {
        this.mapper = new NotificationMapper();
        this.userMapper = new UserMapper();
    }

    async createNotification(notificationData) {
        const { error } = NotificationEntity.createSchema.validate(notificationData);
        if (error) throw new Error(error.details[0].message);

        if (await this.userMapper.findById(notificationData.user_id) === null) {
            throw new Error('用户不存在');
        }

        try {
            await this.mapper.beginTransaction();
            const notificationId = await this.mapper.create(notificationData);
            await this.mapper.commit();
            const createdNotification = await this.mapper.getById(notificationId);
            return createdNotification;
        } catch (error) {
            await this.mapper.rollback();
            throw error;
        }
    }

    async getNotificationById(id) {
        const notification = await this.mapper.getById(id);
        if (!notification) throw new Error('通知不存在');
        return notification;
    }

    async updateNotification(id, updateData) {
        const { error } = NotificationEntity.updateSchema.validate(updateData);
        if (error) throw new Error(error.details[0].message);

        const result = await this.mapper.update(id, updateData);
        if (!result) throw new Error('更新通知失败');
        return result;
    }

    async deleteNotification(id) {
        const notification = await this.mapper.getById(id);
        if (!notification) throw new Error('通知不存在');

        const result = await this.mapper.delete(id);
        if (!result) throw new Error('删除通知失败');
        return result;
    }

    async markNotificationAsRead(id) {
        const result = await this.mapper.markAsRead(id);
        if (!result) throw new Error('标记已读失败');
        return result;
    }

    async markAllNotificationsAsRead(userId, sender) {
        if (!ALLOWED_SENDER.includes(sender)) {
            throw new Error('发送者类型不合法');
        }
        const result = await this.mapper.markAllAsRead(userId, sender);
        if (!result) throw new Error('标记全部已读失败');
        return result;
    }

    async getUserNotifications(userId, page, pageSize,sender) {
        if (!ALLOWED_SENDER.includes(sender)) {
            throw new Error('发送者类型不合法');
        }
        return this.mapper.getUserNotifications(userId, page, pageSize,sender);
    }

    async checkNotificationPermission(id, userId) {
        const isOwner = await this.mapper.checkOwnership(id, userId);
        if (!isOwner) throw new Error('无操作权限');
        return true;
    }
}

module.exports = NotificationService;
