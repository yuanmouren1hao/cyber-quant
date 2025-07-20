#!/bin/bash

# 多市场量化交易系统安装脚本
# 此脚本用于初始化系统环境并安装所需依赖

echo "开始安装多市场量化交易系统..."

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "Node.js未安装，请先安装Node.js v16+..."
    exit 1
fi

# 检查npm环境
if ! command -v npm &> /dev/null; then
    echo "npm未安装，请先安装npm..."
    exit 1
fi

# 显示Node.js和npm版本
node_version=$(node -v)
npm_version=$(npm -v)
echo "Node.js版本: $node_version"
echo "npm版本: $npm_version"

# 安装依赖
echo "正在安装依赖..."
npm install

# 创建日志目录
if [ ! -d "logs" ]; then
    mkdir logs
    echo "创建日志目录: logs/"
fi

# 创建数据目录
if [ ! -d "data" ]; then
    mkdir data
    echo "创建数据目录: data/"
fi

# 检查配置文件
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "已创建默认配置文件，请修改.env文件配置系统参数"
else
    echo "配置文件已存在，如需重置请手动复制.env.example为.env"
fi

echo "安装完成！请修改.env文件设置您的API密钥和其他配置项。"
echo "使用 npm start 启动系统，或使用 ./scripts/start.sh 脚本启动系统。"
