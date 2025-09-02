#!/bin/bash

echo "🚀 启动违约客户管理系统..."
echo "📦 检查依赖..."

# 检查node_modules是否存在
if [ ! -d "node_modules" ]; then
    echo "📥 安装依赖..."
    npm install
fi

echo "🔧 启动开发服务器..."
npm run dev
