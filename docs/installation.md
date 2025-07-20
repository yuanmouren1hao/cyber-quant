# 多市场量化交易系统安装与部署指南

本文档提供了多市场量化交易系统的详细安装和部署步骤，包括环境准备、系统配置、启动方法和常见问题解决方案。

## 1. 系统要求

### 硬件要求
- CPU: 双核及以上
- 内存: 4GB及以上
- 硬盘: 20GB可用空间
- 网络: 稳定的互联网连接

### 软件要求
- 操作系统: Linux(推荐Ubuntu 20.04+)、macOS或Windows
- Node.js: v16.0.0+
- npm: v7.0.0+
- Git(可选): 最新版本

## 2. 安装步骤

### 2.1 安装Node.js和npm

#### Linux(Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### macOS
```bash
brew install node@16
```

#### Windows
从[Node.js官网](https://nodejs.org/)下载并安装Node.js 16.x版本。

### 2.2 获取系统源代码

#### 方法1: 解压系统压缩包
```bash
unzip multi_market_quant_trading_system.zip -d quant_trading
cd quant_trading
```

#### 方法2: 使用Git克隆(如果有Git仓库)
```bash
git clone <repository_url> quant_trading
cd quant_trading
```

### 2.3 安装系统依赖

运行安装脚本:
```bash
chmod +x ./scripts/install.sh
./scripts/install.sh
```

或手动安装依赖:
```bash
npm install
```

### 2.4 配置系统

复制环境配置文件模板:
```bash
cp .env.example .env
```

使用文本编辑器编辑.env文件，配置以下必要参数:
- API密钥和密码
- 数据库连接信息
- 风险控制参数
- 通知设置

## 3. 系统部署

### 3.1 开发环境运行

```bash
npm run dev
```

### 3.2 生产环境部署

#### 启动系统
```bash
./scripts/start.sh
```
或
```bash
npm start
```

#### 查看日志
```bash
tail -f logs/system_*.log
```

#### 停止系统
```bash
./scripts/stop.sh
```

#### 重启系统
```bash
./scripts/restart.sh
```

### 3.3 使用PM2进行进程管理(推荐)

安装PM2:
```bash
npm install -g pm2
```

创建PM2配置文件`ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: "quant-trading",
    script: "./src/index.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production"
    }
  }]
};
```

使用PM2启动:
```bash
pm2 start ecosystem.config.js
```

## 4. 系统验证

### 4.1 验证Web界面

打开浏览器访问: `http://<服务器IP>:3000`

### 4.2 运行回测验证

```bash
npm run backtest
```

### 4.3 运行单元测试

```bash
npm test
```

## 5. 故障排除

### 5.1 常见问题

#### 无法启动系统
- 检查Node.js版本是否符合要求
- 确认所有依赖已正确安装
- 检查.env配置文件是否正确
- 检查日志文件中的错误信息

#### API连接失败
- 验证API密钥和密码是否正确
- 检查网络连接是否稳定
- 确认交易所API服务是否可用

#### 数据库错误
- 确保数据目录有写入权限
- 检查数据库连接配置
- 尝试重新初始化数据库

### 5.2 日志位置

- 系统日志: `logs/system_*.log`
- 错误日志: `logs/error_*.log`
- Web服务日志: `logs/web_*.log`

### 5.3 获取支持

如遇到无法解决的问题，请提供以下信息寻求技术支持:
- 系统版本
- 完整的错误日志
- 操作系统版本
- Node.js和npm版本

## 6. 系统更新

### 6.1 备份当前系统

```bash
./scripts/package.sh
```

### 6.2 更新系统

```bash
git pull  # 如果使用Git
# 或解压新版本覆盖
npm install  # 安装新依赖
./scripts/restart.sh  # 重启系统
```

## 7. 安全建议

- 定期更新系统和依赖包
- 不要将API密钥提交到版本控制系统
- 使用防火墙限制对系统的访问
- 定期备份系统数据
- 在生产环境中使用HTTPS
