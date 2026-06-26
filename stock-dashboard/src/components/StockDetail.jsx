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

const CustomTooltip = ({ active, payload, label, timeframe }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const { open, high, low, close } = data;
    const isUp = close >= open;
    const priceColor = isUp ? '#EF4444' : '#10B981'; // 紅漲綠跌
    
    return (
      <div className="glass-panel" style={{ padding: '12px 16px', background: 'rgba(10, 15, 30, 0.95)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontSize: '0.85rem' }}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>{label}</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ color: 'var(--text-secondary)' }}>
            價格：
            <span style={{ color: priceColor, fontWeight: 600 }}>
              開 {open.toFixed(2)} | 高 {high.toFixed(2)} | 低 {low.toFixed(2)} | 收 {close.toFixed(2)}
            </span>
          </div>
          {timeframe === 'daily' && (
            <>
              {data.ma5 !== undefined && data.ma5 !== null && (
                <div style={{ color: '#EC4899' }}>
                  日線 5MA：<span style={{ fontWeight: 600 }}>${data.ma5.toFixed(2)}</span>
                </div>
              )}
              {data.ma10 !== undefined && data.ma10 !== null && (
                <div style={{ color: '#06B6D4' }}>
                  日線 10MA：<span style={{ fontWeight: 600 }}>${data.ma10.toFixed(2)}</span>
                </div>
              )}
              {data.ma100 !== undefined && data.ma100 !== null && (
                <div style={{ color: '#8B5CF6' }}>
                  日線 100MA：<span style={{ fontWeight: 600 }}>${data.ma100.toFixed(2)}</span>
                </div>
              )}
              {data.weekly_ma20 !== undefined && data.weekly_ma20 !== null && (
                <div style={{ color: '#F59E0B' }}>
                  週線 20MA (生命線)：<span style={{ fontWeight: 600 }}>${data.weekly_ma20.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
          {timeframe === 'weekly' && (
            <>
              {data.ma10 !== undefined && data.ma10 !== null && (
                <div style={{ color: '#8B5CF6' }}>
                  週線 10MA：<span style={{ fontWeight: 600 }}>${data.ma10.toFixed(2)}</span>
                </div>
              )}
              {data.ma20 !== undefined && data.ma20 !== null && (
                <div style={{ color: '#F59E0B' }}>
                  週線 20MA (生命線)：<span style={{ fontWeight: 600 }}>${data.ma20.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
          {timeframe === 'monthly' && (
            <>
              {data.ma6 !== undefined && data.ma6 !== null && (
                <div style={{ color: '#8B5CF6' }}>
                  月線 6MA：<span style={{ fontWeight: 600 }}>${data.ma6.toFixed(2)}</span>
                </div>
              )}
              {data.ma12 !== undefined && data.ma12 !== null && (
                <div style={{ color: '#F59E0B' }}>
                  月線 12MA：<span style={{ fontWeight: 600 }}>${data.ma12.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function StockDetail({ data, selectedTicker, onSelectStock, onBack }) {
  const [timeframe, setTimeframe] = useState('daily');

  if (!data || !data.stocks) return <div style={{ padding: 20 }}>載入中...</div>;

  const stock = data.stocks[selectedTicker];
  if (!stock) return <div style={{ padding: 20 }}>未找到該股票數據</div>;

  // Choose historical source
  const rawHistory = (timeframe === 'daily' 
    ? stock.history 
    : timeframe === 'weekly' 
      ? stock.history_weekly 
      : stock.history_monthly) || [];

  // Prepare chart data
  const chartData = rawHistory.map(day => ({
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', margin: 0 }}>
            {timeframe === 'daily' 
              ? 'K線、日 100MA 與週 20MA 走勢圖 (近40日交易)' 
              : timeframe === 'weekly'
                ? '週K線、週 10MA 與週 20MA 走勢圖 (近40週交易)'
                : '月K線與 6月、12月均線走勢圖 (近24個月)'}
          </h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={() => setTimeframe('daily')} 
              className={`tab-btn ${timeframe === 'daily' ? 'active' : ''}`}
              style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              日線
            </button>
            <button 
              onClick={() => setTimeframe('weekly')} 
              className={`tab-btn ${timeframe === 'weekly' ? 'active' : ''}`}
              style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              週線
            </button>
            <button 
              onClick={() => setTimeframe('monthly')} 
              className={`tab-btn ${timeframe === 'monthly' ? 'active' : ''}`}
              style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              月線
            </button>
          </div>
        </div>
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
              <Tooltip content={<CustomTooltip timeframe={timeframe} />} />
              <Legend wrapperStyle={{ fontSize: '0.85rem', paddingTop: 10 }} />
              
              {/* Candlesticks drawn using custom renderer */}
              <Bar 
                dataKey="bodyRange" 
                shape={<CandlestickBar />} 
                name="K線"
                legendType="rect"
              />
              
              {/* Conditional Indicators depending on timeframe */}
              {timeframe === 'daily' && (
                <>
                  {/* Daily 5MA (Pink Line) */}
                  <Line 
                    type="monotone" 
                    dataKey="ma5" 
                    stroke="#EC4899" 
                    dot={false} 
                    strokeWidth={1} 
                    name="日線 5MA"
                  />

                  {/* Daily 10MA (Cyan Line) */}
                  <Line 
                    type="monotone" 
                    dataKey="ma10" 
                    stroke="#06B6D4" 
                    dot={false} 
                    strokeWidth={1} 
                    name="日線 10MA"
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
                </>
              )}
              {timeframe === 'weekly' && (
                <>
                  {/* Weekly 10MA (Violet Line) */}
                  <Line 
                    type="monotone" 
                    dataKey="ma10" 
                    stroke="#8B5CF6" 
                    dot={false} 
                    strokeWidth={1.5} 
                    name="週線 10MA"
                  />
                  
                  {/* Weekly 20MA (Orange Line) */}
                  <Line 
                    type="monotone" 
                    dataKey="ma20" 
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
                </>
              )}
              {timeframe === 'monthly' && (
                <>
                  {/* Monthly 6MA (Violet Line) */}
                  <Line 
                    type="monotone" 
                    dataKey="ma6" 
                    stroke="#8B5CF6" 
                    dot={false} 
                    strokeWidth={1.5} 
                    name="月線 6MA"
                  />
                  
                  {/* Monthly 12MA (Orange Line) */}
                  <Line 
                    type="monotone" 
                    dataKey="ma12" 
                    stroke="#F59E0B" 
                    dot={false} 
                    strokeWidth={2} 
                    name="月線 12MA"
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* History Data Table */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Calendar size={18} style={{ color: 'var(--color-blue)' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>
            歷史數據明細 ({timeframe === 'daily' ? '近40日' : timeframe === 'weekly' ? '近40週' : '近24個月'})
          </h3>
        </div>
        <div className="table-container">
          <table className="modern-table">
            <thead>
              {timeframe === 'daily' && (
                <tr>
                  <th>交易日期</th>
                  <th style={{ textAlign: 'right' }}>開盤價</th>
                  <th style={{ textAlign: 'right' }}>最高價</th>
                  <th style={{ textAlign: 'right' }}>最低價</th>
                  <th style={{ textAlign: 'right' }}>收盤價</th>
                  <th style={{ textAlign: 'right' }}>每日價差</th>
                  <th style={{ textAlign: 'right' }}>高低振幅</th>
                  <th style={{ textAlign: 'right' }}>日 5MA</th>
                  <th style={{ textAlign: 'right' }}>日 10MA</th>
                  <th style={{ textAlign: 'right' }}>日 100MA</th>
                  <th style={{ textAlign: 'right' }}>週 20MA</th>
                  <th style={{ textAlign: 'center' }}>警示狀態</th>
                </tr>
              )}
              {timeframe === 'weekly' && (
                <tr>
                  <th>交易週別</th>
                  <th style={{ textAlign: 'right' }}>開盤價</th>
                  <th style={{ textAlign: 'right' }}>最高價</th>
                  <th style={{ textAlign: 'right' }}>最低價</th>
                  <th style={{ textAlign: 'right' }}>收盤價</th>
                  <th style={{ textAlign: 'right' }}>每週價差</th>
                  <th style={{ textAlign: 'right' }}>高低振幅</th>
                  <th style={{ textAlign: 'right' }}>週 10MA</th>
                  <th style={{ textAlign: 'right' }}>週 20MA</th>
                  <th style={{ textAlign: 'center' }}>警示狀態</th>
                </tr>
              )}
              {timeframe === 'monthly' && (
                <tr>
                  <th>交易月份</th>
                  <th style={{ textAlign: 'right' }}>開盤價</th>
                  <th style={{ textAlign: 'right' }}>最高價</th>
                  <th style={{ textAlign: 'right' }}>最低價</th>
                  <th style={{ textAlign: 'right' }}>收盤價</th>
                  <th style={{ textAlign: 'right' }}>每月波段價差</th>
                  <th style={{ textAlign: 'right' }}>高低振幅</th>
                  <th style={{ textAlign: 'right' }}>月 6MA</th>
                  <th style={{ textAlign: 'right' }}>月 12MA</th>
                  <th style={{ textAlign: 'center' }}>警示狀態</th>
                </tr>
              )}
            </thead>
            <tbody>
              {[...rawHistory].reverse().map((day) => {
                const diff = day.high - day.low;
                const amp = day.low > 0 ? (diff / day.low) * 100 : 0;
                
                if (timeframe === 'daily') {
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
                        {day.ma5 > 0 ? `$${day.ma5.toFixed(2)}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                        {day.ma10 > 0 ? `$${day.ma10.toFixed(2)}` : '-'}
                      </td>
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
                } else if (timeframe === 'weekly') {
                  const dayBreachedDefense = day.close < stock.prev_week_low && stock.prev_week_low > 0;
                  const dayBreachedLife = day.close < day.ma20 && day.ma20 > 0;

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
                        {day.ma10 > 0 ? `$${day.ma10.toFixed(2)}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                        {day.ma20 > 0 ? `$${day.ma20.toFixed(2)}` : '-'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={badgeClass}>{rowStatus}</span>
                      </td>
                    </tr>
                  );
                } else {
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
                        {day.ma6 > 0 ? `$${day.ma6.toFixed(2)}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                        {day.ma12 > 0 ? `$${day.ma12.toFixed(2)}` : '-'}
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>-</td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
