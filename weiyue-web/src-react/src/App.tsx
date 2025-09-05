import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './components/Layout';
import ReasonMaintenance from './pages/ReasonMaintenance';
import DefaultApplication from './pages/DefaultApplication';
import DefaultReview from './pages/DefaultReview';
import DefaultQuery from './pages/DefaultQuery';
import RebirthApplication from './pages/RebirthApplication';
import RebirthReview from './pages/RebirthReview';
import Statistics from './pages/Statistics';
import './App.css';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<ReasonMaintenance />} />
            <Route path="/default-application" element={<DefaultApplication />} />
            <Route path="/default-review" element={<DefaultReview />} />
            <Route path="/default-query" element={<DefaultQuery />} />
            <Route path="/rebirth-application" element={<RebirthApplication />} />
            <Route path="/rebirth-review" element={<RebirthReview />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
