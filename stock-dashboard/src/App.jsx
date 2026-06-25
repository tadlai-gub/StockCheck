import React, { useState, useEffect } from 'react';
import Overview from './components/Overview';
import VolatilityChart from './components/VolatilityChart';
import StockDetail from './components/StockDetail';
import Settings from './components/Settings';
import { BarChart3, LineChart, Cpu, RefreshCw, Settings as SettingsIcon } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStock, setSelectedStock] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data.json`);
      if (!response.ok) {
        throw new Error('無法載入股票數據檔案。請確保已執行 update_data.py 生成數據。');
      }
      const jsonData = await response.json();
      setData(jsonData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectStock = (ticker) => {
    setSelectedStock(ticker);
    setActiveTab('detail');
  };

  // Clear App.css imports or elements if needed
  return (
    <div className="container">
      {/* Global Dashboard Header */}
      <header className="header-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Cpu size={28} style={{ color: 'var(--color-blue)' }} />
            <h1 className="title-main">台股波段監控儀表板</h1>
          </div>
          <div className="subtitle-main">
            {data ? (
              <span>數據更新時間: {data.updateTime} | 資料來源: Yahoo Finance</span>
            ) : (
              <span>載入數據中...</span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tabs-container">
          <button
            onClick={() => setActiveTab('overview')}
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart3 size={16} /> 投資組合總覽
            </span>
          </button>
          <button
            onClick={() => setActiveTab('volatility')}
            className={`tab-btn ${activeTab === 'volatility' ? 'active' : ''}`}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <LineChart size={16} /> 兩週振幅對比
            </span>
          </button>
          {selectedStock && (
            <button
              onClick={() => setActiveTab('detail')}
              className={`tab-btn ${activeTab === 'detail' ? 'active' : ''}`}
            >
              個股詳細分析
            </button>
          )}
          <button
            onClick={() => setActiveTab('settings')}
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <SettingsIcon size={16} /> 系統設定
            </span>
          </button>
          <button 
            onClick={fetchData} 
            className="tab-btn"
            style={{ padding: '8px 10px', display: 'flex', alignItems: 'center' }}
            title="重新整理數據"
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {loading && !data && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={36} className="spin-anim" style={{ margin: '0 auto 16px', display: 'block', color: 'var(--color-blue)' }} />
            正在載入系統數據，請稍候...
          </div>
        )}

        {error && (
          <div className="glass-panel" style={{ padding: 24, borderColor: 'var(--color-red)', background: 'var(--color-red-bg)' }}>
            <h3 style={{ color: 'var(--color-red)', marginBottom: 8 }}>載入失敗</h3>
            <p style={{ fontSize: '0.9rem', color: '#FCA5A5', marginBottom: 16 }}>{error}</p>
            <button onClick={fetchData} className="tab-btn active">
              重試載入
            </button>
          </div>
        )}

        {data && (
          <>
            {activeTab === 'overview' && (
              <Overview data={data} onSelectStock={handleSelectStock} />
            )}
            {activeTab === 'volatility' && (
              <VolatilityChart data={data} />
            )}
            {activeTab === 'detail' && selectedStock && (
              <StockDetail
                data={data}
                selectedTicker={selectedStock}
                onSelectStock={setSelectedStock}
                onBack={() => setActiveTab('overview')}
              />
            )}
            {activeTab === 'settings' && (
              <Settings onBack={() => setActiveTab('overview')} />
            )}
          </>
        )}
      </main>

      <footer style={{ marginTop: 40, padding: '24px 0 12px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        台股波段監控儀表板 © {new Date().getFullYear()} • 採用 React、Recharts 與 Vite 技術 • Antigravity AI 助理建置
      </footer>

      {/* Spin animation CSS */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-anim {
          animation: spin 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
