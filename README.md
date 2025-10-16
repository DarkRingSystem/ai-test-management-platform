# 🤖 AI测试管理平台

一个基于AI的智能测试管理平台，集成多智能体协作、自动化测试用例生成、UI分析等功能。

## ✨ 主要特性

### 🧠 AI智能助手
- **多智能体协作**：基于AutoGen框架的测试用例生成团队
- **智能对话**：支持流式对话的AI助手
- **测试用例生成**：自动生成高质量测试用例
- **代码分析**：智能分析测试代码和业务逻辑

### 🎯 核心功能
- **用户管理**：完整的用户权限管理系统
- **项目管理**：测试项目的全生命周期管理
- **测试用例管理**：测试用例的创建、编辑、执行
- **UI自动化**：基于图像识别的UI测试
- **接口自动化**：RESTful API自动化测试
- **缺陷管理**：缺陷跟踪和分析
- **性能测试**：性能测试执行和报告

### 🚀 技术特色
- **实时流式响应**：支持SSE的实时AI对话
- **智能滚动跟随**：用户友好的消息显示
- **停止/恢复功能**：可控制的AI对话流程
- **文件上传支持**：支持多种格式文件分析
- **响应式设计**：现代化的用户界面

## 🏗️ 技术架构

### 后端技术栈
- **FastAPI**: 现代化的Python Web框架
- **SQLAlchemy**: ORM数据库操作
- **PostgreSQL**: 主数据库
- **Redis**: 缓存和会话存储
- **AutoGen**: 多智能体协作框架
- **DeepSeek**: 大语言模型
- **Celery**: 异步任务队列

### 前端技术栈
- **React 18**: 现代化前端框架
- **TypeScript**: 类型安全的JavaScript
- **Ant Design**: 企业级UI组件库
- **React Router**: 前端路由管理
- **Axios**: HTTP客户端

### AI集成
- **AutoGen AgentChat**: 多智能体对话框架
- **DeepSeek Chat**: 主要对话模型
- **Qwen-VL**: 视觉理解模型
- **UI-TARS**: UI自动化模型

## 📦 项目结构

```
AItestforAPI/
├── backend/                 # 后端代码
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── core/           # 核心配置
│   │   ├── models/         # 数据模型
│   │   ├── services/       # 业务逻辑
│   │   ├── agents/         # AI智能体
│   │   └── utils/          # 工具函数
│   ├── alembic/            # 数据库迁移
│   ├── requirements.txt    # Python依赖
│   └── main.py            # 应用入口
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API服务
│   │   ├── types/         # TypeScript类型
│   │   └── utils/         # 工具函数
│   ├── public/            # 静态资源
│   └── package.json       # Node.js依赖
├── docs/                  # 项目文档
├── .gitignore            # Git忽略文件
└── README.md             # 项目说明
```

## 🚀 快速开始

### 环境要求
- Python 3.11+
- Node.js 16+
- PostgreSQL 13+
- Redis 6+

### 后端启动

1. **创建虚拟环境**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# 或
.venv\Scripts\activate     # Windows
```

2. **安装依赖**
```bash
pip install -r requirements.txt
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库和API密钥
```

4. **数据库迁移**
```bash
alembic upgrade head
```

5. **启动服务**
```bash
python main.py
```

### 前端启动

1. **安装依赖**
```bash
cd frontend
npm install
```

2. **启动开发服务器**
```bash
npm start
```

3. **访问应用**
```
http://localhost:3000
```

## 🔧 配置说明

### 环境变量配置

在 `backend/.env` 文件中配置以下变量：

```env
# 数据库配置
DATABASE_URL=postgresql://username:password@localhost/dbname

# Redis配置
REDIS_URL=redis://localhost:6379/0

# AI模型配置
API_KEY=your_deepseek_api_key
VISION_API_KEY=your_qwen_api_key
UITARS_API_KEY=your_uitars_api_key

# JWT配置
SECRET_KEY=your_secret_key
```

## 📚 API文档

启动后端服务后，访问以下地址查看API文档：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [AutoGen](https://github.com/microsoft/autogen) - 多智能体框架
- [FastAPI](https://fastapi.tiangolo.com/) - 现代化Web框架
- [React](https://reactjs.org/) - 前端框架
- [Ant Design](https://ant.design/) - UI组件库

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件到：your-email@example.com

---

⭐ 如果这个项目对你有帮助，请给它一个星标！
