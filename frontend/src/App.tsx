import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import AppLayout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AIChat from './pages/AIChat';
import AITestCaseGenerate from './pages/AITestCaseGenerate';
import UIImageAnalysis from './pages/UIImageAnalysis';
import UICaseGenerate from './pages/UICaseGenerate';
import UICaseExecute from './pages/UICaseExecute';
import APIAutomation from './pages/APIAutomation';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import Debug from './pages/Debug';
import TokenTest from './pages/TokenTest';
import Error403 from './pages/Error/403';
import Error404 from './pages/Error/404';
const Projects = () => <div>项目管理页面</div>;
const Requirements = () => <div>需求管理页面</div>;
const TestCases = () => <div>测试用例页面</div>;
// UI自动化测试相关页面已通过import导入
// 接口自动化测试页面已通过import导入
const Defects = () => <div>缺陷分析页面</div>;
const Performance = () => <div>性能测试页面</div>;
const SystemSettings = () => <div>系统配置页面</div>;

// 配置dayjs
dayjs.locale('zh-cn');

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <Router>
          <Routes>
            {/* 登录页面 */}
            <Route path="/login" element={<Login />} />
            
            {/* 错误页面 */}
            <Route path="/403" element={<Error403 />} />
            <Route path="/404" element={<Error404 />} />
            
            {/* AI 测试用例生成 - 无需认证 */}
            <Route path="/ai-testcase-generate" element={<AITestCaseGenerate />} />

            {/* 主应用路由 */}
            <Route path="/" element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }>
              {/* 重定向到仪表盘 */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* 仪表盘 */}
              <Route path="dashboard" element={<Dashboard />} />

              {/* AI 智能助手 */}
              <Route path="ai-chat" element={<AIChat />} />

              {/* 项目管理 */}
              <Route path="projects" element={<Projects />} />

              {/* 需求管理 */}
              <Route path="requirements" element={<Requirements />} />

              {/* 测试用例 */}
              <Route path="test-cases">
                <Route path="list" element={<TestCases />} />
                <Route path="ai-generate" element={<AITestCaseGenerate />} />
                <Route index element={<Navigate to="/test-cases/list" replace />} />
              </Route>
              
              {/* UI自动化测试 */}
              <Route path="ui-automation">
                <Route path="image-analysis" element={
                  <PrivateRoute requiredRoles={['admin', 'test_manager', 'tester']}>
                    <UIImageAnalysis />
                  </PrivateRoute>
                } />
                <Route path="case-generate" element={
                  <PrivateRoute requiredRoles={['admin', 'test_manager', 'tester']}>
                    <UICaseGenerate />
                  </PrivateRoute>
                } />
                <Route path="case-execute" element={
                  <PrivateRoute requiredRoles={['admin', 'test_manager', 'tester']}>
                    <UICaseExecute />
                  </PrivateRoute>
                } />
                <Route index element={<Navigate to="/ui-automation/image-analysis" replace />} />
              </Route>

              {/* 接口自动化测试 */}
              <Route path="api-automation" element={
                <PrivateRoute requiredRoles={['admin', 'test_manager', 'tester']}>
                  <APIAutomation />
                </PrivateRoute>
              } />
              
              {/* 缺陷分析 */}
              <Route path="defects" element={<Defects />} />
              
              {/* 性能测试 */}
              <Route path="performance" element={
                <PrivateRoute requiredRoles={['admin', 'test_manager', 'tester']}>
                  <Performance />
                </PrivateRoute>
              } />
              
              {/* 系统设置 */}
              <Route path="settings">
                <Route path="users" element={
                  <PrivateRoute requiredRoles={['admin']}>
                    <UserManagement />
                  </PrivateRoute>
                } />
                <Route path="system" element={
                  <PrivateRoute requiredRoles={['admin']}>
                    <SystemSettings />
                  </PrivateRoute>
                } />
              </Route>
              
              {/* 个人资料 */}
              <Route path="profile" element={<Profile />} />

              {/* 调试页面 */}
              <Route path="debug" element={<Debug />} />

              {/* Token测试页面 */}
              <Route path="token-test" element={<TokenTest />} />
            </Route>
            
            {/* 404页面 */}
            <Route path="*" element={<Error404 />} />
          </Routes>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
