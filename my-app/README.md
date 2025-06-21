# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# 携程暑期校园项目

这是一个基于React Native和Expo的旅行分享应用，支持游记发布、视频分享等功能。

## 功能特性

### 最新功能：抖音式视频滑动
- **垂直滑动浏览**：类似抖音的垂直滑动视频浏览体验
- **视频播放控制**：点击视频暂停/播放
- **点赞功能**：支持视频点赞，实时更新点赞数
- **收藏功能**：支持视频收藏，实时更新收藏数
- **下拉刷新**：支持下拉刷新获取最新视频
- **无限滚动**：自动加载更多视频内容
- **响应式设计**：适配不同屏幕尺寸

### 其他功能
- 游记发布和管理
- 图片和视频上传
- 用户个人资料管理
- 消息通知系统
- 评论和回复功能

## 技术栈

- **前端框架**：React Native + Expo
- **路由管理**：Expo Router
- **样式**：Tailwind CSS (twrnc)
- **视频播放**：react-native-video
- **图片处理**：expo-image
- **状态管理**：React Hooks

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npx expo start
```

3. 在模拟器或真机上运行：
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

## 项目结构

```
my-app/
├── app/
│   ├── (tabs)/           # 标签页路由
│   │   ├── home/         # 首页
│   │   ├── video/        # 视频页面（新增抖音式滑动）
│   │   ├── post/         # 发布游记
│   │   ├── message/      # 消息
│   │   └── profile/      # 个人资料
│   ├── api/              # API接口
│   ├── components/       # 公共组件
│   ├── store/           # 状态管理
│   ├── types/           # TypeScript类型定义
│   └── utils/           # 工具函数
├── assets/              # 静态资源
└── package.json
```

## 视频功能API

### 获取视频列表
```typescript
GET /video/unread?page=1&limit=10

Response:
{
  "code": 200,
  "message": "未读视频列表获取成功",
  "data": {
    "videos": [
      {
        "id": 3,
        "created_at": "2025-06-21T08:06:09.000Z",
        "description": "test",
        "link": "https://example.com/video.mp4",
        "thumbnail": "https://example.com/thumbnail.jpg",
        "play_count": "100",
        "like_count": "50",
        "collect_count": "20",
        "is_liked": false,
        "is_collected": false
      }
    ],
    "page": 1,
    "limit": 10
  }
}
```

### 点赞视频
```typescript
POST /video/like/{id}
```

### 收藏视频
```typescript
POST /video/collect/{id}
```

## 使用说明

### 视频滑动功能
1. 进入"视频"标签页
2. 上下滑动浏览视频
3. 点击视频暂停/播放
4. 点击右侧按钮进行点赞、评论、收藏操作
5. 下拉刷新获取最新视频
6. 滑动到底部自动加载更多视频

### 游记发布
1. 进入"发游记"标签页
2. 添加标题和内容
3. 上传图片或视频
4. 发布游记

## 开发注意事项

1. **视频播放优化**：使用`react-native-video`组件，支持自动播放和循环播放
2. **性能优化**：使用`FlatList`的`getItemLayout`属性优化滚动性能
3. **内存管理**：及时清理视频资源，避免内存泄漏
4. **错误处理**：完善的错误处理和用户提示

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License
