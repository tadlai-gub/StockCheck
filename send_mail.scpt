
    tell application "Mail"
        set newEmail to make new outgoing message with properties {subject:"股票股價高低區間日報表", content:"Tad,\n\n您好！附件為您所關注股票（華航、紘通、彩晶、群聯、中鋼、旺宏、和桐）的股價高低區間分析日報表。\n\n報表包含：\n1. 投資組合總覽（含最新市值及佔比餅圖）\n2. 合併歷史日數據（依日期排序）\n3. 個股歷史高低價差及振幅分析頁籤\n\n祝您投資順利！\n\n您的 AI 助理 Antigravity", visible:true}
        tell newEmail
            make new to recipient at end of to recipients with properties {address:"tad.lai@icloud.com"}
            make new attachment with properties {file name:(POSIX file "/Users/tadlai/Documents/Work/Antigravity/股票高低價差日報表.xlsx")} at after the last paragraph
            send
        end tell
    end tell
    