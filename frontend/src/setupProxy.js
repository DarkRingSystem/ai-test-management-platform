const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 为SSE流式端点创建特殊的代理配置
  app.use(
    '/api/v1/ai-testcase-team/stream',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      // 关键配置：禁用缓冲以支持SSE流式传输
      buffer: false,
      // 保持连接活跃
      ws: false,
      // 设置超时
      timeout: 300000, // 5分钟
      proxyTimeout: 300000,
      // 添加必要的头部
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 代理SSE请求:', req.method, req.url);
        // 确保正确的Content-Type
        if (req.body) {
          proxyReq.setHeader('Content-Type', 'application/json');
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('📡 SSE响应状态:', proxyRes.statusCode);
        // 设置SSE相关的响应头
        proxyRes.headers['Cache-Control'] = 'no-cache';
        proxyRes.headers['Connection'] = 'keep-alive';
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
      },
      onError: (err, req, res) => {
        console.error('❌ SSE代理错误:', err.message);
      }
    })
  );

  // 为AI聊天流式端点创建代理配置
  app.use(
    '/api/v1/ai-chat/stream',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      buffer: false,
      ws: false,
      timeout: 300000,
      proxyTimeout: 300000,
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 代理AI聊天请求:', req.method, req.url);
        if (req.body) {
          proxyReq.setHeader('Content-Type', 'application/json');
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('📡 AI聊天响应状态:', proxyRes.statusCode);
        proxyRes.headers['Cache-Control'] = 'no-cache';
        proxyRes.headers['Connection'] = 'keep-alive';
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
      },
      onError: (err, req, res) => {
        console.error('❌ AI聊天代理错误:', err.message);
      }
    })
  );

  // 为其他API端点创建通用代理配置
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 代理API请求:', req.method, req.url);
      },
      onError: (err, req, res) => {
        console.error('❌ API代理错误:', err.message);
      }
    })
  );
};
