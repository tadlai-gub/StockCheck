# 📈 台股波段監控儀表板 & 報表系統 (StockCheck)

本專案是一個整合式的台股持股波段監控系統，包含：
1. **互動式網頁儀表板 (React Web Dashboard)**：提供日線、週線、月線 K 線與多種均線趨勢對比，並在跌破防守線時發出視覺警示。
2. **Excel 日報表自動發送系統 (Excel Report)**：每日自動下載最新收盤價，計算波段價差與防守線，並透過 MacOS 內建 Mail 自動寄送 Excel 報表至 iCloud 信箱。

---

## 📂 專案目錄結構

```text
Proj-StockCheck/
├── .github/workflows/deploy.yml   # GitHub Actions 自動部署工作流
├── stock-dashboard/               # React 網頁儀表板原始碼
│   ├── public/                    # 靜態資源 (含 stocks.json, data.json)
│   └── src/                       # React 組件 (包含主視窗、個股細節、設定頁)
├── generate_report.py             # Python 報表與郵件發送腳本
├── requirements.txt               # Python 依賴清單
├── run_dashboard.sh               # 本機啟動與數據更新一鍵腳本
└── venv/                          # 本地 Python 虛擬環境 (Git 略過)
```

---

## 💻 本機執行做法 (Local Commands)

### 1. 環境初始化 (僅需執行一次)

在專案目錄下配置 Python 虛擬環境與安裝 React 依賴套件：

```bash
# 切換至專案資料夾
cd /Users/tadlai/Documents/Work/Antigravity/Proj-StockCheck

# 建立並啟用 Python 虛擬環境，安裝相依套件
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 安裝 React 網頁端依賴套件
cd stock-dashboard
npm install
```

### 2. 啟動本機儀表板 (一鍵執行)

我們為您準備了 `run_dashboard.sh` 腳本，會**自動下載最新股價更新 `data.json`**，並**啟動本機開發伺服器**自動在瀏覽器中打開網站：

```bash
cd /Users/tadlai/Documents/Work/Antigravity/Proj-StockCheck
chmod +x run_dashboard.sh   # 第一次執行需賦予執行權限
./run_dashboard.sh
```

> **手動分步執行指令**：
> - **單獨更新數據檔**：
>   ```bash
>   ./venv/bin/python stock-dashboard/update_data.py
>   ```
> - **單獨啟動網頁開發伺服器**：
>   ```bash
>   cd stock-dashboard
>   npm run dev
>   ```

### 3. 生成並發送 Excel 報表

本機執行此腳本後，會自動在 `/Users/tadlai/Documents/Work/Antigravity` 目錄生成最新的 Excel 報表，並會透過 MacOS 的 Mail.app 自動呼叫寄送至您的 Apple iCloud 信箱：

```bash
cd /Users/tadlai/Documents/Work/Antigravity/Proj-StockCheck
./venv/bin/python generate_report.py
```

---

## 🌐 線上部署與更新做法 (Online Deployment Commands)

網站已設定透過 GitHub Pages 免費託管。

### 1. 推送本地代碼修改至 GitHub

當您在本機修改了股票清單（`stocks.json`）或是網頁功能時，請執行以下指令將代碼同步至 GitHub：

```bash
# 進入專案資料夾
cd /Users/tadlai/Documents/Work/Antigravity/Proj-StockCheck

# 查看狀態，暫存並提交
git status
git add .
git commit -m "feat: 更新功能描述"

# 推送到遠端 main 分支 (密碼請使用 GitHub 權杖 PAT)
git push origin main
```

### 2. 線上自動化定期更新 (GitHub Actions)

本專案配置了 GitHub Actions 工作流，會在**每個工作日晚上 22:30 (台灣時間)** 自動在雲端執行以下任務：
1. 下載最新股價並更新 `data.json`。
2. 自動打包 React 網站。
3. 自動將網站發布至 `gh-pages` 分支，更新線上儀表板。

### 3. 手動觸發線上數據更新

除了排程更新之外，您也可以透過以下兩種方式即時更新線上數據：
- **網頁端更新**：在您部署好的網頁儀表板上，切換至 **「設定 (Settings)」** 分頁，輸入您的 **GitHub 個人存取權杖 (PAT)**，即可直接在瀏覽器上點選 **「手動更新數據」**。
- **GitHub 頁面更新**：進入儲存庫網頁 `https://github.com/tadlai-gub/StockCheck` -> 點選 **Actions** -> 選擇 **Deploy React Dashboard** 工作流 -> 點選 **Run workflow** 手動觸發部署。
