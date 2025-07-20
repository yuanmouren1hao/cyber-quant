/**
 * 仪表盘路由
 */

const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');

// 获取仪表盘数据
router.get('/data', async (req, res) => {
  try {
    const dashboardData = {
      summary: {
        totalValue: 125000,
        dailyPnL: 2500,
        dailyReturn: 2.04,
        totalReturn: 15.8,
        activePositions: 5,
        runningStrategies: 3
      },
      positions: [
        {
          symbol: 'BTC/USDT',
          side: 'long',
          size: 0.5,
          entryPrice: 45000,
          currentPrice: 46200,
          pnl: 600,
          pnlPercent: 2.67
        },
        {
          symbol: 'ETH/USDT',
          side: 'long',
          size: 2.0,
          entryPrice: 3200,
          currentPrice: 3280,
          pnl: 160,
          pnlPercent: 2.5
        }
      ],
      recentTrades: [
        {
          id: '1',
          symbol: 'BTC/USDT',
          side: 'buy',
          amount: 0.1,
          price: 45500,
          timestamp: new Date().toISOString(),
          status: 'filled'
        }
      ],
      performance: {
        labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
        returns: [2.1, 3.5, -1.2, 4.8, 2.3, 1.9]
      }
    };
    
    res.json({ success: true, data: dashboardData });
  } catch (error) {
    logger.error('获取仪表盘数据失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取市场数据
router.get('/market', async (req, res) => {
  try {
    const marketData = {
      symbols: [
        {
          symbol: 'BTC/USDT',
          price: 46200,
          change24h: 1250,
          changePercent24h: 2.78,
          volume24h: 1250000000
        },
        {
          symbol: 'ETH/USDT',
          price: 3280,
          change24h: 85,
          changePercent24h: 2.66,
          volume24h: 850000000
        }
      ],
      indices: {
        fear_greed: 65,
        volatility: 0.045,
        trend: 'bullish'
      }
    };
    
    res.json({ success: true, data: marketData });
  } catch (error) {
    logger.error('获取市场数据失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;