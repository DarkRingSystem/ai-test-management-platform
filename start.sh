#!/bin/bash

echo "🚀 快速启动 API 智能测试平台..."

# 函数：检查并关闭端口占用进程
check_and_kill_port() {
    local port=$1
    local service_name=$2

    echo "🔍 检查端口 $port 是否被占用..."
    local pids=$(lsof -ti:$port 2>/dev/null)

    if [ ! -z "$pids" ]; then
        echo "⚠️  端口 $port 被占用，正在关闭相关进程..."
        echo "占用进程 PID: $pids"

        # 尝试优雅关闭
        for pid in $pids; do
            echo "正在关闭进程 $pid..."
            kill $pid 2>/dev/null
        done

        # 等待进程关闭
        sleep 2

        # 检查是否还有进程占用端口
        local remaining_pids=$(lsof -ti:$port 2>/dev/null)
        if [ ! -z "$remaining_pids" ]; then
            echo "强制关闭剩余进程..."
            for pid in $remaining_pids; do
                kill -9 $pid 2>/dev/null
            done
        fi

        echo "✅ 端口 $port 已释放"
    else
        echo "✅ 端口 $port 可用"
    fi
}

# 检查虚拟环境
if [ ! -d ".venv" ]; then
    echo "❌ 虚拟环境不存在，请先创建 .venv 虚拟环境"
    echo "💡 提示：运行 python -m venv .venv 创建虚拟环境"
    exit 1
fi

# 激活虚拟环境
echo "🔌 激活虚拟环境..."
source .venv/bin/activate

# 检查并释放端口
check_and_kill_port 8000 "后端服务"
check_and_kill_port 3000 "前端服务"

# 检查后端环境配置文件
if [ ! -f "backend/.env" ]; then
    echo "📝 创建后端环境配置文件..."
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo "✅ 环境配置文件已创建"
    else
        echo "⚠️  未找到 .env.example 文件，请手动创建 backend/.env"
    fi
fi

# 启动后端服务（后台运行）
echo "🚀 启动后端服务（后台运行）..."
cd backend
nohup python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid
cd ..
echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 3

# 检查后端是否启动成功
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败，请检查日志：tail -f backend.log"
fi

# 启动前端服务
echo "🚀 启动前端服务..."
cd frontend

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

# 启动前端开发服务器
echo "🌐 启动前端开发服务器..."
npm start &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid
cd ..

echo ""
echo "🎉 启动完成！"
echo ""
echo "📊 访问地址："
echo "   前端页面: http://localhost:3000"
echo "   后端API: http://localhost:8000"
echo "   API文档: http://localhost:8000/docs"
echo ""
echo "📝 进程信息："
echo "   后端PID: $BACKEND_PID"
echo "   前端PID: $FRONTEND_PID"
echo ""
echo "📋 常用命令："
echo "   查看后端日志: tail -f backend.log"
echo "   停止服务: ./stop.sh"
echo ""
echo "🔑 默认账户："
echo "   管理员: admin / admin123"
echo "   项目经理: project_manager / pm123456"
echo "   测试工程师: tester / test123456"
echo ""
echo "💡 提示：前端服务启动需要一些时间，请稍等片刻后访问 http://localhost:3000"
