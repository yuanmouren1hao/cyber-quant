#!/bin/bash

# 多市场量化交易系统重启脚本
# 此脚本用于重启系统

echo "正在重启多市场量化交易系统..."

# 停止当前运行的实例
if [ -f "./.pid" ]; then
    echo "正在停止当前运行的实例..."
    ./scripts/stop.sh
    sleep 2
else
    echo "未检测到正在运行的实例"
fi

# 启动新实例
echo "正在启动新实例..."
./scripts/start.sh

echo "重启完成"
