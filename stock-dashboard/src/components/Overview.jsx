import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp, ShieldAlert, BadgeDollarSign, Layers } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function Overview({ data, onSelectStock }) {
  if (!data || !data.stocks) return <div style={{ padding: 20 }}>載入中...</div>;

  const stocksList = Object.values(data.stocks);

  // Calculate stats
  let totalValue = 0;
  let totalPrevValue = 0;
  let activeHoldings = 0;
  let alertCount = 0;

  const tableData = stocksList.map(stock => {
    const marketVal = stock.shares * stock.close;
    const prevMarketVal = stock.shares * stock.prev_close;
    
    totalValue += marketVal;
    totalPrevValue += prevMarketVal;
    
    if (stock.shares > 0) activeHoldings++;
    if (stock.status === '跌破防守' || stock.status === '跌破生命線') alertCount++;

    return {
      ...stock,
      marketVal
    };
  });

  const dayGainLoss = totalValue - totalPrevValue;
  const dayGainLossPct = totalPrevValue > 0 ? (dayGainLoss / totalPrevValue) * 100 : 0;

  // Prepare allocation chart data (only for stocks with > 0 shares)
  const pieData = tableData
    .filter(s => s.shares > 0)
    .map(s => ({
      name: s.name,
      value: s.marketVal
    }));

  const getStatusBadge = (status) => {
    switch (status) {
      case '安全續抱':
        return <span className="badge badge-green">安全續抱</span>;
      case '跌破生命線':
        return <span className="badge badge-orange">跌破生命線</span>;
      case '跌破防守':
        return <span className="badge badge-red">跌破防守</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="fade-in">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ color: '#3B82F6' }}>
            <BadgeDollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>總持股市值</div>
            <div className="stat-value">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 元
            </div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ color: dayGainLoss >= 0 ? '#10B981' : '#EF4444' }}>
            <TrendingUp size={24} style={{ transform: dayGainLoss < 0 ? 'rotate(180deg)' : 'none' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>今日損益估算</div>
            <div className="stat-value" style={{ color: dayGainLoss >= 0 ? '#10B981' : '#EF4444' }}>
              {dayGainLoss >= 0 ? '+' : ''}
              ${dayGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 元
              <span style={{ fontSize: '0.9rem', marginLeft: 8, fontWeight: 500 }}>
                ({dayGainLossPct >= 0 ? '+' : ''}{dayGainLossPct.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ color: '#8B5CF6' }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>庫存股票檔數</div>
            <div className="stat-value">{activeHoldings} 檔 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 共 {stocksList.length} 檔監控</span></div>
          </div>
        </div>

        <div className={`glass-panel stat-card ${alertCount > 0 ? 'pulse-red' : ''}`}>
          <div className="stat-icon" style={{ color: alertCount > 0 ? '#EF4444' : '#10B981' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>未平倉風險警示</div>
            <div className="stat-value" style={{ color: alertCount > 0 ? '#EF4444' : '#10B981' }}>
              {alertCount} 個觸發點
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="main-grid">
        {/* Left: Holdings Table */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16, fontSize: '1.15rem' }}>持股明細與防守狀況</h3>
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>代碼</th>
                  <th>名稱</th>
                  <th style={{ textAlign: 'right' }}>庫存股數</th>
                  <th style={{ textAlign: 'right' }}>最新價</th>
                  <th style={{ textAlign: 'right' }}>週20MA</th>
                  <th style={{ textAlign: 'right' }}>前週K低點</th>
                  <th style={{ textAlign: 'right' }}>市值</th>
                  <th style={{ textAlign: 'right' }}>佔比</th>
                  <th style={{ textAlign: 'center' }}>狀態</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((stock) => {
                  const pct = totalValue > 0 ? (stock.marketVal / totalValue) * 100 : 0;
                  return (
                    <tr key={stock.ticker} style={{ cursor: 'pointer' }} onClick={() => onSelectStock(stock.ticker)}>
                      <td style={{ fontWeight: 600, color: 'var(--color-blue)' }}>{stock.ticker.split('.')[0]}</td>
                      <td style={{ fontWeight: 500 }}>{stock.name}</td>
                      <td style={{ textAlign: 'right' }}>{stock.shares.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>${stock.close.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {stock.weekly_ma20 > 0 ? `$${stock.weekly_ma20.toFixed(2)}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {stock.prev_week_low > 0 ? `$${stock.prev_week_low.toFixed(2)}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 500 }}>
                        ${stock.marketVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{pct.toFixed(1)}%</td>
                      <td style={{ textAlign: 'center' }}>{getStatusBadge(stock.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Allocation Chart & Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Allocation */}
          <div className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', height: 320 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 8, fontSize: '1.15rem' }}>持股資金分佈</h3>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`$${value.toLocaleString()}`, '市值']}
                    contentStyle={{ background: 'rgba(10, 15, 30, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '0.75rem', paddingTop: 10 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Alerts */}
          <div className="glass-panel" style={{ padding: 20, flex: 1 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 12, fontSize: '1.15rem' }}>即時風險監控</h3>
            
            {alertCount === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                🟢 所有持股均在安全防線之上，運作良好。
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tableData
                  .filter(s => s.status === '跌破防守')
                  .map(s => (
                    <div key={s.ticker} className="alert-banner alert-banner-red pulse-red">
                      <div style={{ fontWeight: 600 }}>⚠️ {s.name} ({s.ticker.split('.')[0]}) 跌破防守點！</div>
                      <div style={{ fontSize: '0.8rem', marginTop: 2 }}>
                        最新收盤價 ${s.close.toFixed(2)} 已低於前週 K 線低點防守線 ${s.prev_week_low.toFixed(2)}。建議依據停損機制退場避險。
                      </div>
                    </div>
                  ))}

                {tableData
                  .filter(s => s.status === '跌破生命線')
                  .map(s => (
                    <div key={s.ticker} className="alert-banner alert-banner-orange">
                      <div style={{ fontWeight: 600 }}>⚠️ {s.name} ({s.ticker.split('.')[0]}) 跌破生命線！</div>
                      <div style={{ fontSize: '0.8rem', marginTop: 2 }}>
                        最新收盤價 ${s.close.toFixed(2)} 已低於週 20MA (生命線) ${s.weekly_ma20.toFixed(2)}。請密切注意，準備執行防衛性操作。
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
