/**
 * 系统配置模块
 * 负责管理系统的所有配置信息
 */

require('dotenv').config();

/**
 * 默认配置
 */
const defaultConfig = {
  system: {
    name: '多市场量化交易系统',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info'
  },
  
  // OKEx配置
  okex: {
    apiKey: process.env.OKEX_API_KEY || '',
    secretKey: process.env.OKEX_SECRET_KEY || '',
    passphrase: process.env.OKEX_PASSPHRASE || '',
    sandbox: process.env.OKEX_SANDBOX === 'true',
    baseUrl: process.env.OKEX_SANDBOX === 'true' 
      ? 'https://www.okx.com' 
      : 'https://www.okx.com'
  },
  
  // 数据库配置
  database: {
    type: process.env.DB_TYPE || 'sqlite',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'trading_system',
    filename: process.env.DB_FILENAME || './data/trading.db'
  },
  
  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0
  },
  
  // Web服务配置
  web: {
    port: parseInt(process.env.WEB_PORT) || 3000,
    host: process.env.WEB_HOST || '0.0.0.0',
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    }
  },
  
  // 交易配置
  trading: {
    defaultRiskLevel: parseFloat(process.env.DEFAULT_RISK_LEVEL) || 0.02,
    maxPositions: parseInt(process.env.MAX_POSITIONS) || 10,
    defaultStopLoss: parseFloat(process.env.DEFAULT_STOP_LOSS) || 0.05,
    defaultTakeProfit: parseFloat(process.env.DEFAULT_TAKE_PROFIT) || 0.10
  },
  
  // 数据配置
  data: {
    updateInterval: parseInt(process.env.DATA_UPDATE_INTERVAL) || 1000,
    historyDays: parseInt(process.env.HISTORY_DAYS) || 30,
    cacheTimeout: parseInt(process.env.CACHE_TIMEOUT) || 300
  }
};

/**
 * 获取配置
 * @returns {Object} 配置对象
 */
function getConfig() {
  return defaultConfig;
}

/**
 * 验证配置
 * @returns {boolean} 配置是否有效
 */
function validateConfig() {
  const config = getConfig();
  let isValid = true;
  
  // 验证OKEx配置
  if (!config.okex.apiKey || !config.okex.secretKey || !config.okex.passphrase) {
    console.warn('OKEx API配置不完整，相关功能将无法使用');
    isValid = false;
  }
  
  return isValid;
}

module.exports = {
  getConfig,
  validateConfig,
  defaultConfig
};
