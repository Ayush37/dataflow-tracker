// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Dashboard from './pages/Dashboard';
import FlowDetails from './pages/FlowDetails';
import NewFlow from './pages/NewFlow';
import NotFound from './pages/NotFound';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

const App = () => {
  return (
    <Router>
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto p-4 bg-gray-50">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/flows/:flowName" element={<FlowDetails />} />
              <Route path="/new" element={<NewFlow />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" />} />
            </Routes>
          </main>
        </div>
        <ToastContainer position="bottom-right" />
      </div>
    </Router>
  );
};

export default App;
