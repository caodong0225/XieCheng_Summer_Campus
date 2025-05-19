// src/services/ThreadService.js
const ThreadMapper = require('../mapper/ThreadMapper');

class ThreadService {
    constructor() {
        this.mapper = new ThreadMapper();
    }

    // 用户收藏操作
    async toggleCollection(userId, noteId) {
        const isCollected = await this.mapper.isCollection(userId, noteId);
        try {
            await this.mapper.beginTransaction();
            if (isCollected) {
                await this.mapper.cancelCollection(userId, noteId);
            } else {
                await this.mapper.collection(userId, noteId);
            }
            await this.mapper.commit();
            return { collected: !isCollected };
        } catch (error) {
            await this.mapper.rollback();
            throw new Error('收藏操作失败: ' + error.message);
        }
    }

    // 用户点赞操作
    async toggleFavorite(userId, noteId) {
        const isFavorited = await this.mapper.isFavorite(userId, noteId);
        try {
            await this.mapper.beginTransaction();
            if (isFavorited) {
                await this.mapper.cancelFavorite(userId, noteId);
            } else {
                await this.mapper.favorite(userId, noteId);
            }
            await this.mapper.commit();
            return { favorited: !isFavorited };
        } catch (error) {
            await this.mapper.rollback();
            throw new Error('点赞操作失败: ' + error.message);
        }
    }

}

module.exports = ThreadService;
