# 旅游日记平台

## 项目简介
本项目是一个基于 React 和 React Native 的全栈应用，主要用于旅行相关的功能开发。项目使用了 TypeScript 进行类型检查，结合 SQL 数据库进行数据存储，并通过 MinIO 实现文件存储功能。

## 技术栈
- **前端**: React, React Native
- **后端**: Node.js, Express
- **数据库**: SQL
- **语言**: TypeScript, JavaScript
- **包管理工具**: npm
- **文件存储**: MinIO

## 环境变量配置
项目使用 `.env` 文件来管理环境变量。以下是 `.env-example` 文件的示例配置：

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456
DB_NAME=travel
JWT_SECRET=super-secret-jwt-key-which-should-be-long-enough-256
MINIO_ENDPOINT=xxx
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=tMDi72DP50P8ua712A4Y
MINIO_SECRET_KEY=t1ZH09OEesYYU8IXMg9HKzXFOnsWjDCDFTJjqMfF
MINIO_BUCKET=xxx
MINIO_VIDEO_BUCKET=xxx
MINIO_THUMBNAIL_BUCKET=xxx
MINIO_PUBLIC_URL=xxx
```

请根据实际需求修改 `.env` 文件中的配置。

## 项目功能
- 用户认证与授权（JWT）
- 数据存储与管理（SQL 数据库）
- 文件上传与存储（MinIO）
- 前端界面开发（React）
- 移动端应用开发（React Native）

## 安装与运行
1. 克隆项目到本地：
   ```bash
   git clone https://github.com/caodong0225/your-repo-name.git
   cd your-repo-name
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 配置环境变量：
   根据 `.env-example` 文件创建 `.env` 文件，并填写相关配置。

4. 启动项目：
    - 启动前端：
      ```bash
      npm start
      ```
    - 启动后端：
      ```bash
      npm run server
      ```

## 文件结构
```
├── src/                # 源代码
├── public/             # 静态资源
├── .env-example        # 环境变量示例文件
├── package.json        # 项目依赖配置
└── README.md           # 项目说明
```

## 注意事项
- 请勿将敏感信息（如数据库密码、JWT 密钥等）暴露在公共仓库中。
- 确保 `.env` 文件已正确配置。

## 许可证
本项目遵循 MIT 许可证。

