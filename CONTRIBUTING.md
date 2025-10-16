# 🤝 贡献指南

感谢你对AI测试管理平台的关注！我们欢迎所有形式的贡献。

## 📋 贡献方式

### 🐛 报告Bug
- 使用GitHub Issues报告bug
- 提供详细的复现步骤
- 包含错误信息和环境信息

### 💡 功能建议
- 在Issues中提出新功能建议
- 详细描述功能需求和使用场景
- 讨论实现方案

### 🔧 代码贡献
1. Fork项目到你的GitHub账户
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 创建Pull Request

## 🏗️ 开发环境设置

### 后端开发
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 前端开发
```bash
cd frontend
npm install
npm start
```

## 📝 代码规范

### Python代码规范
- 使用Black进行代码格式化
- 遵循PEP 8规范
- 添加类型注解
- 编写文档字符串

### TypeScript代码规范
- 使用ESLint和Prettier
- 遵循React最佳实践
- 使用TypeScript严格模式
- 组件需要PropTypes或TypeScript接口

### 提交信息规范
使用约定式提交格式：
- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式化
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

示例：
```
feat: 添加AI对话停止功能

- 实现前端停止按钮
- 添加后端停止接口
- 支持会话恢复功能
```

## 🧪 测试

### 运行测试
```bash
# 后端测试
cd backend
pytest

# 前端测试
cd frontend
npm test
```

### 测试覆盖率
- 新功能需要包含测试用例
- 保持测试覆盖率在80%以上
- 包含单元测试和集成测试

## 📚 文档

- 更新相关文档
- 添加API文档
- 更新README.md
- 添加代码注释

## 🔍 代码审查

所有Pull Request都需要经过代码审查：
- 代码质量检查
- 功能测试验证
- 文档完整性检查
- 性能影响评估

## 🎯 发布流程

### 版本号规范
使用语义化版本控制：
- `MAJOR.MINOR.PATCH`
- 主版本号：不兼容的API修改
- 次版本号：向下兼容的功能性新增
- 修订号：向下兼容的问题修正

### 发布步骤
1. 更新版本号
2. 更新CHANGELOG.md
3. 创建发布标签
4. 发布到GitHub Releases

## 💬 社区

- 遵守行为准则
- 尊重所有贡献者
- 提供建设性反馈
- 帮助新贡献者

## 📞 联系方式

如有问题，请通过以下方式联系：
- GitHub Issues
- 邮件：493557094@qq.com

感谢你的贡献！🎉
