var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const corsOptions = require('./utils/corsConfig');
const webSocketServer = require('./websocketServer');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger'); // 确保路径正确
var indexRouter = require('./routes/index');
var userRouter = require('./routes/auth');
var noteRouter = require('./routes/note');
var notificationRouter = require('./routes/notification');
var threadRouter = require('./routes/thread');
var replyRouter = require('./routes/reply');
const fileRoutes = require('./routes/file');
const videoRouter = require('./routes/video'); // 确保路径正确

var app = express();


// ======== 添加 Swagger UI 中间件 ========
app.use('/api-docs',
    swaggerUi.serve,
    (req, res, next) => {
      // 设置自定义选项
      const options = {
        explorer: true, // 启用搜索栏
        customSiteTitle: 'API 文档',
        customCss: '.swagger-ui .topbar { display: none }',
        swaggerOptions: {
          docExpansion: 'none', // 默认折叠所有文档
          filter: true,         // 启用搜索过滤
          persistAuthorization: true, // 保持认证token
          displayRequestDuration: true // 显示请求时间
        }
      };
      return swaggerUi.setup(swaggerSpec, options)(req, res, next);
    }
);

// 处理 CORS
app.use(cors(corsOptions));

// 处理预检请求 OPTIONS
app.options('*', cors(corsOptions));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/note', noteRouter);
app.use('/notification', notificationRouter);
app.use('/file', fileRoutes);
app.use('/video', videoRouter); // 添加视频路由
app.use('/thread', threadRouter);
app.use('/reply', replyRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// 添加服务器监听
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

// 在路由之后、错误处理之前添加
app.use((err, req, res, next) => {
  console.error('❌ 未处理错误:', {
    message: err.message,
    stack: err.stack,
    request: {
      method: req.method,
      path: req.path,
      body: req.body
    }
  });
  next(err);
});


// 启动 WebSocket 服务（独立进程）
webSocketServer.initialize();
