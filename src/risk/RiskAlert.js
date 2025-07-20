/**
 * 风险预警系统
 */

const EventEmitter = require('events');
const logger = require('../utils/logger');

class RiskAlert extends EventEmitter {
  constructor(riskManager) {
    super();
    this.riskManager = riskManager;
    this.alerts = new Map();
    this.alertRules = new Map();
    this.notificationChannels = new Map();
  }
  
  async initialize() {
    this.setupDefaultRules();
    this.setupNotificationChannels();
    logger.info('风险预警系统初始化完成');
  }
  
  setupDefaultRules() {
    this.addAlertRule('highDrawdown', {
      condition: (data) => data.drawdown > 0.08,
      severity: 'high',
      message: '回撤超过8%警戒线'
    });
    
    this.addAlertRule('positionOversize', {
      condition: (data) => data.positionRatio > 0.25,
      severity: 'medium',
      message: '单一仓位超过25%'
    });
    
    this.addAlertRule('highVolatility', {
      condition: (data) => data.volatility > 0.04,
      severity: 'low',
      message: '市场波动率异常'
    });
  }
  
  setupNotificationChannels() {
    this.notificationChannels.set('console', this.consoleNotify.bind(this));
    this.notificationChannels.set('email', this.emailNotify.bind(this));
    this.notificationChannels.set('webhook', this.webhookNotify.bind(this));
  }
  
  addAlertRule(id, rule) {
    this.alertRules.set(id, rule);
    logger.debug(`添加预警规则: ${id}`);
  }
  
  async checkAlerts(data) {
    for (const [ruleId, rule] of this.alertRules.entries()) {
      try {
        if (rule.condition(data)) {
          await this.triggerAlert(ruleId, rule, data);
        }
      } catch (error) {
        logger.error(`检查预警规则 ${ruleId} 失败:`, error);
      }
    }
  }
  
  async triggerAlert(ruleId, rule, data) {
    const alertId = `${ruleId}_${Date.now()}`;
    const alert = {
      id: alertId,
      ruleId,
      severity: rule.severity,
      message: rule.message,
      data,
      timestamp: new Date(),
      acknowledged: false
    };
    
    this.alerts.set(alertId, alert);
    
    // 发送通知
    await this.sendNotifications(alert);
    
    // 发出事件
    this.emit('alertTriggered', alert);
    
    logger.warn(`触发预警: ${rule.message}`, { alertId, severity: rule.severity });
  }
  
  async sendNotifications(alert) {
    const channels = this.getNotificationChannels(alert.severity);
    
    for (const channel of channels) {
      try {
        const notifyFn = this.notificationChannels.get(channel);
        if (notifyFn) {
          await notifyFn(alert);
        }
      } catch (error) {
        logger.error(`发送通知失败 (${channel}):`, error);
      }
    }
  }
  
  getNotificationChannels(severity) {
    switch (severity) {
      case 'high':
        return ['console', 'email', 'webhook'];
      case 'medium':
        return ['console', 'email'];
      case 'low':
        return ['console'];
      default:
        return ['console'];
    }
  }
  
  async consoleNotify(alert) {
    logger.warn(`[预警] ${alert.message}`, alert);
  }
  
  async emailNotify(alert) {
    // TODO: 实现邮件通知
    logger.info(`邮件通知: ${alert.message}`);
  }
  
  async webhookNotify(alert) {
    // TODO: 实现Webhook通知
    logger.info(`Webhook通知: ${alert.message}`);
  }
  
  acknowledgeAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date();
      logger.info(`预警已确认: ${alertId}`);
      return true;
    }
    return false;
  }
  
  getActiveAlerts() {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.acknowledged)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
  
  getAllAlerts() {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }
}

module.exports = RiskAlert;