#!/bin/bash

echo "🛑 停止 API 智能测试平台..."

# 停止后端服务
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        echo "🐍 停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        echo "✅ 后端服务已停止"
    else
        echo "⚠️  后端服务进程不存在"
    fi
    rm backend.pid
else
    echo "⚠️  未找到后端服务PID文件"
fi

# 停止前端服务
if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null; then
        echo "🌐 停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        echo "✅ 前端服务已停止"
    else
        echo "⚠️  前端服务进程不存在"
    fi
    rm frontend.pid
else
    echo "⚠️  未找到前端服务PID文件"
fi

# 强制杀死可能残留的进程
echo "🧹 清理残留进程..."
pkill -f "python main.py" 2>/dev/null || true
pkill -f "uvicorn main:app" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

# 检查并强制释放端口
echo "🔍 检查端口占用..."
BACKEND_PIDS=$(lsof -ti:8000 2>/dev/null)
if [ ! -z "$BACKEND_PIDS" ]; then
    echo "强制关闭端口 8000 上的进程: $BACKEND_PIDS"
    for pid in $BACKEND_PIDS; do
        kill -9 $pid 2>/dev/null
    done
fi

FRONTEND_PIDS=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$FRONTEND_PIDS" ]; then
    echo "强制关闭端口 3000 上的进程: $FRONTEND_PIDS"
    for pid in $FRONTEND_PIDS; do
        kill -9 $pid 2>/dev/null
    done
fi

# 清理日志文件（可选）
if [ -f backend.log ]; then
    echo "🧹 清理后端日志文件..."
    rm backend.log
fi

echo "✅ 平台服务已完全停止"
