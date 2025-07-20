/**
 * 模拟交易执行器
 * 用于模拟交易环境下的订单执行
 */

const Executor = require('../executor');
const logger = require('../../utils/logger');

class MockExecutor extends Executor {
  constructor(options = {}) {
    super({ ...options, type: 'mock' });
    this.initialBalance = options.initialBalance || 10000;
    this.balance = { USDT: this.initialBalance };
    this.positions = new Map();
    this.marketData = new Map();
    this.slippage = options.slippage || 0.001;
    this.commission = options.commission || 0.001;
  }
  
  async connect() {
    if (this.isConnected) {
      logger.warn(`模拟执行器 ${this.name} 已连接`);
      return;
    }
    
    logger.info(`连接模拟执行器 ${this.name}...`);
    this.isConnected = true;
    this.emit('connected');
    logger.info(`模拟执行器 ${this.name} 连接成功`);
  }
  
  async disconnect() {
    if (!this.isConnected) {
      logger.warn(`模拟执行器 ${this.name} 未连接`);
      return;
    }
    
    logger.info(`断开模拟执行器 ${this.name}...`);
    this.isConnected = false;
    this.emit('disconnected');
    logger.info(`模拟执行器 ${this.name} 已断开连接`);
  }
  
  async createOrder(orderRequest) {
    if (!this.isConnected) {
      throw new Error('执行器未连接');
    }
    
    this.validateOrderRequest(orderRequest);
    const order = this.createOrderObject(orderRequest);
    this.orders.set(order.orderId, order);
    
    logger.info(`创建模拟订单:`, order);
    this.emit('order:created', order);
    
    // 模拟订单执行
    setTimeout(() => {
      this.simulateOrderExecution(order);
    }, 100);
    
    return order;
  }
  
  async cancelOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`订单 ${orderId} 不存在`);
    }
    
    if (order.status !== 'pending') {
      throw new Error(`订单 ${orderId} 无法取消，当前状态: ${order.status}`);
    }
    
    this.updateOrderStatus(orderId, 'cancelled');
    logger.info(`取消模拟订单: ${orderId}`);
    
    return order;
  }
  
  async getOrder(orderId) {
    return this.orders.get(orderId) || null;
  }
  
  async getBalance() {
    return { ...this.balance };
  }
  
  async getPosition(symbol) {
    return this.positions.get(symbol) || { amount: 0, avgPrice: 0 };
  }
  
  simulateOrderExecution(order) {
    try {
      const marketPrice = this.getMarketPrice(order.symbol);
      if (!marketPrice) {
        this.updateOrderStatus(order.orderId, 'failed');
        return;
      }
      
      let executionPrice;
      if (order.type === 'market') {
        executionPrice = this.applySlippage(marketPrice, order.side);
      } else {
        executionPrice = order.price;
        // 简化的限价单逻辑
        if ((order.side === 'buy' && order.price < marketPrice) ||
            (order.side === 'sell' && order.price > marketPrice)) {
          // 价格不满足，订单保持pending状态
          return;
        }
      }
      
      const cost = order.amount * executionPrice;
      const fee = cost * this.commission;
      
      if (order.side === 'buy') {
        if (this.balance.USDT >= cost + fee) {
          this.balance.USDT -= (cost + fee);
          this.updatePosition(order.symbol, order.amount, executionPrice);
          this.updateOrderStatus(order.orderId, 'filled', order.amount, cost, fee);
        } else {
          this.updateOrderStatus(order.orderId, 'failed');
        }
      } else {
        const position = this.positions.get(order.symbol);
        if (position && position.amount >= order.amount) {
          this.balance.USDT += (cost - fee);
          this.updatePosition(order.symbol, -order.amount, executionPrice);
          this.updateOrderStatus(order.orderId, 'filled', order.amount, cost, fee);
        } else {
          this.updateOrderStatus(order.orderId, 'failed');
        }
      }
    } catch (error) {
      logger.error(`模拟订单执行失败:`, error);
      this.updateOrderStatus(order.orderId, 'failed');
    }
  }
  
  applySlippage(price, side) {
    const slippageAmount = price * this.slippage;
    return side === 'buy' ? price + slippageAmount : price - slippageAmount;
  }
  
  getMarketPrice(symbol) {
    const data = this.marketData.get(symbol);
    return data ? data.price : 100; // 默认价格
  }
  
  updateMarketData(symbol, price) {
    this.marketData.set(symbol, { price, timestamp: Date.now() });
  }
  
  updatePosition(symbol, amount, price) {
    if (!this.positions.has(symbol)) {
      this.positions.set(symbol, { amount: 0, avgPrice: 0 });
    }
    
    const position = this.positions.get(symbol);
    const newAmount = position.amount + amount;
    
    if (newAmount === 0) {
      this.positions.delete(symbol);
    } else if (amount > 0) {
      // 买入，更新平均价格
      const totalCost = (position.amount * position.avgPrice) + (amount * price);
      position.avgPrice = totalCost / newAmount;
      position.amount = newAmount;
    } else {
      // 卖出，不更新平均价格
      position.amount = newAmount;
    }
  }
}

module.exports = MockExecutor;