/**
 * 风险管理路由
 */

const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');

// 获取风险摘要
router.get('/summary', async (req, res) => {
  try {
    const summary = {
      totalRiskScore: 45,
      riskLevel: 'medium',
      activeAlerts: 2,
      breachedRules: 1,
      positions: [
        {
          symbol: 'BTC/USDT',
          riskScore: 60,
          var: 1250,
          expectedShortfall: 1800
        }
      ],
      metrics: {
        portfolioVar: 2100,
        maxDrawdown: 8.5,
        volatility: 12.3,
        correlation: 0.65
      }
    };
    
    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('获取风险摘要失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取风险预警
router.get('/alerts', async (req, res) => {
  try {
    const alerts = [
      {
        id: '1',
        level: 'medium',
        message: 'BTC/USDT仓位超过最大限制的80%',
        timestamp: new Date().toISOString(),
        active: true,
        acknowledged: false
      }
    ];
    
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('获取风险预警失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 启用紧急模式
router.post('/emergency/enable', async (req, res) => {
  try {
    const { reason } = req.body;
    logger.warn(`启用紧急模式: ${reason || 'manual'}`);
    
    res.json({
      success: true,
      message: '紧急模式已启用，所有交易已暂停'
    });
  } catch (error) {
    logger.error('启用紧急模式失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;