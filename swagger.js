const swaggerJSDoc = require('swagger-jsdoc');
const packageJson = require('./package.json');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API 文档',
            version: packageJson.version || '1.0.0',
            description: '后端服务接口文档',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: '开发环境',
                // 添加变量支持
                variables: {
                    port: {
                        enum: [3000, 3001, 5000],
                        default: 3000
                    }
                }
            },
            // 生产环境配置（启用时取消注释）
            // {
            //   url: 'https://{domain}/api/v1',
            //   description: '生产环境',
            //   variables: {
            //     domain: {
            //       default: 'your-production-domain.com',
            //       enum: ['api.example.com', 'service.example.com']
            //     }
            //   }
            // }
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: '使用 JWT 进行认证，格式：Bearer <token>'
                }
            },
            // 添加通用响应模型
            responses: {
                UnauthorizedError: {
                    description: '认证失败或无效token',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    error: { type: 'string', example: 'Unauthorized' },
                                    message: { type: 'string', example: '无效的认证令牌' }
                                }
                            }
                        }
                    }
                }
            }
        },
        // 全局安全要求（适用于所有接口）
        security: [
            { BearerAuth: [] }
        ]
    },
    // 确保路径正确匹配你的路由文件
    apis: [
        './routes/*.js',           // 一级路由文件
        './routes/**/*.js'         // 子目录中的路由文件
    ]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;