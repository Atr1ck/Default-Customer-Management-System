import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { Suspense, lazy } from 'react';
import MainLayout from './components/Layout';
const DefaultReasonMaintenance = lazy(() => import('./pages/DefaultReasonMaintenance'));
const DefaultApplication = lazy(() => import('./pages/DefaultApplication'));
const DefaultReview = lazy(() => import('./pages/DefaultReview'));
const DefaultQuery = lazy(() => import('./pages/DefaultQuery'));
const RebirthApplication = lazy(() => import('./pages/RebirthApplication'));
const RebirthReview = lazy(() => import('./pages/RebirthReview'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
import { isAuthenticated } from './utils/auth';
import './App.css';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/*" element={<ProtectedShell />}/>
          </Routes>
        </Suspense>
      </Router>
    </ConfigProvider>
  );
}

export default App;

function ProtectedShell() {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<DefaultReasonMaintenance />} />
        <Route path="/default-application" element={<DefaultApplication />} />
        <Route path="/default-review" element={<DefaultReview />} />
        <Route path="/default-query" element={<DefaultQuery />} />
        <Route path="/rebirth-application" element={<RebirthApplication />} />
        <Route path="/rebirth-review" element={<RebirthReview />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
}
