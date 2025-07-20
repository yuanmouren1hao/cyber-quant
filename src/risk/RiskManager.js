/**
 * 风险管理器 - 管理所有风险控制规则和监控指标
 */

const EventEmitter = require('events');
const logger = require('../utils/logger');

class RiskManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = config;
    this.enabled = config.enabled !== false;
    this.checkInterval = config.checkInterval || 60000;
    this.maxDrawdown = config.maxDrawdown || 0.1;
    this.maxPositionSize = config.maxPositionSize || 0.3;
    this.maxLeverage = config.maxLeverage || 3;
    this.volatilityThreshold = config.volatilityThreshold || 0.05;
    
    this.checkers = new Map();
    this.breachedRules = new Map();
    this.riskScores = new Map();
    this.checkTimer = null;
    
    logger.info('风险管理器已初始化');
  }
  
  async initialize() {
    if (!this.enabled) {
      logger.warn('风险管理功能已禁用');
      return;
    }
    
    this.registerChecker('drawdown', this.checkDrawdown.bind(this));
    this.registerChecker('position', this.checkPositionSize.bind(this));
    this.registerChecker('leverage', this.checkLeverage.bind(this));
    this.registerChecker('volatility', this.checkVolatility.bind(this));
    
    logger.info('风险管理器初始化完成');
  }
  
  start() {
    if (!this.enabled) return;
    
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }
    
    this.checkTimer = setInterval(() => this.runChecks(), this.checkInterval);
    logger.info(`风险监控已启动，检查间隔: ${this.checkInterval}ms`);
  }
  
  stop() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    logger.info('风险监控已停止');
  }
  
  registerChecker(name, checkFn) {
    this.checkers.set(name, checkFn);
    logger.debug(`已注册风险检查器: ${name}`);
  }
  
  async runChecks() {
    try {
      logger.debug('正在执行风险检查...');
      
      const promises = [];
      for (const [name, checkFn] of this.checkers.entries()) {
        promises.push(
          checkFn().catch(err => {
            logger.error(`风险检查器 "${name}" 执行失败:`, err);
            return null;
          })
        );
      }
      
      await Promise.all(promises);
      this.emit('checksCompleted', this.getRiskSummary());
      
    } catch (error) {
      logger.error('执行风险检查时出错:', error);
    }
  }
  
  async checkDrawdown(account) {
    const currentValue = account?.totalValue || 0;
    const peakValue = account?.peakValue || currentValue;
    const drawdown = (peakValue - currentValue) / peakValue;
    
    if (drawdown > this.maxDrawdown) {
      this.recordRuleBreach('maxDrawdown', {
        current: drawdown,
        limit: this.maxDrawdown,
        severity: 'high'
      });
      return false;
    }
    return true;
  }
  
  async checkPositionSize(position) {
    const positionRatio = position?.size / position?.totalCapital || 0;
    
    if (positionRatio > this.maxPositionSize) {
      this.recordRuleBreach('maxPositionSize', {
        current: positionRatio,
        limit: this.maxPositionSize,
        severity: 'medium'
      });
      return false;
    }
    return true;
  }
  
  async checkLeverage(account) {
    const leverage = account?.leverage || 1;
    
    if (leverage > this.maxLeverage) {
      this.recordRuleBreach('maxLeverage', {
        current: leverage,
        limit: this.maxLeverage,
        severity: 'high'
      });
      return false;
    }
    return true;
  }
  
  async checkVolatility(symbol, priceData) {
    if (!priceData || priceData.length < 2) return true;
    
    const returns = [];
    for (let i = 1; i < priceData.length; i++) {
      returns.push((priceData[i] - priceData[i-1]) / priceData[i-1]);
    }
    
    const volatility = Math.sqrt(returns.reduce((sum, r) => sum + r*r, 0) / returns.length);
    
    if (volatility > this.volatilityThreshold) {
      this.recordRuleBreach('volatilityThreshold', {
        symbol,
        current: volatility,
        limit: this.volatilityThreshold,
        severity: 'medium'
      });
      return false;
    }
    return true;
  }
  
  updateRiskScore(assetId, score) {
    this.riskScores.set(assetId, score);
    this.emit('riskScoreUpdated', { assetId, score });
    
    if (score > 75) {
      this.emit('highRisk', { assetId, score, timestamp: new Date() });
      logger.warn(`资产 ${assetId} 风险分数过高: ${score}`);
    }
  }
  
  recordRuleBreach(ruleId, details) {
    this.breachedRules.set(ruleId, {
      ...details,
      timestamp: new Date(),
      breachCount: (this.breachedRules.get(ruleId)?.breachCount || 0) + 1
    });
    
    this.emit('ruleBreach', { ruleId, details });
    logger.warn(`风险规则违反: ${ruleId}`, details);
  }
  
  getRiskSummary() {
    return {
      timestamp: new Date(),
      totalRiskScore: this.calculateTotalRiskScore(),
      breachedRulesCount: this.breachedRules.size,
      highRiskAssets: Array.from(this.riskScores.entries())
        .filter(([_, score]) => score > 75)
        .map(([assetId, score]) => ({ assetId, score }))
    };
  }
  
  calculateTotalRiskScore() {
    if (this.riskScores.size === 0) return 0;
    
    const scores = Array.from(this.riskScores.values());
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }
}

module.exports = RiskManager;