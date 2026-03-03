// ==========================================
// 設定區域
// ==========================================
const SHEET_BASE = "https://opensheet.elk.sh/1EdjiH8Itg6wNBf4MS9IlT-j5yYkFqR3uqo0Toic28N8/";
const SWITCH_INTERVAL = 10000; // 每一頁停留 10 秒 (毫秒)

// 定義輪播清單 (對應你的 Google Sheet 分頁名稱 與顯示名稱)
const CAROUSEL_LIST = [
    { sheet: "七大項總錦標", title: "🏆 七大項總錦標 🏆" },
    { sheet: "第一組分數計算", title: "G1 - 培根行動 (專注力)" },
    { sheet: "第二組分數計算", title: "G2 - PECOPECO (反應力)" },
    { sheet: "第三組分數計算", title: "G3 - SOS.SOS (敏捷力)" },
    { sheet: "第四組分數計算", title: "G4 - 流汗吧！健美詠者 (耐力)" },
    { sheet: "第五組分數計算", title: "G5 - 企色戰隊 (專注力)" },
    { sheet: "第六組分數計算", title: "G6 - 不是．鴿們 (智力)" },
    { sheet: "第七組分數計算", title: "G7 - 老娘不幹了 (爆發力)" },
    { sheet: "第八組分數計算", title: "G8 - 賽馬郎 (敏捷力)" },
    { sheet: "第九組分數計算", title: "G9 - 溫水煮青蛙 (智力)" },
    { sheet: "第十組分數計算", title: "G10 - 超派拍對 (反應力)" },
    { sheet: "第十一組分數計算", title: "G11 - 翻身 (敏捷力)" },
    { sheet: "第十二組分數計算", title: "G12 - hurry down (協調力)" },
    { sheet: "第十三組分數計算", title: "G13 - 重生之我在神界當牛馬 (耐力)" },
    { sheet: "第十四組分數計算", title: "G14 - Baa Hind the Door (專注力)" },
    { sheet: "第十五組分數計算", title: "G15 - Legend of the rower (爆發力)" },
    { sheet: "第十六組分數計算", title: "G16 - Legend of MUAY THAI (協調力)" },
    { sheet: "第十七組分數計算", title: "G17 - THE STONE FLOWER (智力)" }
];

// ==========================================
// 變數與 DOM
// ==========================================
let currentIndex = 0;
let timer = null;
const domTitle = document.getElementById('current-category-title');
const domList = document.getElementById('leaderboard-data');
const domProgressBar = document.getElementById('progress-bar');

// ==========================================
// 核心功能
// ==========================================

// 1. 初始化
function init() {
    loadCategory(currentIndex); // 立即載入第一頁
    startTimer();
}

// 2. 啟動計時器與進度條
function startTimer() {
    // 重置進度條動畫
    domProgressBar.style.transition = 'none';
    domProgressBar.style.width = '0%';
    
    // 強制重繪 (Reflow) 以重啟 CSS 動畫
    void domProgressBar.offsetWidth; 

    // 設定進度條動畫時間
    domProgressBar.style.transition = `width ${SWITCH_INTERVAL}ms linear`;
    domProgressBar.style.width = '100%';

    // 設定定時切換
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        nextCategory();
    }, SWITCH_INTERVAL);
}

// 3. 切換到下一組
function nextCategory() {
    currentIndex++;
    if (currentIndex >= CAROUSEL_LIST.length) {
        currentIndex = 0; // 循環回到第一個
    }
    loadCategory(currentIndex);
    
    // 重啟進度條
    domProgressBar.style.transition = 'none';
    domProgressBar.style.width = '0%';
    setTimeout(() => {
        domProgressBar.style.transition = `width ${SWITCH_INTERVAL}ms linear`;
        domProgressBar.style.width = '100%';
    }, 50);
}

// 4. 載入並渲染資料
async function loadCategory(index) {
    const target = CAROUSEL_LIST[index];
    
    // 更新標題
    domTitle.innerText = target.title;
    
    // 顯示載入中
    // 技巧：只有第一次載入或是資料差異很大時才清空，避免閃爍太嚴重
    // 這裡為了視覺效果，我們稍微清空一下並淡入
    domList.style.opacity = '0.5';

    try {
        // 加時間戳記防止快取
        const res = await fetch(`${SHEET_BASE}${encodeURIComponent(target.sheet)}`, {
    cache: 'no-cache'
});
        if (!res.ok) throw new Error("API Error");
        
        const rawData = await res.json();
        
        // 資料過濾：確保有名字或編號
        const data = rawData.filter(p => {
            const name = p.姓名 || p.Name;
            const number = p.編號 || p.玩家號碼;
            return (name && name.trim() !== "") || (number && number.toString().trim() !== "");
        });

        renderList(data, target.sheet);

    } catch (err) {
        console.error(err);
        domList.innerHTML = `<div class="status-msg">⚠️ 資料讀取失敗，請檢查網路</div>`;
    } finally {
        domList.style.opacity = '1';
        domList.style.transition = 'opacity 0.3s';
    }
}

// 5. 渲染 HTML 列表
function renderList(data, sheetName) {
    if (!data || data.length === 0) {
        domList.innerHTML = `<div class="status-msg">目前尚無參賽資料</div>`;
        return;
    }

    // 取前 20 名
    const sorted = data.slice(0, 20);
    
    // 判斷是「總積分」還是「單項分數」
    // 總積分通常要小數點，單項如果是整數就顯示整數
    let lastScore = null, lastRank = 0, actualRank = 0;

    const htmlString = sorted.map((p, i) => {
        actualRank++;
        
        const pName = p.姓名 || p.Name || "-";
        const pNumber = p.編號 || p.玩家號碼 || "未知";
        
        let rawScore = p.分數 !== undefined ? Number(p.分數) : 0;
        if (isNaN(rawScore)) rawScore = 0;
        
        // 顯示格式：如果是整數就不要 .00
        let pScoreDisplay = Number.isInteger(rawScore) ? rawScore : rawScore.toFixed(2);

        // 同分同名次邏輯
        let rank = (rawScore === lastScore) ? lastRank : actualRank;
        
        if (rawScore !== lastScore) {
            lastRank = rank;
            lastScore = rawScore;
        }

        // ==========================================
        // 🔥 修改這裡：根據排名決定要加什麼 Class
        // ==========================================
        let rankClass = "";
        if (rank === 1) {
            rankClass = "rank-1";
        } else if (rank === 2) {
            rankClass = "rank-2";
        } else if (rank === 3) {
            rankClass = "rank-3";
        }

        const delay = i * 0.05;

        // 🔥 修改這裡：把 ${rankClass} 加到 class="..." 裡面
        return `
            <div class="lb-player ${rankClass}" style="animation-delay: ${delay}s">
                <span class="lb-rank-num">#${rank}</span>
                <span class="lb-player-name">${pName}</span>
                <span class="lb-player-num">${pNumber}</span>
                <span class="lb-player-score">${pScoreDisplay}</span>
            </div>
        `;
    }).join("");

    domList.innerHTML = htmlString;
}

// ==========================================
// 啟動
// ==========================================
window.addEventListener('load', init);