#!/bin/bash

# 启动后端服务脚本
# 用法: ./start_backend.sh

echo "🚀 启动后端服务..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 后端端口
BACKEND_PORT=8000

# 检查端口是否被占用
echo -e "${BLUE}🔍 检查端口 $BACKEND_PORT 是否被占用...${NC}"
if lsof -ti:$BACKEND_PORT >/dev/null 2>&1; then
    echo -e "${RED}❌ 端口 $BACKEND_PORT 已被占用${NC}"
    echo -e "${YELLOW}📋 当前占用端口的进程:${NC}"
    lsof -i:$BACKEND_PORT
    echo -e "${YELLOW}💡 请先运行 ./stop_backend.sh 停止现有服务${NC}"
    exit 1
else
    echo -e "${GREEN}✅ 端口 $BACKEND_PORT 可用${NC}"
fi

# 检查虚拟环境
echo -e "${BLUE}🔌 检查虚拟环境...${NC}"
if [ ! -d ".venv" ]; then
    echo -e "${RED}❌ 虚拟环境不存在${NC}"
    echo -e "${YELLOW}💡 请先运行以下命令创建虚拟环境:${NC}"
    echo -e "   ${BLUE}python -m venv .venv${NC}"
    echo -e "   ${BLUE}source .venv/bin/activate${NC}"
    echo -e "   ${BLUE}pip install -r backend/requirements.txt${NC}"
    exit 1
fi

# 激活虚拟环境
echo -e "${BLUE}🔌 激活虚拟环境...${NC}"
source .venv/bin/activate

# 检查依赖
echo -e "${BLUE}📦 检查关键依赖...${NC}"
python -c "import fastapi, uvicorn, autogen_agentchat" 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 缺少关键依赖${NC}"
    echo -e "${YELLOW}💡 请安装依赖: pip install -r backend/requirements.txt${NC}"
    exit 1
else
    echo -e "${GREEN}✅ 依赖检查通过${NC}"
fi

# 检查后端目录
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ 后端目录不存在${NC}"
    exit 1
fi

# 进入后端目录
cd backend

# 清理旧的日志文件
if [ -f "../backend.log" ]; then
    echo -e "${BLUE}🧹 清理旧的日志文件...${NC}"
    > ../backend.log
fi

# 启动后端服务
echo -e "${BLUE}🚀 启动后端服务（后台运行）...${NC}"

# 使用 nohup 在后台运行
nohup python -m uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT --reload > ../backend.log 2>&1 &
BACKEND_PID=$!

# 等待服务启动
echo -e "${BLUE}⏳ 等待后端服务启动...${NC}"
sleep 3

# 检查进程是否还在运行
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${GREEN}✅ 后端服务已启动 (PID: $BACKEND_PID)${NC}"
    
    # 等待服务完全启动
    echo -e "${BLUE}🔄 等待服务完全启动...${NC}"
    for i in {1..10}; do
        if curl -s http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
            echo -e "${GREEN}✅ 后端服务启动成功${NC}"
            break
        fi
        echo -e "${YELLOW}⏳ 等待中... ($i/10)${NC}"
        sleep 2
    done
    
    # 最终检查
    if curl -s http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
        echo -e "${GREEN}🎉 后端服务完全就绪！${NC}"
    else
        echo -e "${YELLOW}⚠️  服务可能仍在启动中，请稍后检查${NC}"
    fi
    
else
    echo -e "${RED}❌ 后端服务启动失败${NC}"
    echo -e "${YELLOW}📋 查看日志:${NC}"
    tail -20 ../backend.log
    exit 1
fi

# 返回根目录
cd ..

# 显示状态摘要
echo -e "\n${BLUE}📊 服务状态:${NC}"
echo -e "   后端服务: ${GREEN}运行中${NC} (PID: $BACKEND_PID)"
echo -e "   后端端口: ${GREEN}$BACKEND_PORT${NC}"
echo -e "   健康检查: ${GREEN}http://localhost:$BACKEND_PORT/health${NC}"
echo -e "   API文档: ${GREEN}http://localhost:$BACKEND_PORT/docs${NC}"

echo -e "\n${BLUE}📋 常用命令:${NC}"
echo -e "   查看后端日志: ${BLUE}tail -f backend.log${NC}"
echo -e "   停止后端服务: ${BLUE}./stop_backend.sh${NC}"
echo -e "   重启后端服务: ${BLUE}./stop_backend.sh && ./start_backend.sh${NC}"

echo -e "\n${BLUE}🔗 访问地址:${NC}"
echo -e "   后端API: ${GREEN}http://localhost:$BACKEND_PORT${NC}"
echo -e "   API文档: ${GREEN}http://localhost:$BACKEND_PORT/docs${NC}"
echo -e "   健康检查: ${GREEN}http://localhost:$BACKEND_PORT/health${NC}"

echo -e "\n${GREEN}🎉 后端服务启动完成！${NC}"
