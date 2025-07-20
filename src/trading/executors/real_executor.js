/**
 * 实盘交易执行器
 * 用于实际交易环境下的订单执行
 */

const Executor = require('../executor');
const logger = require('../../utils/logger');

class RealExecutor extends Executor {
  constructor(options = {}) {
    super({ ...options, type: 'real' });
    this.exchange = options.exchange;
    this.apiKey = options.apiKey;
    this.secretKey = options.secretKey;
    this.passphrase = options.passphrase;
    this.sandbox = options.sandbox || false;
    
    if (!this.exchange) {
      throw new Error('实盘执行器需要配置交易所实例');
    }
  }
  
  async connect() {
    if (this.isConnected) {
      logger.warn(`实盘执行器 ${this.name} 已连接`);
      return;
    }
    
    try {
      logger.info(`连接实盘执行器 ${this.name}...`);
      
      // 测试API连接
      await this.exchange.loadMarkets();
      const balance = await this.exchange.fetchBalance();
      
      this.isConnected = true;
      this.emit('connected');
      logger.info(`实盘执行器 ${this.name} 连接成功`);
    } catch (error) {
      logger.error(`实盘执行器 ${this.name} 连接失败:`, error);
      throw error;
    }
  }
  
  async disconnect() {
    if (!this.isConnected) {
      logger.warn(`实盘执行器 ${this.name} 未连接`);
      return;
    }
    
    logger.info(`断开实盘执行器 ${this.name}...`);
    this.isConnected = false;
    this.emit('disconnected');
    logger.info(`实盘执行器 ${this.name} 已断开连接`);
  }
  
  async createOrder(orderRequest) {
    if (!this.isConnected) {
      throw new Error('执行器未连接');
    }
    
    this.validateOrderRequest(orderRequest);
    const order = this.createOrderObject(orderRequest);
    
    try {
      logger.info(`创建实盘订单:`, order);
      
      let exchangeOrder;
      if (order.type === 'market') {
        if (order.side === 'buy') {
          exchangeOrder = await this.exchange.createMarketBuyOrder(order.symbol, order.amount);
        } else {
          exchangeOrder = await this.exchange.createMarketSellOrder(order.symbol, order.amount);
        }
      } else {
        if (order.side === 'buy') {
          exchangeOrder = await this.exchange.createLimitBuyOrder(order.symbol, order.amount, order.price);
        } else {
          exchangeOrder = await this.exchange.createLimitSellOrder(order.symbol, order.amount, order.price);
        }
      }
      
      // 更新本地订单信息
      const updatedOrder = this.updateOrderFromExchange(order, exchangeOrder);
      this.orders.set(order.orderId, updatedOrder);
      
      this.emit('order:created', updatedOrder);
      logger.info(`实盘订单创建成功: ${order.orderId}`);
      
      // 启动订单状态监控
      this.startOrderMonitoring(order.orderId);
      
      return updatedOrder;
    } catch (error) {
      logger.error(`创建实盘订单失败:`, error);
      this.updateOrderStatus(order.orderId, 'failed');
      throw error;
    }
  }
  
  async cancelOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`订单 ${orderId} 不存在`);
    }
    
    if (!order.exchangeOrderId) {
      throw new Error(`订单 ${orderId} 没有交易所订单ID`);
    }
    
    try {
      await this.exchange.cancelOrder(order.exchangeOrderId, order.symbol);
      this.updateOrderStatus(orderId, 'cancelled');
      logger.info(`取消实盘订单: ${orderId}`);
      
      return order;
    } catch (error) {
      logger.error(`取消实盘订单失败:`, error);
      throw error;
    }
  }
  
  async getOrder(orderId) {
    const localOrder = this.orders.get(orderId);
    if (!localOrder || !localOrder.exchangeOrderId) {
      return localOrder;
    }
    
    try {
      const exchangeOrder = await this.exchange.fetchOrder(localOrder.exchangeOrderId, localOrder.symbol);
      this.updateOrderFromExchange(localOrder, exchangeOrder);
      return localOrder;
    } catch (error) {
      logger.error(`获取订单状态失败:`, error);
      return localOrder;
    }
  }
  
  async getBalance() {
    if (!this.isConnected) {
      throw new Error('执行器未连接');
    }
    
    try {
      const balance = await this.exchange.fetchBalance();
      return balance;
    } catch (error) {
      logger.error('获取余额失败:', error);
      throw error;
    }
  }
  
  async getPosition(symbol) {
    if (!this.isConnected) {
      throw new Error('执行器未连接');
    }
    
    try {
      const balance = await this.exchange.fetchBalance();
      const baseAsset = symbol.split('/')[0];
      
      return {
        amount: balance[baseAsset]?.total || 0,
        available: balance[baseAsset]?.free || 0,
        locked: balance[baseAsset]?.used || 0
      };
    } catch (error) {
      logger.error('获取持仓失败:', error);
      throw error;
    }
  }
  
  startOrderMonitoring(orderId) {
    const checkInterval = setInterval(async () => {
      try {
        const order = await this.getOrder(orderId);
        if (order && ['filled', 'cancelled', 'failed'].includes(order.status)) {
          clearInterval(checkInterval);
        }
      } catch (error) {
        logger.error(`监控订单 ${orderId} 失败:`, error);
        clearInterval(checkInterval);
      }
    }, 5000);
  }
  
  updateOrderFromExchange(localOrder, exchangeOrder) {
    localOrder.exchangeOrderId = exchangeOrder.id;
    localOrder.status = this.convertStatus(exchangeOrder.status);
    localOrder.filled = exchangeOrder.filled || 0;
    localOrder.remaining = exchangeOrder.remaining || exchangeOrder.amount;
    localOrder.cost = exchangeOrder.cost || 0;
    localOrder.fee = exchangeOrder.fee;
    
    if (localOrder.status === 'filled') {
      localOrder.filledTime = exchangeOrder.lastTradeTimestamp || Date.now();
      this.emit('order:filled', localOrder);
    }
    
    return localOrder;
  }
  
  convertStatus(exchangeStatus) {
    const statusMap = {
      'open': 'pending',
      'closed': 'filled',
      'canceled': 'cancelled',
      'cancelled': 'cancelled'
    };
    
    return statusMap[exchangeStatus] || exchangeStatus;
  }
}

module.exports = RealExecutor;