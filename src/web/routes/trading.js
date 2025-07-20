/**
 * 交易路由
 */

const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');

// 获取策略列表
router.get('/strategies', async (req, res) => {
  try {
    const strategies = [
      {
        id: 'ma_cross',
        name: '移动平均线交叉',
        status: 'running',
        pnl: 1250,
        trades: 15,
        winRate: 0.67
      },
      {
        id: 'rsi_reversal',
        name: 'RSI反转策略',
        status: 'stopped',
        pnl: -350,
        trades: 8,
        winRate: 0.38
      }
    ];
    
    res.json({ success: true, data: strategies });
  } catch (error) {
    logger.error('获取策略列表失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 启动策略
router.post('/strategies/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`启动策略: ${id}`);
    
    res.json({
      success: true,
      message: `策略 ${id} 已启动`
    });
  } catch (error) {
    logger.error('启动策略失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 停止策略
router.post('/strategies/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`停止策略: ${id}`);
    
    res.json({
      success: true,
      message: `策略 ${id} 已停止`
    });
  } catch (error) {
    logger.error('停止策略失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 手动下单
router.post('/orders', async (req, res) => {
  try {
    const { symbol, side, amount, price, type } = req.body;
    
    if (!symbol || !side || !amount) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数'
      });
    }
    
    const orderId = Date.now().toString();
    
    logger.info('创建订单:', { orderId, symbol, side, amount, price, type });
    
    res.json({
      success: true,
      data: {
        orderId,
        symbol,
        side,
        amount,
        price,
        type,
        status: 'pending'
      }
    });
  } catch (error) {
    logger.error('创建订单失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取订单历史
router.get('/orders', async (req, res) => {
  try {
    const orders = [
      {
        id: '1',
        symbol: 'BTC/USDT',
        side: 'buy',
        amount: 0.1,
        price: 45500,
        status: 'filled',
        timestamp: new Date().toISOString()
      }
    ];
    
    res.json({ success: true, data: orders });
  } catch (error) {
    logger.error('获取订单历史失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;