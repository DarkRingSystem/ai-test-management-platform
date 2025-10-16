#!/bin/bash

# 重启后端服务脚本
# 用法: ./restart_backend.sh

echo "🔄 重启后端服务..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查脚本是否存在
if [ ! -f "stop_backend.sh" ] || [ ! -f "start_backend.sh" ]; then
    echo -e "${RED}❌ 缺少必要的脚本文件${NC}"
    echo -e "${YELLOW}💡 请确保以下文件存在:${NC}"
    echo -e "   - stop_backend.sh"
    echo -e "   - start_backend.sh"
    exit 1
fi

# 停止后端服务
echo -e "${BLUE}🛑 第一步: 停止现有后端服务...${NC}"
./stop_backend.sh

# 检查停止是否成功
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 停止后端服务失败${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 后端服务已停止${NC}"

# 等待一下确保端口完全释放
echo -e "${BLUE}⏳ 等待端口完全释放...${NC}"
sleep 2

# 启动后端服务
echo -e "${BLUE}🚀 第二步: 启动后端服务...${NC}"
./start_backend.sh

# 检查启动是否成功
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 启动后端服务失败${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 后端服务重启完成！${NC}"

# 显示最终状态
echo -e "\n${BLUE}📊 重启摘要:${NC}"
echo -e "   操作: ${GREEN}重启成功${NC}"
echo -e "   后端端口: ${GREEN}8000${NC}"
echo -e "   状态: ${GREEN}运行中${NC}"

echo -e "\n${BLUE}🔗 快速访问:${NC}"
echo -e "   健康检查: ${GREEN}http://localhost:8000/health${NC}"
echo -e "   API文档: ${GREEN}http://localhost:8000/docs${NC}"
echo -e "   WebSocket测试: ${GREEN}http://localhost:3000/ai-testcase-generate-ws${NC}"

echo -e "\n${BLUE}📋 常用命令:${NC}"
echo -e "   查看日志: ${BLUE}tail -f backend.log${NC}"
echo -e "   停止服务: ${BLUE}./stop_backend.sh${NC}"
echo -e "   再次重启: ${BLUE}./restart_backend.sh${NC}"
