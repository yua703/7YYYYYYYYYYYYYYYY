// ==========================================
// 設定區域
// ==========================================
const SHEET_BASE = "https://opensheet.elk.sh/1LcyVXV8zbzgebO96VmfwnsgnVseZMHh7MY9qBxJmjgQ/";
const SWITCH_INTERVAL = 10000; // 每一頁停留 10 秒

// 定義輪播清單 (2.1 專屬展出名單)
const CAROUSEL_LIST = [
    { sheet: "七大項總錦標", title: "七大項總錦標" },
    { sheet: "第一組分數計算", title: "G1 - 培根行動 (協調力)" },
    { sheet: "第二組分數計算", title: "G2 - PECOPECO (反應力)" },
    { sheet: "第四組分數計算", title: "G4 - 流汗吧！健美詠者 (耐力)" },
    { sheet: "第七組分數計算", title: "G7 - 老娘不幹了 (爆發力)" },
    { sheet: "第九組分數計算", title: "G9 - 溫水煮青蛙 (智力)" },
    { sheet: "第十一組分數計算", title: "G11 - 翻身 (敏捷力)" },
    { sheet: "第十四組分數計算", title: "G14 - Baa Hind the Door (專注力)" }
];
// ==========================================
// 變數與 DOM
// ==========================================
let currentIndex = 0; // 🌟 現在每次會跳 2 步 (0, 2, 4...)
let timer = null;
const domTitle = document.getElementById('current-category-title');
const domList = document.getElementById('leaderboard-data');
const domProgressBar = document.getElementById('progress-bar');

// ==========================================
// 核心功能
// ==========================================

// ==========================================
// 核心功能 (單欄滿版重構)
// ==========================================

// 1. 初始化
function init() {
    currentIndex = 0;
    loadCategory(currentIndex); // 載入第一組
    startLeaderboardTimer();    
}

// 2. 啟動排行榜的計時與進度條
function startLeaderboardTimer() {
    domProgressBar.style.transition = 'none';
    domProgressBar.style.width = '0%';
    void domProgressBar.offsetWidth; 
    domProgressBar.style.transition = `width ${SWITCH_INTERVAL}ms linear`;
    domProgressBar.style.width = '100%';

    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        nextCategory(); 
    }, SWITCH_INTERVAL);
}

// 3. 切換到下一組排行榜
function nextCategory() {
    currentIndex++; // 一次跳 1 步
    
    // 播完回到第 0 筆
    if (currentIndex >= CAROUSEL_LIST.length) {
        currentIndex = 0; 
    }

    loadCategory(currentIndex);
    
    // 重置進度條
    domProgressBar.style.transition = 'none';
    domProgressBar.style.width = '0%';
    setTimeout(() => {
        domProgressBar.style.transition = `width ${SWITCH_INTERVAL}ms linear`;
        domProgressBar.style.width = '100%';
    }, 50);
}

// 4. 資料過濾
function filterData(rawData) {
    return rawData.filter(p => {
        const name = p.姓名 || p.Name;
        const number = p.UID || p.玩家號碼;
        return (name && name.trim() !== "") || (number && number.toString().trim() !== "");
    });
}

// 5. 抓取單張表的資料
async function loadCategory(index) {
    const target = CAROUSEL_LIST[index];
    
    // 直接把該組的標題放到畫面上方的總標題位置
    domTitle.innerText = target.title;
    domList.style.opacity = '0.3';

    try {
        const res = await fetch(`${SHEET_BASE}${encodeURIComponent(target.sheet)}`, { cache: 'no-cache' });
        if(!res.ok) throw new Error("API Error");

        const rawData = await res.json();
        const data = filterData(rawData);

        // 渲染單欄畫面
        renderSingleList(data, target);

    } catch (err) {
        console.error(err);
        domList.innerHTML = `<div class="status-msg">⚠️ 資料讀取失敗，請檢查網路</div>`;
    } finally {
        domList.style.opacity = '1';
        domList.style.transition = 'opacity 0.3s';
    }
}

// 6. 生成玩家列表 HTML
function generatePlayerHtml(data) {
    if (!data || data.length === 0) return `<div class="status-msg">目前尚無參賽資料</div>`;
    
    // 單欄空間較大，可以顯示前 10 名 (依需求可改回 7)
    const sorted = data.slice(0, 10); 
    let lastScore = null, lastRank = 0, actualRank = 0;

    return sorted.map((p, i) => {
        actualRank++;
        const pName = p.姓名 || p.Name || "-";
        let rawUid = (p.UID || "").toString();

        const pNumber = rawUid.length >= 4 
            ? rawUid.slice(-4) 
            : (rawUid || "未知");
        
        let rawScore = p.分數 !== undefined ? Number(p.分數) : 0;
        if (isNaN(rawScore)) rawScore = 0;
        let pScoreDisplay = Number.isInteger(rawScore) ? rawScore : rawScore.toFixed(2);

        let rank = (rawScore === lastScore) ? lastRank : actualRank;
        if (rawScore !== lastScore) {
            lastRank = rank;
            lastScore = rawScore;
        }

        let rankClass = "";
        if (rank === 1) rankClass = "rank-1";
        else if (rank === 2) rankClass = "rank-2";
        else if (rank === 3) rankClass = "rank-3";

        const delay = i * 0.03;

        return `
            <div class="lb-player ${rankClass}" style="animation-delay: ${delay}s">
                <span class="lb-rank-num">#${rank}</span>
                <span class="lb-player-name">${pName}</span>
                <span class="lb-player-num">${pNumber}</span>
                <span class="lb-player-score">${pScoreDisplay}</span>
            </div>
        `;
    }).join("");
}

// 7. 渲染單欄列表
function renderSingleList(data, target) {
    const listHtml = generatePlayerHtml(data);
    const scoreTitle = target.sheet.includes("總錦標") ? "總積分" : "分數";
    
    // 移除不必要的 inline style，全權交給 CSS 處理
    domList.innerHTML = `
        <div class="lb-list-header">
            <span class="col-rank">排名</span>
            <span class="col-name">暱稱</span>
            <span class="col-number">編號</span>
            <span class="col-score">${scoreTitle}</span>
        </div>
        <div class="lb-col-body">${listHtml}</div>
    `;
}

// 啟動
window.addEventListener('load', init);