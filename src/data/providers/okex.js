/**
 * OKEx数据提供者
 * 负责从OKEx获取市场数据和执行交易
 */

const ccxt = require('ccxt');
const WebSocket = require('ws');
const EventEmitter = require('events');
const logger = require('../../utils/logger');

/**
 * OKEx数据提供者类
 */
class OKExDataProvider extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.exchange = null;
    this.ws = null;
    this.subscriptions = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    
    this.initializeExchange();
  }

  /**
   * 初始化交易所连接
   */
  initializeExchange() {
    this.exchange = new ccxt.okx({
      apiKey: this.config.apiKey,
      secret: this.config.secretKey,
      password: this.config.passphrase,
      sandbox: this.config.sandbox,
      enableRateLimit: true,
      options: {
        defaultType: 'spot' // 现货交易
      }
    });
    
    logger.info('OKEx交易所连接初始化完成');
  }

  /**
   * 启动数据提供者
   */
  async start() {
    try {
      // 测试API连接
      await this.exchange.loadMarkets();
      logger.info('OKEx市场数据加载成功');
      
      // 建立WebSocket连接
      await this.connectWebSocket();
      
      this.emit('started');
      logger.info('OKEx数据提供者启动成功');
    } catch (error) {
      logger.error('OKEx数据提供者启动失败:', error);
      throw error;
    }
  }

  /**
   * 停止数据提供者
   */
  async stop() {
    try {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      
      this.isConnected = false;
      this.subscriptions.clear();
      
      this.emit('stopped');
      logger.info('OKEx数据提供者已停止');
    } catch (error) {
      logger.error('OKEx数据提供者停止失败:', error);
      throw error;
    }
  }

  /**
   * 连接WebSocket
   */
  async connectWebSocket() {
    const wsUrl = this.config.sandbox 
      ? 'wss://wspap.okx.com:8443/ws/v5/public'
      : 'wss://ws.okx.com:8443/ws/v5/public';
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.on('open', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('OKEx WebSocket连接已建立');
      this.emit('connected');
    });
    
    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleWebSocketMessage(message);
      } catch (error) {
        logger.error('WebSocket消息解析失败:', error);
      }
    });
    
    this.ws.on('close', () => {
      this.isConnected = false;
      logger.warn('OKEx WebSocket连接已关闭');
      this.emit('disconnected');
      
      // 自动重连
      this.attemptReconnect();
    });
    
    this.ws.on('error', (error) => {
      logger.error('OKEx WebSocket错误:', error);
      this.emit('error', error);
    });
  }

  /**
   * 处理WebSocket消息
   * @param {Object} message - WebSocket消息
   */
  handleWebSocketMessage(message) {
    if (message.event === 'subscribe') {
      logger.info('订阅成功:', message);
      return;
    }
    
    if (message.data && message.data.length > 0) {
      const data = message.data[0];
      
      // 处理ticker数据
      if (message.arg && message.arg.channel === 'tickers') {
        this.emit('ticker', {
          symbol: data.instId,
          price: parseFloat(data.last),
          volume: parseFloat(data.vol24h),
          change: parseFloat(data.sodUtc8),
          timestamp: parseInt(data.ts)
        });
      }
      
      // 处理K线数据
      if (message.arg && message.arg.channel === 'candle1m') {
        this.emit('kline', {
          symbol: data.instId,
          open: parseFloat(data[1]),
          high: parseFloat(data[2]),
          low: parseFloat(data[3]),
          close: parseFloat(data[4]),
          volume: parseFloat(data[5]),
          timestamp: parseInt(data[0])
        });
      }
      
      // 处理深度数据
      if (message.arg && message.arg.channel === 'books') {
        this.emit('depth', {
          symbol: data.instId,
          bids: data.bids.map(bid => [parseFloat(bid[0]), parseFloat(bid[1])]),
          asks: data.asks.map(ask => [parseFloat(ask[0]), parseFloat(ask[1])]),
          timestamp: parseInt(data.ts)
        });
      }
    }
  }

  /**
   * 订阅数据
   * @param {string} symbol - 交易对
   * @param {string} type - 数据类型
   */
  async subscribe(symbol, type = 'ticker') {
    if (!this.isConnected) {
      throw new Error('WebSocket未连接');
    }
    
    const channelMap = {
      ticker: 'tickers',
      kline: 'candle1m',
      depth: 'books'
    };
    
    const channel = channelMap[type];
    if (!channel) {
      throw new Error(`不支持的数据类型: ${type}`);
    }
    
    const subscribeMsg = {
      op: 'subscribe',
      args: [{
        channel: channel,
        instId: symbol
      }]
    };
    
    this.ws.send(JSON.stringify(subscribeMsg));
    this.subscriptions.set(`${symbol}:${type}`, true);
    
    logger.info(`订阅成功: ${symbol} - ${type}`);
  }

  /**
   * 取消订阅
   * @param {string} symbol - 交易对
   * @param {string} type - 数据类型
   */
  async unsubscribe(symbol, type = 'ticker') {
    if (!this.isConnected) {
      return;
    }
    
    const channelMap = {
      ticker: 'tickers',
      kline: 'candle1m',
      depth: 'books'
    };
    
    const channel = channelMap[type];
    if (!channel) {
      return;
    }
    
    const unsubscribeMsg = {
      op: 'unsubscribe',
      args: [{
        channel: channel,
        instId: symbol
      }]
    };
    
    this.ws.send(JSON.stringify(unsubscribeMsg));
    this.subscriptions.delete(`${symbol}:${type}`);
    
    logger.info(`取消订阅: ${symbol} - ${type}`);
  }

  /**
   * 获取K线数据
   * @param {string} symbol - 交易对
   * @param {string} interval - 时间间隔
   * @param {number} limit - 数据条数
   * @returns {Array} K线数据
   */
  async getKlineData(symbol, interval = '1m', limit = 100) {
    try {
      const ohlcv = await this.exchange.fetchOHLCV(symbol, interval, undefined, limit);
      return ohlcv.map(candle => ({
        timestamp: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
      }));
    } catch (error) {
      logger.error('获取K线数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前价格
   * @param {string} symbol - 交易对
   * @returns {number} 当前价格
   */
  async getCurrentPrice(symbol) {
    try {
      const ticker = await this.exchange.fetchTicker(symbol);
      return ticker.last;
    } catch (error) {
      logger.error('获取当前价格失败:', error);
      throw error;
    }
  }

  /**
   * 获取深度数据
   * @param {string} symbol - 交易对
   * @param {number} limit - 深度档位
   * @returns {Object} 深度数据
   */
  async getDepthData(symbol, limit = 20) {
    try {
      const orderbook = await this.exchange.fetchOrderBook(symbol, limit);
      return {
        bids: orderbook.bids,
        asks: orderbook.asks,
        timestamp: orderbook.timestamp
      };
    } catch (error) {
      logger.error('获取深度数据失败:', error);
      throw error;
    }
  }

  /**
   * 尝试重连
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('WebSocket重连次数已达上限，停止重连');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    logger.info(`${delay}ms后尝试第${this.reconnectAttempts}次重连`);
    
    setTimeout(() => {
      this.connectWebSocket();
    }, delay);
  }
}

module.exports = OKExDataProvider;
