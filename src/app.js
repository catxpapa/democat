const express = require('express');
const cors = require('cors');
const path = require('path');

// 导入路由模块
const testRoutes = require('./routes/test');
const demoRoutes = require('./routes/demo');
// const codeRoutes = require('./routes/code');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// API路由配置
app.use('/api/test', testRoutes);
app.use('/api/demo', demoRoutes);
// app.use('/api/code', codeRoutes);

// 页面路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// app.get('/code-viewer', (req, res) => {
//   res.sendFile(path.join(__dirname, '../public/code-viewer.html'));
// });

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常 🎮',
    project: 'lazycat-playground',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('应用错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? error.message : '请联系管理员'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🎮 ================================= 🎮`);
  console.log(`🐱 后台服务已启动`);
  console.log(`🚀 端口: ${PORT}`);
  console.log(`🌐 主页面: http://localhost:${PORT}`);
  // console.log(`💻 代码查看器: http://localhost:${PORT}/code-viewer`);
  console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
  console.log(`🎮 ================================= 🎮`);
});

module.exports = app;