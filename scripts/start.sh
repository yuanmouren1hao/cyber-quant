#!/bin/bash

# 多市场量化交易系统启动脚本
# 此脚本用于启动系统并记录输出到日志文件

# 确保日志目录存在
if [ ! -d "logs" ]; then
    mkdir logs
fi

# 获取当前时间作为日志文件名
timestamp=$(date +"%Y%m%d_%H%M%S")
log_file="logs/system_${timestamp}.log"

# 检查是否已经有实例在运行
pid_file="./.pid"
if [ -f "$pid_file" ]; then
    pid=$(cat $pid_file)
    if ps -p $pid > /dev/null; then
        echo "错误：系统已经在运行，PID: $pid"
        echo "如需重启，请先运行 ./scripts/stop.sh 停止当前实例"
        exit 1
    else
        echo "发现过期的PID文件，将删除..."
        rm $pid_file
    fi
fi

echo "启动多市场量化交易系统..."
echo "日志将写入: $log_file"

# 启动系统并将输出重定向到日志文件
NODE_ENV=production node src/index.js > "$log_file" 2>&1 &

# 保存PID
echo $! > $pid_file
echo "系统已启动，PID: $!"
echo "使用 ./scripts/stop.sh 停止系统"
echo "使用 tail -f $log_file 查看日志"
