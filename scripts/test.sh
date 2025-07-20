#!/bin/bash

# 多市场量化交易系统测试脚本
# 此脚本用于运行系统测试以验证各模块功能

echo "开始测试多市场量化交易系统..."

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "错误：Node.js未安装，请先安装Node.js v16+..."
    exit 1
fi

# 测试配置模块
echo "1. 测试配置模块..."
node -e "try { require('./src/config'); console.log('✓ 配置模块测试通过'); } catch(e) { console.error('✗ 配置模块测试失败:', e.message); process.exit(1); }"

# 测试数据模块
echo "2. 测试数据模块..."
node -e "try { require('./src/data'); console.log('✓ 数据模块测试通过'); } catch(e) { console.error('✗ 数据模块测试失败:', e.message); process.exit(1); }"

# 测试策略模块
echo "3. 测试策略模块..."
node -e "try { require('./src/strategies'); console.log('✓ 策略模块测试通过'); } catch(e) { console.error('✗ 策略模块测试失败:', e.message); process.exit(1); }"

# 测试回测模块
echo "4. 测试回测模块..."
node -e "try { require('./src/backtest'); console.log('✓ 回测模块测试通过'); } catch(e) { console.error('✗ 回测模块测试失败:', e.message); process.exit(1); }"

# 测试交易模块
echo "5. 测试交易模块..."
node -e "try { require('./src/trading'); console.log('✓ 交易模块测试通过'); } catch(e) { console.error('✗ 交易模块测试失败:', e.message); process.exit(1); }"

# 测试风险模块
echo "6. 测试风险模块..."
node -e "try { require('./src/risk'); console.log('✓ 风险模块测试通过'); } catch(e) { console.error('✗ 风险模块测试失败:', e.message); process.exit(1); }"

# 测试报告模块
echo "7. 测试报告模块..."
node -e "try { require('./src/reports'); console.log('✓ 报告模块测试通过'); } catch(e) { console.error('✗ 报告模块测试失败:', e.message); process.exit(1); }"

# 测试Web模块
echo "8. 测试Web模块..."
node -e "try { require('./src/web/server'); console.log('✓ Web模块测试通过'); } catch(e) { console.error('✗ Web模块测试失败:', e.message); process.exit(1); }"

# 运行单元测试
if [ -d "test" ]; then
    echo "9. 运行单元测试..."
    npm test
fi

echo "测试完成！"
