#!/bin/bash

# 多市场量化交易系统停止脚本
# 此脚本用于安全停止系统运行

pid_file="./.pid"

# 检查PID文件是否存在
if [ ! -f "$pid_file" ]; then
    echo "错误：未找到PID文件，系统可能未运行"
    exit 1
fi

# 读取PID
pid=$(cat $pid_file)

# 检查进程是否存在
if ! ps -p $pid > /dev/null; then
    echo "警告：PID $pid 的进程不存在，可能系统已经停止"
    rm $pid_file
    exit 0
fi

echo "正在停止多市场量化交易系统 (PID: $pid)..."

# 发送SIGTERM信号
kill $pid

# 等待进程结束
for i in {1..30}; do
    if ! ps -p $pid > /dev/null; then
        echo "系统已成功停止"
        rm $pid_file
        exit 0
    fi
    sleep 1
done

# 如果进程仍未结束，发送SIGKILL信号
echo "系统未能在30秒内正常停止，强制终止..."
kill -9 $pid

if ! ps -p $pid > /dev/null; then
    echo "系统已被强制停止"
    rm $pid_file
    exit 0
else
    echo "错误：无法停止系统，请手动终止进程 $pid"
    exit 1
fi
