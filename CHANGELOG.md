# 📝 更新日志

本文档记录了AI测试管理平台的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本控制](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2025-01-16

### ✨ 新增功能
- **多智能体协作**: 基于AutoGen框架的测试用例生成团队
  - 测试用例生成器 (test_case_generator)
  - 测试用例审查员 (test_case_reviewer) 
  - 测试用例优化器 (test_case_optimizer)
- **实时流式AI对话**: 支持SSE的实时对话体验
- **智能停止/恢复功能**: 用户可控制的AI对话流程
- **用户权限管理**: 完整的用户认证和权限控制系统
- **UI自动化测试**: 基于图像识别的UI测试功能
- **接口自动化测试**: RESTful API自动化测试
- **智能滚动跟随**: 用户友好的消息显示体验
- **消息操作功能**: 复制、重发、下载为MD
- **消息折叠功能**: 可折叠的AI助手回复
- **文件上传支持**: 支持多种格式文件分析

### 🏗️ 技术架构
- **后端**: FastAPI + SQLAlchemy + PostgreSQL + Redis
- **前端**: React 18 + TypeScript + Ant Design
- **AI集成**: AutoGen + DeepSeek + Qwen-VL + UI-TARS
- **流式通信**: Server-Sent Events (SSE)
- **直接API访问**: 移除前端代理依赖

### 🎯 核心特性
- **智能对话控制**: 
  - 停止生成按钮（标题栏+发送区域）
  - 会话保持和恢复功能
  - 清空会话功能
- **用户体验优化**:
  - 智能滚动跟随（100px阈值）
  - 消息气泡折叠（保持宽度不变）
  - 实时流式响应显示
- **API架构优化**:
  - 直接访问后端接口
  - 统一错误处理机制
  - 统一认证管理

### 🔧 开发工具
- **版本控制**: Git + GitHub
- **代码规范**: Black + ESLint + Prettier
- **容器化**: Docker + Docker Compose
- **数据库迁移**: Alembic
- **API文档**: FastAPI自动生成

### 📚 文档
- 完整的README.md
- API接口文档
- 贡献指南
- 更新日志
- MIT许可证

### 🚀 部署支持
- Docker容器化部署
- 环境变量配置
- 数据库初始化脚本
- 启动/停止脚本

---

## 版本说明

### 版本号格式
- **主版本号**: 不兼容的API修改
- **次版本号**: 向下兼容的功能性新增  
- **修订号**: 向下兼容的问题修正

### 变更类型
- `✨ 新增功能` - 新功能
- `🐛 修复问题` - Bug修复
- `⚡ 性能优化` - 性能改进
- `🔧 技术改进` - 技术债务和重构
- `📚 文档更新` - 文档变更
- `🎨 界面优化` - UI/UX改进
- `🔒 安全更新` - 安全相关修复
- `⚠️ 破坏性变更` - 不兼容的变更

### 贡献者
感谢所有为本项目做出贡献的开发者！

---

*更多详细信息请查看 [GitHub Releases](https://github.com/YOUR_USERNAME/ai-test-management-platform/releases)*
