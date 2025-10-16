from fastapi import APIRouter
from .auth import router as auth_router
from .users import router as users_router
from .ai_chat import router as ai_chat_router
from .ai_testcase_team_chat import router as ai_testcase_team_router

# 创建API路由器
api_router = APIRouter()

# 注册各个模块的路由
api_router.include_router(auth_router, prefix="/auth", tags=["认证"])
api_router.include_router(users_router, prefix="/users", tags=["用户管理"])
api_router.include_router(ai_chat_router, prefix="/ai-chat", tags=["AI聊天"])
api_router.include_router(ai_testcase_team_router, prefix="/ai-testcase-team", tags=["AI测试用例团队"])

# 这里将来会添加其他模块的路由
# api_router.include_router(projects_router, prefix="/projects", tags=["项目管理"])
# api_router.include_router(requirements_router, prefix="/requirements", tags=["需求管理"])
# api_router.include_router(test_cases_router, prefix="/test-cases", tags=["测试用例"])
# api_router.include_router(defects_router, prefix="/defects", tags=["缺陷管理"])
# api_router.include_router(dashboard_router, prefix="/dashboard", tags=["仪表盘"])
