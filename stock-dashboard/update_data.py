import os
import json
import datetime
import yfinance as yf
import pandas as pd

# Load stocks dynamically from public/stocks.json if available
base_dir = os.path.dirname(__file__)
stocks_json_path = os.path.join(base_dir, "public", "stocks.json")
if os.path.exists(stocks_json_path):
    with open(stocks_json_path, "r", encoding="utf-8") as f:
        STOCKS = json.load(f)
else:
    STOCKS = {
        "2610.TW": {"name": "華航", "shares": 1000},
        "5271.TWO": {"name": "紘通", "shares": 2000},
        "6116.TW": {"name": "彩晶", "shares": 2000},
        "8299.TWO": {"name": "群聯", "shares": 30},
        "2002.TW": {"name": "中鋼", "shares": 1000},
        "2337.TW": {"name": "旺宏", "shares": 1000},
        "1714.TW": {"name": "和桐", "shares": 0},
    }

def get_status(close_val, prev_week_low, weekly_ma20):
    if close_val == 0:
        return "無數據"
    elif close_val < prev_week_low and prev_week_low > 0:
        return "跌破防守"
    elif close_val < weekly_ma20 and weekly_ma20 > 0:
        return "跌破生命線"
    else:
        return "安全續抱"

def process_stocks():
    print("開始下載與處理股票數據...")
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=1100)
    
    output_data = {
        "updateTime": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "stocks": {}
    }
    
    for ticker, info in STOCKS.items():
        try:
            print(f"下載 {info['name']} ({ticker})...")
            t = yf.Ticker(ticker)
            df = t.history(start=start_date.isoformat(), end=end_date.isoformat())
            if df.empty:
                df = t.history(period="3y")
                
            if df.empty:
                print(f"警告: {ticker} 無法取得數據")
                continue
                
            # Clean up NaNs
            df = df.dropna(subset=['Open', 'High', 'Low', 'Close'])
            
            # Calculate Daily 100MA
            df['MA100'] = df['Close'].rolling(window=100).mean()
            
            # Calculate Weekly 20MA
            weekly_df = df.resample('W-FRI').last().ffill()
            weekly_df['Weekly_MA20'] = weekly_df['Close'].rolling(window=20).mean()
            
            df_yw = df.index.isocalendar()
            w_yw = weekly_df.index.isocalendar()
            df['yw'] = df_yw.year * 100 + df_yw.week
            weekly_df['yw'] = w_yw.year * 100 + w_yw.week
            ma_map = weekly_df.set_index('yw')['Weekly_MA20']
            df['Weekly_MA20'] = df['yw'].map(ma_map)
            
            # Calculate previous week's low (low of the week before the latest date's week)
            wl = df['Low'].resample('W-FRI').min()
            latest_dt = df.index[-1]
            latest_yw = latest_dt.isocalendar().year * 100 + latest_dt.isocalendar().week
            wl_before = wl[wl.index.isocalendar().year * 100 + wl.index.isocalendar().week < latest_yw]
            prev_week_low = float(wl_before.iloc[-1]) if not wl_before.empty else 0.0
            
            # Get latest values
            latest_row = df.iloc[-1]
            close_val = float(latest_row['Close'])
            prev_close_val = float(df['Close'].iloc[-2]) if len(df) >= 2 else close_val
            weekly_ma20 = float(latest_row['Weekly_MA20']) if latest_row['Weekly_MA20'] == latest_row['Weekly_MA20'] else 0.0
            
            status = get_status(close_val, prev_week_low, weekly_ma20)
            
            # Compile last 40 days history for chart
            history_list = []
            df_40 = df.tail(40)
            for dt, row in df_40.iterrows():
                ma100_val = float(row['MA100']) if row['MA100'] == row['MA100'] else None
                ma20_val = float(row['Weekly_MA20']) if row['Weekly_MA20'] == row['Weekly_MA20'] else None
                
                history_list.append({
                    "date": dt.strftime("%Y-%m-%d"),
                    "open": float(row['Open']),
                    "high": float(row['High']),
                    "low": float(row['Low']),
                    "close": float(row['Close']),
                    "volume": int(row['Volume']),
                    "ma100": ma100_val,
                    "weekly_ma20": ma20_val
                })

            # Calculate Monthly K-lines
            try:
                monthly_df = df.resample('ME').agg({
                    'Open': 'first',
                    'High': 'max',
                    'Low': 'min',
                    'Close': 'last',
                    'Volume': 'sum'
                }).dropna()
            except ValueError:
                monthly_df = df.resample('M').agg({
                    'Open': 'first',
                    'High': 'max',
                    'Low': 'min',
                    'Close': 'last',
                    'Volume': 'sum'
                }).dropna()

            # Calculate Monthly MAs
            monthly_df['MA6'] = monthly_df['Close'].rolling(window=6).mean()
            monthly_df['MA12'] = monthly_df['Close'].rolling(window=12).mean()

            history_monthly = []
            monthly_df_tail = monthly_df.tail(24) # Last 24 months
            for dt, row in monthly_df_tail.iterrows():
                ma6_val = float(row['MA6']) if row['MA6'] == row['MA6'] else None
                ma12_val = float(row['MA12']) if row['MA12'] == row['MA12'] else None
                
                history_monthly.append({
                    "date": dt.strftime("%Y-%m"),
                    "open": float(row['Open']),
                    "high": float(row['High']),
                    "low": float(row['Low']),
                    "close": float(row['Close']),
                    "volume": int(row['Volume']),
                    "ma6": ma6_val,
                    "ma12": ma12_val
                })
                
            output_data["stocks"][ticker] = {
                "name": info["name"],
                "ticker": ticker,
                "shares": info["shares"],
                "close": close_val,
                "prev_close": prev_close_val,
                "weekly_ma20": weekly_ma20,
                "prev_week_low": prev_week_low,
                "status": status,
                "history": history_list,
                "history_monthly": history_monthly
            }
            
        except Exception as e:
            print(f"處理 {ticker} 失敗: {e}")
            
    # Write to public/data.json
    output_dir = os.path.join(os.path.dirname(__file__), "public")
    os.makedirs(output_dir, exist_ok=True)
    json_path = os.path.join(output_dir, "data.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
        
    print(f"數據已匯出至: {json_path}")

if __name__ == "__main__":
    process_stocks()
