import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

const COLORS = {
  '2610.TW': '#3B82F6', // Blue
  '5271.TWO': '#8B5CF6', // Purple
  '6116.TW': '#06B6D4', // Cyan
  '8299.TWO': '#EC4899', // Pink
  '2002.TW': '#94A3B8', // Slate
  '2337.TW': '#EF4444', // Red
  '1714.TW': '#10B981', // Green
};

export default function VolatilityChart({ data }) {
  if (!data || !data.stocks) return <div style={{ padding: 20 }}>載入中...</div>;

  const stocksList = Object.values(data.stocks);

  // Get past 14 days dates (sorted chronologically)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

  // We want to pivot the data by date
  // Result: [{ date: '2026-06-24', '旺宏': 2.96, '華航': 1.25, ... }]
  const dateMap = {};

  stocksList.forEach(stock => {
    stock.history.forEach(day => {
      if (day.date >= twoWeeksAgoStr) {
        if (!dateMap[day.date]) {
          dateMap[day.date] = { date: day.date };
        }
        // Calculate amplitude percentage: (high - low) / low * 100
        const amp = day.low > 0 ? ((day.high - day.low) / day.low) * 100 : 0;
        dateMap[day.date][stock.name] = parseFloat(amp.toFixed(2));
      }
    });
  });

  const chartData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

  // Keep track of active lines (toggled via legend click)
  const [disabledStocks, setDisabledStocks] = useState({});

  const handleLegendClick = (e) => {
    const stockName = e.dataKey;
    setDisabledStocks(prev => ({
      ...prev,
      [stockName]: !prev[stockName]
    }));
  };

  return (
    <div className="glass-panel fade-in" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div className="stat-icon" style={{ color: 'var(--color-blue)', width: 40, height: 40, borderRadius: 8 }}>
          <Activity size={20} />
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600 }}>兩週個股振幅對比走勢</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            每日振幅 % = (最高價 - 最低價) / 最低價。今日焦點項目高亮。點選下方圖例可隱藏/顯示該個股線段。
          </p>
        </div>
      </div>

      <div style={{ width: '100%', height: 500 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              stroke="rgba(255,255,255,0.1)"
            />
            <YAxis 
              tickFormatter={(val) => `${val}%`}
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              stroke="rgba(255,255,255,0.1)"
            />
            <Tooltip 
              formatter={(value, name) => [`${value}%`, name]}
              contentStyle={{ 
                background: 'rgba(10, 15, 30, 0.9)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: 8,
                color: 'var(--text-primary)'
              }}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            />
            <Legend 
              onClick={handleLegendClick}
              wrapperStyle={{ paddingTop: 20, cursor: 'pointer', fontSize: '0.85rem' }}
              iconType="plainline"
            />
            
            {stocksList.map(stock => {
              const color = COLORS[stock.ticker] || '#3B82F6';
              const isDisabled = disabledStocks[stock.name];
              
              return (
                <Line
                  key={stock.ticker}
                  type="monotone"
                  dataKey={stock.name}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 4, stroke: color, strokeWidth: 1, fill: 'var(--bg-color)' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: color }}
                  hide={isDisabled}
                  connectNulls
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
