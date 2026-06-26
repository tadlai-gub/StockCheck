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
  const [updateStatus, setUpdateStatus] = useState({
    active: false,
    progress: 0,
    message: '',
    showCloseBtn: false
  });

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

  const startUpdateMonitoring = () => {
    const oldTime = data?.updateTime;
    setUpdateStatus({
      active: true,
      progress: 5,
      message: '🔄 正在啟動雲端更新...',
      showCloseBtn: false
    });

    let currentProgress = 5;
    const startTime = Date.now();

    // 1. Progress Bar Simulation Timer (Smoothly ticks up from 5% to 95%)
    const progressTimer = setInterval(() => {
      if (currentProgress < 95) {
        currentProgress += 1;
        setUpdateStatus(prev => ({
          ...prev,
          progress: currentProgress,
          message: currentProgress < 20 
            ? '🔄 正在通知 GitHub 啟動雲端自動編譯...' 
            : currentProgress < 50
              ? '⚡ 雲端伺服器已啟動，正在抓取最新股價數據...'
              : currentProgress < 80
                ? '📦 股價數據抓取完畢，正在重新編譯並部署網頁...'
                : '🚀 部署打包網頁中，新版網頁即將發布...'
        }));
      }
    }, 850); // ~75 seconds to reach 95%

    // 2. Data Polling Timer (fetch data.json every 8 seconds)
    const pollingTimer = setInterval(async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}data.json?t=${Date.now()}`);
        if (res.ok) {
          const newData = await res.json();
          if (newData.updateTime !== oldTime) {
            // New data detected!
            clearInterval(progressTimer);
            clearInterval(pollingTimer);
            
            setUpdateStatus({
              active: true,
              progress: 100,
              message: '✅ 線上數據與網頁已更新完成！正在套用最新數據...',
              showCloseBtn: false
            });

            // Apply new data to state
            setData(newData);

            // Close modal after 1.5 seconds
            setTimeout(() => {
              setUpdateStatus({ active: false, progress: 0, message: '', showCloseBtn: false });
            }, 1500);
          }
        }
      } catch (e) {
        console.error("Polling error:", e);
      }

      // 3. Timeout check: if more than 160 seconds (2.6 mins) have elapsed
      if (Date.now() - startTime > 160000) {
        clearInterval(progressTimer);
        clearInterval(pollingTimer);
        setUpdateStatus(prev => ({
          ...prev,
          message: '⚠️ 雲端部署時間較長，您可關閉此視窗，數據將在雲端背景完成。',
          showCloseBtn: true
        }));
      }
    }, 8000);
  };

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
              <Settings onBack={() => setActiveTab('overview')} onStartUpdate={startUpdateMonitoring} />
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

      {/* Global Manual Update Progress Overlay */}
      {updateStatus.active && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(5, 8, 16, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          fontFamily: 'var(--font-body)'
        }}>
          <div className="glass-panel" style={{
            padding: '40px',
            maxWidth: '450px',
            width: '90%',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <RefreshCw size={48} className="spin-anim" style={{ color: 'var(--color-blue)', marginBottom: 24, display: 'inline-block' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>
              系統數據手動更新中
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20, minHeight: '40px' }}>
              {updateStatus.message || '正在處理中，請稍候...'}
            </p>
            
            {/* Progress Bar Container */}
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: 10
            }}>
              <div style={{
                width: `${updateStatus.progress}%`,
                height: '100%',
                backgroundColor: 'var(--color-blue)',
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {updateStatus.progress}%
            </div>

            {updateStatus.showCloseBtn && (
              <button 
                onClick={() => setUpdateStatus({ active: false, progress: 0, message: '', showCloseBtn: false })}
                className="tab-btn active"
                style={{ marginTop: 20, padding: '8px 20px', fontSize: '0.85rem' }}
              >
                關閉並返回
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
