import React, { useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';
import { ShieldAlert, TrendingUp, Calendar, ArrowLeft } from 'lucide-react';

const CandlestickBar = (props) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;

  const open = payload.open;
  const close = payload.close;
  const high = payload.high;
  const low = payload.low;
  const isUp = close >= open;
  const color = isUp ? '#EF4444' : '#10B981'; // Red is up, green is down in Taiwan

  let yOpen, yClose, yHigh, yLow, cx, yTop, bodyHeight;

  if (props.yScale) {
    yOpen = props.yScale(open);
    yClose = props.yScale(close);
    yHigh = props.yScale(high);
    yLow = props.yScale(low);
    cx = x + width / 2;
    yTop = Math.min(yOpen, yClose);
    bodyHeight = Math.max(Math.abs(yOpen - yClose), 1.5);
  } else {
    cx = x + width / 2;
    yTop = y;
    bodyHeight = Math.max(height, 1.5);
    const maxOpenClose = Math.max(open, close);
    const minOpenClose = Math.min(open, close);
    const bodyDiff = Math.max(Math.abs(open - close), 0.01);
    const scale = height / bodyDiff;
    yHigh = y - (high - maxOpenClose) * scale;
    yLow = y + height + (minOpenClose - low) * scale;
  }

  return (
    <g>
      <line x1={cx} y1={yHigh} x2={cx} y2={yLow} stroke={color} strokeWidth={1.5} />
      <rect
        x={cx - width / 4}
        y={yTop}
        width={Math.max(width / 2, 4)}
        height={bodyHeight}
        fill={color}
        stroke={color}
      />
    </g>
  );
};

export default function StockDetail({ data, selectedTicker, onSelectStock, onBack }) {
  if (!data || !data.stocks) return <div style={{ padding: 20 }}>載入中...</div>;

  const stock = data.stocks[selectedTicker];
  if (!stock) return <div style={{ padding: 20 }}>未找到該股票數據</div>;

  // Prepare chart data
  const chartData = stock.history.map(day => ({
    ...day,
    // Construct range for Recharts range bar: [min, max]
    bodyRange: [Math.min(day.open, day.close), Math.max(day.open, day.close)]
  }));

  const isBreachedDefense = stock.close < stock.prev_week_low && stock.prev_week_low > 0;
  const isBreachedLife = stock.close < stock.weekly_ma20 && stock.weekly_ma20 > 0;

  return (
    <div className="fade-in">
      {/* Detail Header / Select */}
      <div className="header-grid" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} className="tab-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px' }}>
            <ArrowLeft size={16} /> 返回總覽
          </button>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700 }}>
            {stock.name} ({stock.ticker.split('.')[0]}) <span style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 400 }}>詳細分析</span>
          </h2>
        </div>

        {/* Stock Selector Dropdown */}
        <select
          value={selectedTicker}
          onChange={(e) => onSelectStock(e.target.value)}
          style={{
            background: 'var(--panel-bg)',
            border: '1px solid var(--panel-border)',
            color: 'var(--text-primary)',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            outline: 'none',
            fontFamily: 'var(--font-body)'
          }}
        >
          {Object.values(data.stocks).map(s => (
            <option key={s.ticker} value={s.ticker}>
              {s.name} ({s.ticker.split('.')[0]})
            </option>
          ))}
        </select>
      </div>

      {/* Stock Stats Row */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ color: 'var(--color-blue)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>最新收盤價 / 庫存市值</div>
            <div className="stat-value">
              ${stock.close.toFixed(2)} 元
              <span style={{ fontSize: '0.85rem', marginLeft: 8, color: 'var(--text-muted)' }}>
                ({stock.shares.toLocaleString()} 股 = ${(stock.shares * stock.close).toLocaleString(undefined, { maximumFractionDigits: 0 })} 元)
              </span>
            </div>
          </div>
        </div>

        <div className={`glass-panel stat-card ${isBreachedLife ? 'pulse-orange' : ''}`}>
          <div className="stat-icon" style={{ color: isBreachedLife ? 'var(--color-orange)' : 'var(--color-green)' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>週 20MA (生命線)</div>
            <div className="stat-value" style={{ color: isBreachedLife ? 'var(--color-orange)' : 'var(--text-primary)' }}>
              {stock.weekly_ma20 > 0 ? `$${stock.weekly_ma20.toFixed(2)} 元` : 'N/A'}
              {isBreachedLife && <span style={{ fontSize: '0.75rem', marginLeft: 8, color: 'var(--color-orange)' }}>⚠️ 已跌破</span>}
            </div>
          </div>
        </div>

        <div className={`glass-panel stat-card ${isBreachedDefense ? 'pulse-red' : ''}`}>
          <div className="stat-icon" style={{ color: isBreachedDefense ? 'var(--color-red)' : 'var(--color-green)' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>前週 K 線低點 (防守點)</div>
            <div className="stat-value" style={{ color: isBreachedDefense ? 'var(--color-red)' : 'var(--text-primary)' }}>
              {stock.prev_week_low > 0 ? `$${stock.prev_week_low.toFixed(2)} 元` : 'N/A'}
              {isBreachedDefense && <span style={{ fontSize: '0.75rem', marginLeft: 8, color: 'var(--color-red)' }}>⚠️ 已跌破</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Candlestick Chart */}
      <div className="glass-panel" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 20, fontSize: '1.25rem' }}>K線、日 100MA 與週 20MA 走勢圖 (近40日交易)</h3>
        <div style={{ width: '100%', height: 480 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                stroke="rgba(255,255,255,0.1)"
              />
              <YAxis 
                domain={['dataMin - 5', 'dataMax + 5']}
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                stroke="rgba(255,255,255,0.1)"
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                contentStyle={{ 
                  background: 'rgba(10, 15, 30, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: 8,
                  color: 'var(--text-primary)'
                }}
                labelStyle={{ fontWeight: 600, marginBottom: 6 }}
                formatter={(value, name, props) => {
                  if (name === 'K線' && props.payload) {
                    const { open, high, low, close } = props.payload;
                    return [
                      `開: ${open.toFixed(2)} | 高: ${high.toFixed(2)} | 低: ${low.toFixed(2)} | 收: ${close.toFixed(2)}`,
                      '價格'
                    ];
                  }
                  if (value !== undefined && value !== null) {
                    return [`$${value.toFixed(2)}`, name];
                  }
                  return [value, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.85rem', paddingTop: 10 }} />
              
              {/* Candlesticks drawn using custom renderer */}
              <Bar 
                dataKey="bodyRange" 
                shape={<CandlestickBar />} 
                name="K線"
                legendType="rect"
              />
              
              {/* Daily 100MA (Violet Line) */}
              <Line 
                type="monotone" 
                dataKey="ma100" 
                stroke="#8B5CF6" 
                dot={false} 
                strokeWidth={1.5} 
                name="日線 100MA"
              />
              
              {/* Weekly 20MA (Orange Line) */}
              <Line 
                type="step" 
                dataKey="weekly_ma20" 
                stroke="#F59E0B" 
                dot={false} 
                strokeWidth={2} 
                name="週線 20MA (生命線)"
              />

              {/* Previous Week K-line Low Defense Line */}
              {stock.prev_week_low > 0 && (
                <ReferenceLine 
                  y={stock.prev_week_low} 
                  stroke="#EF4444" 
                  strokeDasharray="4 4" 
                  strokeWidth={1.5}
                  label={{ 
                    value: `前週低點防守: $${stock.prev_week_low.toFixed(2)}`, 
                    fill: '#EF4444', 
                    position: 'insideBottomRight',
                    fontSize: 10,
                    fontWeight: 600,
                    offset: 8
                  }} 
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* History Data Table */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Calendar size={18} style={{ color: 'var(--color-blue)' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>歷史數據明細 (近40日)</h3>
        </div>
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>交易日期</th>
                <th style={{ textAlign: 'right' }}>開盤價</th>
                <th style={{ textAlign: 'right' }}>最高價</th>
                <th style={{ textAlign: 'right' }}>最低價</th>
                <th style={{ textAlign: 'right' }}>收盤價</th>
                <th style={{ textAlign: 'right' }}>每日價差</th>
                <th style={{ textAlign: 'right' }}>高低振幅</th>
                <th style={{ textAlign: 'right' }}>日 100MA</th>
                <th style={{ textAlign: 'right' }}>週 20MA</th>
                <th style={{ textAlign: 'center' }}>警示狀態</th>
              </tr>
            </thead>
            <tbody>
              {[...stock.history].reverse().map((day) => {
                const diff = day.high - day.low;
                const amp = day.low > 0 ? (diff / day.low) * 100 : 0;
                
                const dayBreachedDefense = day.close < stock.prev_week_low && stock.prev_week_low > 0;
                const dayBreachedLife = day.close < day.weekly_ma20 && day.weekly_ma20 > 0;

                let rowStatus = "安全";
                let badgeClass = "badge badge-green";
                if (dayBreachedDefense) {
                  rowStatus = "跌破防守";
                  badgeClass = "badge badge-red";
                } else if (dayBreachedLife) {
                  rowStatus = "跌破生命線";
                  badgeClass = "badge badge-orange";
                }

                return (
                  <tr key={day.date}>
                    <td style={{ fontWeight: 500 }}>{day.date}</td>
                    <td style={{ textAlign: 'right' }}>${day.open.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>${day.high.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>${day.low.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>${day.close.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>${diff.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{amp.toFixed(2)}%</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                      {day.ma100 > 0 ? `$${day.ma100.toFixed(2)}` : '-'}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                      {day.weekly_ma20 > 0 ? `$${day.weekly_ma20.toFixed(2)}` : '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={badgeClass}>{rowStatus}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
