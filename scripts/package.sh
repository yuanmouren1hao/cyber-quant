#!/bin/bash

# 多市场量化交易系统打包脚本
# 此脚本用于生成完整系统的压缩包

# 当前时间作为压缩包名称后缀
timestamp=$(date +"%Y%m%d_%H%M%S")
package_name="multi_market_quant_trading_system_${timestamp}.zip"

# 确保清理临时文件
cleanup() {
    if [ -d "./temp_package" ]; then
        rm -rf ./temp_package
    fi
}

# 检查zip命令是否存在
if ! command -v zip &> /dev/null; then
    echo "错误：zip命令不存在，请安装zip工具"
    exit 1
fi

# 初始清理
cleanup

# 创建临时目录进行打包
mkdir -p temp_package

# 复制需要打包的文件
echo "正在准备文件进行打包..."
cp -r ./src ./temp_package/
cp -r ./scripts ./temp_package/
cp -r ./config ./temp_package/ 2>/dev/null || mkdir -p ./temp_package/config
cp -r ./docs ./temp_package/ 2>/dev/null || mkdir -p ./temp_package/docs
cp .env.example ./temp_package/
cp package.json ./temp_package/
cp README.md ./temp_package/ 2>/dev/null || touch ./temp_package/README.md

# 创建数据和日志目录
mkdir -p ./temp_package/data
mkdir -p ./temp_package/logs

# 压缩文件
echo "正在打包..."
cd temp_package
zip -r "../$package_name" *
cd ..

# 清理临时文件
cleanup

echo "打包完成！压缩包已生成：$package_name"
