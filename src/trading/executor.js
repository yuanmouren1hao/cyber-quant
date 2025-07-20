/**
 * 交易执行器基类
 * 提供交易执行的基础功能
 */

const EventEmitter = require('events');
const logger = require('../utils/logger');

class Executor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.name = options.name || 'unnamed_executor';
    this.type = options.type || 'base';
    this.isConnected = false;
    this.orders = new Map();
    this.orderIdCounter = 1;
  }
  
  async connect() {
    throw new Error('connect() 方法必须在子类中实现');
  }
  
  async disconnect() {
    throw new Error('disconnect() 方法必须在子类中实现');
  }
  
  async createOrder(orderRequest) {
    throw new Error('createOrder() 方法必须在子类中实现');
  }
  
  async cancelOrder(orderId) {
    throw new Error('cancelOrder() 方法必须在子类中实现');
  }
  
  async getOrder(orderId) {
    throw new Error('getOrder() 方法必须在子类中实现');
  }
  
  async getBalance() {
    throw new Error('getBalance() 方法必须在子类中实现');
  }
  
  async getPosition(symbol) {
    throw new Error('getPosition() 方法必须在子类中实现');
  }
  
  generateOrderId() {
    return `${this.name}_${Date.now()}_${this.orderIdCounter++}`;
  }
  
  validateOrderRequest(orderRequest) {
    const required = ['symbol', 'side', 'amount', 'type'];
    for (const field of required) {
      if (!orderRequest[field]) {
        throw new Error(`订单请求缺少必要字段: ${field}`);
      }
    }
    
    if (!['buy', 'sell'].includes(orderRequest.side)) {
      throw new Error(`无效的订单方向: ${orderRequest.side}`);
    }
    
    if (!['market', 'limit'].includes(orderRequest.type)) {
      throw new Error(`无效的订单类型: ${orderRequest.type}`);
    }
    
    if (orderRequest.amount <= 0) {
      throw new Error('订单数量必须大于0');
    }
    
    if (orderRequest.type === 'limit' && (!orderRequest.price || orderRequest.price <= 0)) {
      throw new Error('限价订单必须指定有效价格');
    }
  }
  
  createOrderObject(orderRequest) {
    return {
      orderId: this.generateOrderId(),
      symbol: orderRequest.symbol,
      side: orderRequest.side,
      amount: orderRequest.amount,
      type: orderRequest.type,
      price: orderRequest.price || null,
      status: 'pending',
      timestamp: Date.now(),
      filled: 0,
      remaining: orderRequest.amount,
      cost: 0,
      fee: 0
    };
  }
  
  updateOrderStatus(orderId, status, filled = null, cost = null, fee = null) {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`订单 ${orderId} 不存在`);
    }
    
    order.status = status;
    if (filled !== null) {
      order.filled = filled;
      order.remaining = order.amount - filled;
    }
    if (cost !== null) {
      order.cost = cost;
    }
    if (fee !== null) {
      order.fee = fee;
    }
    
    logger.info(`订单 ${orderId} 状态更新: ${status}`);
    this.emit('order:updated', order);
    
    if (status === 'filled') {
      this.emit('order:filled', order);
    } else if (status === 'cancelled') {
      this.emit('order:cancelled', order);
    }
    
    return order;
  }
  
  getAllOrders() {
    return Array.from(this.orders.values());
  }
  
  getOrdersByStatus(status) {
    return this.getAllOrders().filter(order => order.status === status);
  }
  
  getOrdersBySymbol(symbol) {
    return this.getAllOrders().filter(order => order.symbol === symbol);
  }
}

module.exports = Executor;