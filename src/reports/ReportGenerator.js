/**
 * 报告生成器
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class ReportGenerator {
  constructor(config = {}) {
    this.config = config;
    this.outputDir = config.outputDir || './reports/output';
    this.templates = new Map();
  }
  
  async initialize() {
    await this.ensureOutputDir();
    this.setupTemplates();
    logger.info('报告生成器初始化完成');
  }
  
  async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      logger.error('创建输出目录失败:', error);
    }
  }
  
  setupTemplates() {
    this.templates.set('daily', this.generateDailyReport.bind(this));
    this.templates.set('weekly', this.generateWeeklyReport.bind(this));
    this.templates.set('monthly', this.generateMonthlyReport.bind(this));
    this.templates.set('performance', this.generatePerformanceReport.bind(this));
    this.templates.set('risk', this.generateRiskReport.bind(this));
  }
  
  async generateReport(type, data, options = {}) {
    try {
      const generator = this.templates.get(type);
      if (!generator) {
        throw new Error(`未知的报告类型: ${type}`);
      }
      
      const report = await generator(data, options);
      
      if (options.save !== false) {
        const filename = this.generateFilename(type, options);
        await this.saveReport(report, filename);
      }
      
      logger.info(`报告生成完成: ${type}`);
      return report;
      
    } catch (error) {
      logger.error(`生成报告失败 (${type}):`, error);
      throw error;
    }
  }
  
  async generateDailyReport(data, options) {
    const report = {
      type: 'daily',
      date: new Date().toISOString().split('T')[0],
      summary: {
        totalTrades: data.trades?.length || 0,
        totalVolume: this.calculateTotalVolume(data.trades),
        totalPnL: this.calculateTotalPnL(data.trades),
        winRate: this.calculateWinRate(data.trades)
      },
      trades: data.trades || [],
      performance: {
        return: this.calculateDailyReturn(data),
        sharpeRatio: this.calculateSharpeRatio(data),
        maxDrawdown: this.calculateMaxDrawdown(data)
      },
      riskMetrics: {
        var: this.calculateVaR(data),
        volatility: this.calculateVolatility(data)
      }
    };
    
    return report;
  }
  
  async generateWeeklyReport(data, options) {
    const report = {
      type: 'weekly',
      weekStart: this.getWeekStart(),
      weekEnd: this.getWeekEnd(),
      summary: {
        totalTrades: data.trades?.length || 0,
        avgDailyVolume: this.calculateAvgDailyVolume(data),
        weeklyReturn: this.calculateWeeklyReturn(data),
        bestDay: this.findBestDay(data),
        worstDay: this.findWorstDay(data)
      },
      dailyBreakdown: this.generateDailyBreakdown(data),
      strategies: this.analyzeStrategies(data)
    };
    
    return report;
  }
  
  async generateMonthlyReport(data, options) {
    const report = {
      type: 'monthly',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      summary: {
        totalTrades: data.trades?.length || 0,
        monthlyReturn: this.calculateMonthlyReturn(data),
        avgWeeklyReturn: this.calculateAvgWeeklyReturn(data),
        consistency: this.calculateConsistency(data)
      },
      weeklyBreakdown: this.generateWeeklyBreakdown(data),
      topPerformers: this.findTopPerformers(data),
      improvements: this.suggestImprovements(data)
    };
    
    return report;
  }
  
  async generatePerformanceReport(data, options) {
    const report = {
      type: 'performance',
      period: options.period || 'all',
      metrics: {
        totalReturn: this.calculateTotalReturn(data),
        annualizedReturn: this.calculateAnnualizedReturn(data),
        volatility: this.calculateVolatility(data),
        sharpeRatio: this.calculateSharpeRatio(data),
        maxDrawdown: this.calculateMaxDrawdown(data),
        calmarRatio: this.calculateCalmarRatio(data),
        winRate: this.calculateWinRate(data.trades),
        profitFactor: this.calculateProfitFactor(data.trades)
      },
      benchmarkComparison: this.compareToBenchmark(data, options.benchmark),
      riskAnalysis: this.analyzeRisk(data)
    };
    
    return report;
  }
  
  async generateRiskReport(data, options) {
    const report = {
      type: 'risk',
      timestamp: new Date().toISOString(),
      summary: {
        overallRiskScore: this.calculateOverallRiskScore(data),
        riskLevel: this.determineRiskLevel(data),
        activeAlerts: data.alerts?.filter(a => a.active) || []
      },
      metrics: {
        var: this.calculateVaR(data),
        expectedShortfall: this.calculateExpectedShortfall(data),
        maxDrawdown: this.calculateMaxDrawdown(data),
        volatility: this.calculateVolatility(data)
      },
      positions: this.analyzePositionRisk(data.positions),
      recommendations: this.generateRiskRecommendations(data)
    };
    
    return report;
  }
  
  // 辅助计算方法
  calculateTotalVolume(trades) {
    return trades?.reduce((sum, trade) => sum + (trade.volume || 0), 0) || 0;
  }
  
  calculateTotalPnL(trades) {
    return trades?.reduce((sum, trade) => sum + (trade.pnl || 0), 0) || 0;
  }
  
  calculateWinRate(trades) {
    if (!trades || trades.length === 0) return 0;
    const wins = trades.filter(trade => (trade.pnl || 0) > 0).length;
    return wins / trades.length;
  }
  
  calculateDailyReturn(data) {
    // 简化实现
    return (data.endValue - data.startValue) / data.startValue || 0;
  }
  
  calculateSharpeRatio(data) {
    // 简化实现
    return data.sharpeRatio || 0;
  }
  
  calculateMaxDrawdown(data) {
    // 简化实现
    return data.maxDrawdown || 0;
  }
  
  calculateVaR(data) {
    // 简化实现
    return data.var || 0;
  }
  
  calculateVolatility(data) {
    // 简化实现
    return data.volatility || 0;
  }
  
  getWeekStart() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  }
  
  getWeekEnd() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + 6;
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  }
  
  generateFilename(type, options) {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${type}_report_${timestamp}.json`;
  }
  
  async saveReport(report, filename) {
    const filepath = path.join(this.outputDir, filename);
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    logger.info(`报告已保存: ${filepath}`);
  }
}

module.exports = ReportGenerator;