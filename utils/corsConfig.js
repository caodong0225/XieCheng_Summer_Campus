// utils/corsConfig.js
const whitelist = [
    'http://localhost:3001', // 开发环境
    'http://localhost:8081'
];

const corsOptions = {
    origin: (origin, callback) => {
        // 允许白名单或没有来源的请求（如 Postman）
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('CORS 策略禁止跨域访问'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Custom-Header'],
    credentials: true, // 允许携带 Cookie
    maxAge: 86400 // 预检请求缓存时间（秒）
};

module.exports = corsOptions;