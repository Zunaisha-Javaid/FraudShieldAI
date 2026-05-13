import React, { useState } from 'react';
import './styles/globals.css';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import BulkPage from './pages/BulkPage';

export default function App() {
  const [page, setPage] = useState('landing');
  const [cases, setCases] = useState([]);

  const addCase = (newCase) => {
    setCases(prev => [{ ...newCase, id: Date.now(), timestamp: new Date().toISOString() }, ...prev]);
  };

  if (page === 'landing') {
    return <LandingPage onEnter={() => setPage('chat')} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative' }}>
      <div className="grid-bg" />
      <Sidebar activePage={page} setPage={setPage} />
      <main style={{ flex: 1, marginLeft: 260, position: 'relative', zIndex: 1 }}>
        {page === 'chat' && <ChatPage addCase={addCase} />}
        {page === 'dashboard' && <DashboardPage cases={cases} />}
        {page === 'history' && <HistoryPage cases={cases} />}
        {page === 'bulk' && <BulkPage addCase={addCase} />}
      </main>
    </div>
  );
}
