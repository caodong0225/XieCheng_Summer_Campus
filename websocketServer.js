// websocketServer.js
const { Server } = require('socket.io');
const NotificationService = require("./service/NotificationService");
const {verifyWsJWT} = require("./utils/wsJwt");
const {createServer} = require("http");

class WebSocketServer {
    constructor(port) {
        this.port = port;
        this.httpServer = createServer(); // 独立 HTTP 服务器
        this.io = new Server(this.httpServer, {
            cors: { /*...*/ }
        });
        this.service = new NotificationService();
    }


    _setupMiddleware() {
        this.io.use((socket, next) => {
            // 新增会话追踪 ID（调试用）
            socket.traceId = Date.now().toString(36) + Math.random().toString(36).substr(2);
            next();
        });

        // 添加 JWT 验证中间件
        this.io.use(verifyWsJWT);

        // 添加错误处理中间件
        this.io.use((socket, next) => {
            socket.on('error', (err) => {
                console.error(`[${socket.traceId}] 连接错误:`, err.message);
            });
            next();
        });
    }

    initialize() {

        this._setupMiddleware();
        this._handleConnections();

        this.httpServer.listen(this.port, () => {
            console.log(`✅ WebSocket 运行在 ${this.port} 端口`);
        });
    }

    _handleConnections() {
        this.io.on('connect', (socket) => {
            // 添加详细的连接日志
            console.log('🔌 新的客户端连接');
            console.log('Socket ID:', socket.id);

            // 安全地检查用户信息
            if (socket.user) {
                const userId = Number(socket.user.id); // 确保转换为数字
                const room = `user_${userId}`;
                socket.join(room);
                console.log(`用户 ${userId} 加入房间 ${room}`);
            } else {
                console.warn('连接的客户端没有用户信息');
            }

            // 监听客户端事件
            socket.on('mark_as_read', async (data) => {
                try {
                    await this.service.markAllNotificationsAsRead(socket.user.userId, data.sender);
                    socket.emit('update_status', {
                        success: true
                    });
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            socket.on('disconnect', () => {
                console.log(`用户 ${socket.user.id} 已断开连接`);
                const userRoom = `user_${socket.user.id}`;
                socket.leave(userRoom);
            });
        });
    }

    // 获取 io 实例用于其他模块
    getIO() {
        return this.io;
    }
}

// 单例模式导出
module.exports = new WebSocketServer(3002);
