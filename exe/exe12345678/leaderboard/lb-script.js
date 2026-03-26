// ==========================================
// 設定區域
// ==========================================
const SHEET_BASE = "https://opensheet.elk.sh/1jKqaT0NjIkqmguzRaNXV5KVFkXXOwmOE_Gt9Q9jFJJQ/";
const SWITCH_INTERVAL = 10000; // 每一頁停留 10 秒

// 定義輪播清單 (總共 18 個項目)
const CAROUSEL_LIST = [
    { sheet: "七大項總錦標", title: "七大項總錦標" },
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
let currentIndex = 0; // 🌟 現在每次會跳 2 步 (0, 2, 4...)
let timer = null;
const domTitle = document.getElementById('current-category-title');
const domList = document.getElementById('leaderboard-data');
const domProgressBar = document.getElementById('progress-bar');

// ==========================================
// 核心功能
// ==========================================

// 1. 初始化
function init() {
    showKeyVisual(); // 🌟 程式一啟動，先秀出主視覺！
}

// 2. 顯示主視覺畫面 (停留 SWITCH_INTERVAL 後，自動進入排行榜)
function showKeyVisual() {
    const kvScreen = document.getElementById('key-visual-screen');
    const kvProgressBar = document.getElementById('kv-progress-bar');
    
    kvScreen.classList.add('active'); // 淡入顯示主視覺
    
    // 重置主視覺專屬的進度條
    if(kvProgressBar) {
        kvProgressBar.style.transition = 'none';
        kvProgressBar.style.width = '0%';
        void kvProgressBar.offsetWidth;
        kvProgressBar.style.transition = `width ${SWITCH_INTERVAL}ms linear`;
        kvProgressBar.style.width = '100%';
    }

    // 🌟 在背後偷偷先載入第一組排行榜資料，這樣等一下過場才不會有白畫面
    currentIndex = 0;
    loadCategoryPair(currentIndex);

    // 設定定時器：時間到就隱藏主視覺，開始播排行榜
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        kvScreen.classList.remove('active'); // 淡出隱藏主視覺
        startLeaderboardTimer();             // 啟動排行榜的輪播
    }, SWITCH_INTERVAL);
}

// 3. 啟動排行榜的計時與進度條
function startLeaderboardTimer() {
    domProgressBar.style.transition = 'none';
    domProgressBar.style.width = '0%';
    void domProgressBar.offsetWidth; 
    domProgressBar.style.transition = `width ${SWITCH_INTERVAL}ms linear`;
    domProgressBar.style.width = '100%';

    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        nextCategoryPair(); // 翻到下一頁
    }, SWITCH_INTERVAL);
}

// 4. 切換到下一組排行榜
function nextCategoryPair() {
    currentIndex += 2;
    
    // 🌟 核心魔法：如果排行榜全部播完了怎麼辦？
    if (currentIndex >= CAROUSEL_LIST.length) {
        // 放回主視覺，開啟新的一輪！
        showKeyVisual();
        return; 
    }

    // 如果還沒播完，就繼續載入下一組
    loadCategoryPair(currentIndex);
    
    // 重置排行榜自己的進度條
    domProgressBar.style.transition = 'none';
    domProgressBar.style.width = '0%';
    setTimeout(() => {
        domProgressBar.style.transition = `width ${SWITCH_INTERVAL}ms linear`;
        domProgressBar.style.width = '100%';
    }, 50);
}

// 資料過濾小幫手
function filterData(rawData) {
    return rawData.filter(p => {
        const name = p.姓名 || p.Name;
        const number = p.編號 || p.玩家號碼;
        return (name && name.trim() !== "") || (number && number.toString().trim() !== "");
    });
}

// 🌟 同時抓取兩張表的資料
async function loadCategoryPair(index) {
    const target1 = CAROUSEL_LIST[index];
    // 如果是單數結尾，第二張表可能會空著
    const target2 = CAROUSEL_LIST[index + 1]; 
    
    // 把主標題固定為大會名稱
    domTitle.innerText = "ExErcise2.0 賽事即時戰況";
    domList.style.opacity = '0.3';

    try {
        // 同時發送兩個 API 請求，節省時間
        const promises = [fetch(`${SHEET_BASE}${encodeURIComponent(target1.sheet)}`, { cache: 'no-cache' })];
        if (target2) {
            promises.push(fetch(`${SHEET_BASE}${encodeURIComponent(target2.sheet)}`, { cache: 'no-cache' }));
        }

        const responses = await Promise.all(promises);
        for(let res of responses) {
            if(!res.ok) throw new Error("API Error");
        }

        // 解析資料
        const rawData1 = await responses[0].json();
        const data1 = filterData(rawData1);

        let data2 = [];
        if (target2) {
            const rawData2 = await responses[1].json();
            data2 = filterData(rawData2);
        }

        // 渲染雙欄畫面
        renderDualList(data1, target1, data2, target2);

    } catch (err) {
        console.error(err);
        domList.innerHTML = `<div class="status-msg">⚠️ 資料讀取失敗，請檢查網路</div>`;
    } finally {
        domList.style.opacity = '1';
        domList.style.transition = 'opacity 0.3s';
    }
}

// 🌟 生成「單獨一欄」裡的玩家列表 HTML
function generatePlayerHtml(data) {
    if (!data || data.length === 0) return `<div class="status-msg">目前尚無參賽資料</div>`;
    
    const sorted = data.slice(0, 7); // 左/右欄都只取前 10 名
    let lastScore = null, lastRank = 0, actualRank = 0;

    return sorted.map((p, i) => {
        actualRank++;
        const pName = p.姓名 || p.Name || "-";
        const pNumber = p.編號 || p.玩家號碼 || "未知";
        
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

// 🌟 將兩份資料組合成「左欄 + 右欄」
function renderDualList(data1, target1, data2, target2) {
    const col1Html = generatePlayerHtml(data1);
    const scoreTitle1 = target1.sheet.includes("總錦標") ? "總積分" : "分數";
    
    // 左邊欄位的完整 HTML (包含小標題)
    const headerHtml1 = `
        <div class="col-group-title">${target1.title}</div>
        <div class="lb-list-header" style="grid-template-columns: 60px 1fr 90px 90px; padding: 15px;">
            <span class="col-rank">排名</span>
            <span class="col-name">暱稱</span>
            <span class="col-number">編號</span>
            <span class="col-score">${scoreTitle1}</span>
        </div>
    `;

    let col2Content = "";
    // 如果有第二組資料才渲染右邊欄位
    if (target2) {
        const col2Html = generatePlayerHtml(data2);
        const scoreTitle2 = target2.sheet.includes("總錦標") ? "總積分" : "分數";
        col2Content = `
            <div class="col-group-title">${target2.title}</div>
            <div class="lb-list-header" style="grid-template-columns: 60px 1fr 90px 90px; padding: 15px;">
                <span class="col-rank">排名</span>
                <span class="col-name">暱稱</span>
                <span class="col-number">編號</span>
                <span class="col-score">${scoreTitle2}</span>
            </div>
            <div class="lb-col-body">${col2Html}</div>
        `;
    }

    // 塞入 DOM
    domList.innerHTML = `
        <div class="lb-dual-columns">
            <div class="lb-col">
                ${headerHtml1}
                <div class="lb-col-body">${col1Html}</div>
            </div>
            <div class="lb-col">
                ${col2Content}
            </div>
        </div>
    `;
}

// 啟動
window.addEventListener('load', init);