/**
 * Web服务器 - 提供用户界面和API
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');

const logger = require('../utils/logger');
const { getConfig } = require('../config');

// 路由
const dashboardRoutes = require('./routes/dashboard');
const tradingRoutes = require('./routes/trading');
const riskRoutes = require('./routes/risk');
const reportRoutes = require('./routes/reports');

class WebServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    this.config = getConfig().web || {};
    this.port = this.config.port || 3000;
    this.host = this.config.host || 'localhost';
  }
  
  async initialize() {
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupErrorHandling();
    
    logger.info('Web服务器初始化完成');
  }
  
  setupMiddleware() {
    // 安全中间件
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(cors());
    
    // 解析中间件
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // 会话中间件
    this.app.use(session({
      secret: this.config.sessionSecret || 'trading-system-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24小时
    }));
    
    // 静态文件
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // 视图引擎
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, 'views'));
    
    // 请求日志
    this.app.use((req, res, next) => {
      logger.debug(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }
  
  setupRoutes() {
    // 主页
    this.app.get('/', (req, res) => {
      res.render('dashboard', {
        title: '多市场量化交易系统',
        user: req.session.user || null
      });
    });
    
    // API路由
    this.app.use('/api/dashboard', dashboardRoutes);
    this.app.use('/api/trading', tradingRoutes);
    this.app.use('/api/risk', riskRoutes);
    this.app.use('/api/reports', reportRoutes);
    
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });
  }
  
  setupSocketIO() {
    this.io.on('connection', (socket) => {
      logger.info(`客户端连接: ${socket.id}`);
      
      // 发送初始数据
      socket.emit('connected', {
        message: '连接成功',
        timestamp: new Date().toISOString()
      });
      
      // 订阅实时数据
      socket.on('subscribe', (data) => {
        const { channels } = data;
        if (Array.isArray(channels)) {
          channels.forEach(channel => {
            socket.join(channel);
            logger.debug(`客户端 ${socket.id} 订阅频道: ${channel}`);
          });
        }
      });
      
      // 取消订阅
      socket.on('unsubscribe', (data) => {
        const { channels } = data;
        if (Array.isArray(channels)) {
          channels.forEach(channel => {
            socket.leave(channel);
            logger.debug(`客户端 ${socket.id} 取消订阅频道: ${channel}`);
          });
        }
      });
      
      // 断开连接
      socket.on('disconnect', () => {
        logger.info(`客户端断开连接: ${socket.id}`);
      });
    });
  }
  
  setupErrorHandling() {
    // 404处理
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: '页面未找到'
      });
    });
    
    // 错误处理
    this.app.use((err, req, res, next) => {
      logger.error('Web服务器错误:', err);
      
      res.status(err.status || 500).json({
        success: false,
        error: err.message || '内部服务器错误'
      });
    });
  }
  
  start() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, this.host, (err) => {
        if (err) {
          reject(err);
        } else {
          logger.info(`Web服务器启动成功: http://${this.host}:${this.port}`);
          resolve();
        }
      });
    });
  }
  
  stop() {
    return new Promise((resolve) => {
      this.server.close(() => {
        logger.info('Web服务器已停止');
        resolve();
      });
    });
  }
  
  // 广播实时数据
  broadcast(channel, data) {
    this.io.to(channel).emit('data', data);
  }
  
  // 发送通知
  sendNotification(userId, notification) {
    this.io.to(`user_${userId}`).emit('notification', notification);
  }
}

module.exports = WebServer;