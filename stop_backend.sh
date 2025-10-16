#!/bin/bash

# 停止后端服务脚本
# 用法: ./stop_backend.sh

echo "🛑 停止后端服务..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 后端端口
BACKEND_PORT=8000

# 查找并停止后端进程
echo -e "${BLUE}🔍 查找后端进程...${NC}"

# 方法1: 通过端口查找进程
BACKEND_PID=$(lsof -ti:$BACKEND_PORT 2>/dev/null)

if [ ! -z "$BACKEND_PID" ]; then
    echo -e "${YELLOW}📍 发现后端进程 (PID: $BACKEND_PID) 占用端口 $BACKEND_PORT${NC}"
    
    # 尝试优雅停止
    echo -e "${BLUE}🔄 尝试优雅停止后端进程...${NC}"
    kill -TERM $BACKEND_PID 2>/dev/null
    
    # 等待进程停止
    sleep 3
    
    # 检查进程是否还在运行
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${YELLOW}⚠️  进程仍在运行，强制停止...${NC}"
        kill -KILL $BACKEND_PID 2>/dev/null
        sleep 1
    fi
    
    # 再次检查
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ 无法停止进程 $BACKEND_PID${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ 后端进程已停止 (PID: $BACKEND_PID)${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️  未发现占用端口 $BACKEND_PORT 的进程${NC}"
fi

# 方法2: 通过进程名查找
echo -e "${BLUE}🔍 查找 uvicorn 进程...${NC}"
UVICORN_PIDS=$(pgrep -f "uvicorn.*main:app" 2>/dev/null)

if [ ! -z "$UVICORN_PIDS" ]; then
    echo -e "${YELLOW}📍 发现 uvicorn 进程: $UVICORN_PIDS${NC}"
    
    for PID in $UVICORN_PIDS; do
        echo -e "${BLUE}🔄 停止 uvicorn 进程 (PID: $PID)...${NC}"
        kill -TERM $PID 2>/dev/null
        sleep 2
        
        # 检查是否还在运行
        if kill -0 $PID 2>/dev/null; then
            echo -e "${YELLOW}⚠️  强制停止进程 $PID...${NC}"
            kill -KILL $PID 2>/dev/null
        fi
        
        if kill -0 $PID 2>/dev/null; then
            echo -e "${RED}❌ 无法停止进程 $PID${NC}"
        else
            echo -e "${GREEN}✅ uvicorn 进程已停止 (PID: $PID)${NC}"
        fi
    done
else
    echo -e "${YELLOW}ℹ️  未发现 uvicorn 进程${NC}"
fi

# 方法3: 查找 Python 后端进程
echo -e "${BLUE}🔍 查找 Python 后端进程...${NC}"
PYTHON_PIDS=$(pgrep -f "python.*backend" 2>/dev/null)

if [ ! -z "$PYTHON_PIDS" ]; then
    echo -e "${YELLOW}📍 发现 Python 后端进程: $PYTHON_PIDS${NC}"
    
    for PID in $PYTHON_PIDS; do
        echo -e "${BLUE}🔄 停止 Python 进程 (PID: $PID)...${NC}"
        kill -TERM $PID 2>/dev/null
        sleep 2
        
        # 检查是否还在运行
        if kill -0 $PID 2>/dev/null; then
            echo -e "${YELLOW}⚠️  强制停止进程 $PID...${NC}"
            kill -KILL $PID 2>/dev/null
        fi
        
        if kill -0 $PID 2>/dev/null; then
            echo -e "${RED}❌ 无法停止进程 $PID${NC}"
        else
            echo -e "${GREEN}✅ Python 进程已停止 (PID: $PID)${NC}"
        fi
    done
else
    echo -e "${YELLOW}ℹ️  未发现 Python 后端进程${NC}"
fi

# 清理后端日志文件（可选）
if [ -f "backend.log" ]; then
    echo -e "${BLUE}🧹 清理后端日志文件...${NC}"
    > backend.log
    echo -e "${GREEN}✅ 后端日志文件已清理${NC}"
fi

# 最终检查端口状态
echo -e "${BLUE}🔍 最终检查端口 $BACKEND_PORT 状态...${NC}"
if lsof -ti:$BACKEND_PORT >/dev/null 2>&1; then
    echo -e "${RED}❌ 端口 $BACKEND_PORT 仍被占用${NC}"
    echo -e "${YELLOW}📋 当前占用端口的进程:${NC}"
    lsof -i:$BACKEND_PORT
    exit 1
else
    echo -e "${GREEN}✅ 端口 $BACKEND_PORT 已释放${NC}"
fi

echo -e "${GREEN}🎉 后端服务停止完成！${NC}"

# 显示状态摘要
echo -e "\n${BLUE}📊 状态摘要:${NC}"
echo -e "   后端端口 $BACKEND_PORT: ${GREEN}已释放${NC}"
echo -e "   后端日志: ${GREEN}已清理${NC}"
echo -e "\n${YELLOW}💡 提示:${NC}"
echo -e "   - 如需启动后端服务，请运行: ${BLUE}./start_backend.sh${NC}"
echo -e "   - 如需启动完整服务，请运行: ${BLUE}./start.sh${NC}"
