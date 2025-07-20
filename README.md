# 多市场量化交易系统

基于Node.js的多市场量化交易系统，支持数据获取、策略回测、模拟交易、实盘执行、风险监控和可视化报告。

## 功能特点

- **多市场支持**：支持OKEx等多个交易所，可进行定制扩展
- **策略回测**：完整的回测引擎，支持历史数据回测和策略评估
- **模拟交易**：支持实时行情的模拟交易，无需真实资金
- **实盘交易**：自动执行实盘交易，支持限价单和市价单
- **风险监控**：实时监控交易风险，包括最大回撤、最大仓位、止损等
- **可视化报告**：生成策略表现报告，包含盈亏曲线、交易指标等
- **用户界面**：响应式的Web界面，支持系统状态监控和参数调整

## 系统架构

系统由以下模块组成：

- **核心模块**：系统控制器和市场管理
- **数据模块**：各交易所数据获取和处理
- **回测模块**：回测引擎和数据分析
- **策略模块**：策略开发和管理
- **交易模块**：模拟和实盘交易执行
- **风险模块**：风险监控和预警
- **报告模块**：策略报告生成
- **Web模块**：用户界面和接口

## 安装说明

安装要求：
- Node.js v16.0.0+
- npm v7.0.0+

安装步骤：

1. 克隆或解压系统源代码

```bash
# 解压系统源代码
unzip multi_market_quant_trading_system.zip -d quant_trading
cd quant_trading
```

2. 运行安装脚本或手动安装依赖

```bash
# 使用安装脚本
chmod +x ./scripts/install.sh
./scripts/install.sh

# 或手动安装
npm install
```

3. 配置系统

```bash
# 复制并编辑环境配置文件
cp .env.example .env
nano .env  # 或使用其他文本编辑器
```

请在`.env`文件中填写您的API密钥、交易参数和其他配置信息。

## 使用说明

### 启动系统

```bash
# 使用脚本启动
./scripts/start.sh

# 或使用npm命令
npm start
```

### 运行回测

```bash
npm run backtest
```

### 启动Web界面

```bash
npm run web
```
然后在浏览器中访问 http://localhost:3000

### 停止系统

```bash
./scripts/stop.sh
```

### 重启系统

```bash
./scripts/restart.sh
```

## 目录结构

```
.
├── .env.example      # 环境变量示例文件
├── config/          # 配置文件目录
├── data/            # 数据存储目录
├── docs/            # 文档目录
├── logs/            # 日志目录
├── package.json     # 项目依赖配置
├── scripts/         # 脚本目录
│   ├── install.sh    # 安装脚本
│   ├── start.sh      # 启动脚本
│   ├── stop.sh       # 停止脚本
│   ├── restart.sh    # 重启脚本
│   └── package.sh    # 打包脚本
└── src/             # 源代码目录
    ├── backtest/      # 回测模块
    ├── config/        # 配置模块
    ├── core/          # 核心模块
    ├── data/          # 数据模块
    ├── reports/       # 报告模块
    ├── risk/          # 风险模块
    ├── strategies/    # 策略模块
    ├── trading/       # 交易模块
    ├── utils/         # 工具模块
    ├── web/           # Web界面模块
    └── index.js       # 程序入口文件
```

## 自定义开发

### 添加新策略

1. 在`src/strategies`目录下创建新策略文件，继承自`base.js`
2. 实现`init()`、`update()`和`execute()`方法
3. 在`src/strategies/index.js`中注册新策略

### 添加新交易所

1. 在`src/data/providers`目录下创建新的数据提供者
2. 实现必要的API接口和WebSocket连接
3. 在`src/data/index.js`中注册新的数据提供者

## 打包发布

使用打包脚本创建完整系统的压缩包：

```bash
./scripts/package.sh
```

或使用npm命令：

```bash
npm run package
```

生成的压缩包将位于项目根目录，文件名格式为`multi_market_quant_trading_system_YYYYMMDD_HHMMSS.zip`。

## 授权许可

MIT许可证

## 免责声明

本系统仅供学习和研究使用，交易涉及风险，请谨慎使用。作者不对使用本系统进行交易可能造成的损失负责。
