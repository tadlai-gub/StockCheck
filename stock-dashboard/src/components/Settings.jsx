import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, Save, RefreshCw, Key, ShieldAlert } from 'lucide-react';

export default function Settings({ onBack }) {
  const [pat, setPat] = useState(() => localStorage.getItem('gh_pat') || '');
  const [repo, setRepo] = useState('tadlai-gub/StockCheck'); // Default repo
  const [stocks, setStocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Load stocks.json from public folder
  useEffect(() => {
    const loadStocks = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}stocks.json`);
        if (response.ok) {
          const data = await response.json();
          setStocks(data);
        } else {
          throw new Error('無法載入 stocks.json');
        }
      } catch (err) {
        setStatusMsg({ type: 'error', text: '讀取 stocks.json 失敗，將使用預設名單。' });
        // Fallback
        setStocks({
          "2610.TW": {"name": "華航", "shares": 1000},
          "5271.TWO": {"name": "紘通", "shares": 2000},
          "6116.TW": {"name": "彩晶", "shares": 2000},
          "8299.TWO": {"name": "群聯", "shares": 30},
          "2002.TW": {"name": "中鋼", "shares": 1000},
          "2337.TW": {"name": "旺宏", "shares": 1000},
          "1714.TW": {"name": "和桐", "shares": 0}
        });
      } finally {
        setLoading(false);
      }
    };
    loadStocks();
  }, []);

  const handleSavePat = () => {
    localStorage.setItem('gh_pat', pat.trim());
    setStatusMsg({ type: 'success', text: 'GitHub 金鑰已安全儲存於您的瀏覽器！' });
  };

  const handleClearPat = () => {
    localStorage.removeItem('gh_pat');
    setPat('');
    setStatusMsg({ type: 'info', text: '已清除瀏覽器中的金鑰儲存。' });
  };

  const handleStockChange = (ticker, key, value) => {
    setStocks(prev => {
      const updated = { ...prev };
      if (key === 'shares') {
        updated[ticker] = {
          ...updated[ticker],
          shares: parseInt(value) || 0
        };
      } else if (key === 'name') {
        updated[ticker] = {
          ...updated[ticker],
          name: value
        };
      }
      return updated;
    });
  };

  const handleAddRow = () => {
    const tempTicker = `NEW_STOCK_${Date.now()}`;
    setStocks(prev => ({
      ...prev,
      [tempTicker]: { name: '新股票', shares: 0, isNew: true }
    }));
  };

  const handleDeleteRow = (ticker) => {
    setStocks(prev => {
      const updated = { ...prev };
      delete updated[ticker];
      return updated;
    });
  };

  const handleTickerChange = (oldTicker, newTicker) => {
    if (!newTicker || oldTicker === newTicker) return;
    setStocks(prev => {
      const updated = { ...prev };
      const stockData = updated[oldTicker];
      delete updated[oldTicker];
      updated[newTicker] = {
        name: stockData.name,
        shares: stockData.shares
      };
      return updated;
    });
  };

  const handleSaveToGithub = async () => {
    const activePat = pat.trim();
    if (!activePat) {
      setStatusMsg({ type: 'error', text: '❌ 請先於下方設定您的 GitHub 個人金鑰 (Token)！' });
      return;
    }

    // Filter out any temporary ticker keys
    const finalStocks = {};
    for (const [ticker, stockData] of Object.entries(stocks)) {
      if (ticker.startsWith('NEW_STOCK_') || !ticker.includes('.')) {
        setStatusMsg({ type: 'error', text: '❌ 股票代碼格式錯誤！必須包含後綴，例如 2330.TW 或 8299.TWO。' });
        return;
      }
      finalStocks[ticker.toUpperCase()] = {
        name: stockData.name,
        shares: stockData.shares
      };
    }

    setSaving(true);
    setStatusMsg({ type: 'info', text: '🔄 正在讀取 GitHub 上現有的設定檔案...' });

    try {
      const filePath = 'stock-dashboard/public/stocks.json';
      const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
      
      // 1. Fetch current file SHA
      const getRes = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${activePat}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      let sha = '';
      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
      }

      // 2. Commit the new file
      setStatusMsg({ type: 'info', text: '🔄 正在將新股票清單提交至您的 GitHub 儲存庫...' });
      
      const jsonContent = JSON.stringify(finalStocks, null, 2);
      // Safe UTF-8 Base64 encoding
      const base64Content = btoa(unescape(encodeURIComponent(jsonContent)));

      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${activePat}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: 'config: update stock list from dashboard',
          content: base64Content,
          sha: sha || undefined
        })
      });

      if (!putRes.ok) {
        const errData = await putRes.json();
        throw new Error(errData.message || '無法儲存檔案至 GitHub');
      }

      // 3. Trigger manual deploy workflow
      await handleTriggerUpdate(true);

    } catch (err) {
      setStatusMsg({ type: 'error', text: `❌ 操作失敗: ${err.message}` });
      setSaving(false);
    }
  };

  const handleTriggerUpdate = async (isSaveFlow = false) => {
    const activePat = pat.trim();
    if (!activePat) {
      setStatusMsg({ type: 'error', text: '❌ 請先於下方設定您的 GitHub 個人金鑰 (Token)！' });
      return;
    }

    if (!isSaveFlow) {
      setSaving(true);
    }
    
    setStatusMsg({ type: 'info', text: '🔄 正在通知 GitHub 啟動雲端自動編譯更新...' });

    try {
      const triggerUrl = `https://api.github.com/repos/${repo}/actions/workflows/deploy.yml/dispatches`;
      const res = await fetch(triggerUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${activePat}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          ref: 'main'
        })
      });

      if (res.ok || res.status === 204) {
        setStatusMsg({
          type: 'success',
          text: isSaveFlow 
            ? '✅ 股票清單已成功儲存！雲端 Actions 數據更新已啟動。請於 1~2 分鐘後重新整理網頁。'
            : '✅ 手動更新指令已送出！雲端 Actions 正在抓取最新股價，請於 1~2 分鐘後點選重新整理觀看。'
        });
      } else {
        const errData = await res.json().catch(() => ({ message: `HTTP status ${res.status}` }));
        throw new Error(errData.message || '無法觸發雲端編譯');
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: `❌ 觸發更新失敗: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-panel fade-in" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div className="stat-icon" style={{ color: 'var(--color-blue)', width: 40, height: 40, borderRadius: 8 }}>
          <SettingsIcon size={20} />
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600 }}>儲存庫與股票監控設定</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            您可以在此直接編輯監控清單，並透過 GitHub API 自動寫回儲存庫與啟動雲端 Actions 更新。
          </p>
        </div>
      </div>

      {/* Status messages */}
      {statusMsg.text && (
        <div 
          className="alert-banner" 
          style={{
            background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.08)' : statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(59, 130, 246, 0.08)',
            borderColor: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
            color: statusMsg.type === 'success' ? '#A7F3D0' : statusMsg.type === 'error' ? '#FCA5A5' : '#93C5FD',
            marginBottom: 20
          }}
        >
          {statusMsg.text}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>載入設定檔中...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Section 1: Stocks List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>股票監控名單</h3>
              <button 
                onClick={handleAddRow}
                className="tab-btn" 
                style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-blue)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '6px 12px' }}
              >
                <Plus size={14} /> 新增股票
              </button>
            </div>
            
            <div className="table-container">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Yahoo Finance 代碼</th>
                    <th>股票名稱</th>
                    <th style={{ width: 160 }}>庫存股數</th>
                    <th style={{ width: 80, textAlign: 'center' }}>刪除</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stocks).map(([ticker, stockData]) => {
                    const isNew = stockData.isNew;
                    return (
                      <tr key={ticker}>
                        <td>
                          {isNew ? (
                            <input
                              type="text"
                              placeholder="例如: 2330.TW"
                              onBlur={(e) => handleTickerChange(ticker, e.target.value.trim())}
                              defaultValue=""
                              style={{
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--panel-border)',
                                color: 'var(--text-primary)',
                                padding: '6px 10px',
                                borderRadius: 4,
                                width: '100%',
                                outline: 'none'
                              }}
                            />
                          ) : (
                            <span style={{ fontWeight: 600, color: 'var(--color-blue)' }}>{ticker}</span>
                          )}
                        </td>
                        <td>
                          <input
                            type="text"
                            value={stockData.name}
                            onChange={(e) => handleStockChange(ticker, 'name', e.target.value)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              borderBottom: '1px dashed var(--panel-border)',
                              color: 'var(--text-primary)',
                              padding: '4px 0',
                              width: '100%',
                              outline: 'none'
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={stockData.shares}
                            onChange={(e) => handleStockChange(ticker, 'shares', e.target.value)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              borderBottom: '1px dashed var(--panel-border)',
                              color: 'var(--text-primary)',
                              padding: '4px 0',
                              width: '80px',
                              textAlign: 'right',
                              outline: 'none'
                            }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            onClick={() => handleDeleteRow(ticker)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--color-red)', cursor: 'pointer' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: GitHub API Credentials */}
          <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--panel-border)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', fontWeight: 600, marginBottom: 12 }}>
              <Key size={16} style={{ color: 'var(--color-orange)' }} /> GitHub 個人金鑰 (Token) 設定
            </h4>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
              為允許網頁與 GitHub 連線以寫入 `stocks.json` 檔案及手動啟動編譯，請填寫您的 GitHub Token。
              此金鑰會**安全地儲存在您本地瀏覽器 (localStorage)** 中，絕不會傳送給任何第三方伺服器。
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <input
                type="password"
                placeholder="在此貼上您的 GitHub PAT (ghp_...)"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--panel-border)',
                  color: 'var(--text-primary)',
                  padding: '8px 12px',
                  borderRadius: 6,
                  flex: 1,
                  minWidth: '260px',
                  outline: 'none',
                  fontSize: '0.85rem'
                }}
              />
              <button 
                onClick={handleSavePat}
                className="tab-btn active"
                style={{ fontSize: '0.8rem', padding: '8px 16px' }}
              >
                儲存金鑰
              </button>
              {localStorage.getItem('gh_pat') && (
                <button 
                  onClick={handleClearPat}
                  className="tab-btn"
                  style={{ fontSize: '0.8rem', padding: '8px 16px', color: 'var(--color-red)' }}
                >
                  清除金鑰
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <ShieldAlert size={12} />
              <span>Token 必須具備 <b>repo</b> 與 <b>workflow</b> 權限複選框勾選。</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
            <button 
              onClick={() => handleTriggerUpdate(false)}
              disabled={saving}
              className="tab-btn"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontWeight: 500 }}
            >
              <RefreshCw size={16} className={saving ? 'spin-anim' : ''} /> 僅手動觸發雲端更新
            </button>
            
            <button 
              onClick={handleSaveToGithub}
              disabled={saving}
              className="tab-btn active"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', fontWeight: 500 }}
            >
              <Save size={16} /> 儲存變更並更新網站
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
