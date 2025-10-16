-- PostgreSQL 初始化脚本
-- 此脚本在 PostgreSQL 容器首次启动时自动执行

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE test_platform TO testplatform;
GRANT ALL ON SCHEMA public TO testplatform;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO testplatform;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO testplatform;

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 创建注释
COMMENT ON DATABASE test_platform IS 'API智能测试平台数据库';

