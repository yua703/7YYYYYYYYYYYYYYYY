// ==========================================
// 1. 底部導覽列切換 (Bottom Navigation)
// ==========================================
const navButtons = document.querySelectorAll('.bottom-nav .nav-btn');
const pages = document.querySelectorAll('.page-view');

// 排行榜的自動更新計時器變數
let leaderboardInterval = null;

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // 1. 移除所有按鈕的 active 狀態
        navButtons.forEach(b => b.classList.remove('active'));
        // 2. 幫當前點擊的按鈕加上 active
        btn.classList.add('active');

        // 3. 隱藏所有頁面
        pages.forEach(page => page.classList.remove('active'));
        
        // 4. 顯示目標頁面
        const targetId = btn.dataset.view;
        document.getElementById(targetId).classList.add('active');

        // 🔥 特別處理：如果是切換到「排行榜」，開啟自動更新；離開則關閉
        if (targetId === 'view-leaderboard') {
            startLeaderboardUpdate();
        } else {
            stopLeaderboardUpdate();
        }
    });
});


// ==========================================
// 2. 首頁：賽事細節分頁 (Details Tabs)
// ==========================================
const detailBtns = document.querySelectorAll('.detail-tab-btn');
const detailContents = document.querySelectorAll('.detail-content');

detailBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // 移除 active
        detailBtns.forEach(b => b.classList.remove('active'));
        detailContents.forEach(c => c.classList.remove('active'));

        // 加入 active
        btn.classList.add('active');
        const target = btn.dataset.target;
        document.getElementById(target).classList.add('active');
    });
});


// ==========================================
// 3. 首頁：七大項目自動輪播 (簡易版)
// ==========================================
const carousel = document.getElementById('events-carousel');
let autoScroll;

function startCarousel() {
    // 簡單的自動向右滑動
    autoScroll = setInterval(() => {
        if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth) {
            carousel.scrollLeft = 0; // 到底部滑回開頭
        } else {
            carousel.scrollLeft += 200; // 每次滑動距離
        }
    }, 3000); // 3秒動一次
}

// 當使用者觸碰時，停止自動輪播，避免干擾體驗
carousel.addEventListener('touchstart', () => clearInterval(autoScroll));
// 簡單啟動
startCarousel();


// ==========================================
// 4. 排行榜功能 (Leaderboard)
// ==========================================
const sheetBase = "https://opensheet.elk.sh/1EdjiH8Itg6wNBf4MS9IlT-j5yYkFqR3uqo0Toic28N8/";
let currentSheet = "七大項總錦標"; // 預設組別

// 處理排行榜組別切換
document.querySelectorAll('#leaderboard-tabs-container .lb-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.lb-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSheet = btn.dataset.sheet;
        updateLeaderboard(currentSheet); // 立即更新一次
    });
});

async function updateLeaderboard(sheetName) {
    const container = document.getElementById('leaderboard-data');
    try {
        // 加入時間戳記避免快取
        const res = await fetch(sheetBase + encodeURIComponent(sheetName) + "?t=" + Date.now());
        const data = await res.json();
        const sorted = data.slice(0, 10); // 取前10名
        const scoreTitle = (sheetName.includes("總錦標")) ? "總積分" : "分數";

        // 排名演算法
        let lastScore = null, lastRank = 0, actualRank = 0;

        const listHtml = sorted.map((p) => {
            actualRank++;
            let rank = (p.分數 === lastScore) ? lastRank : actualRank;
            if (p.分數 !== lastScore) {
                lastRank = rank;
                lastScore = p.分數;
            }
            
            return `
            <div class="lb-player">
                <div style="display:flex; align-items:center;">
                    <span class="lb-rank">#${rank}</span>
                    <span>${p.編號 || p.玩家號碼}</span>
                </div>
                <span style="font-weight:bold; color:#333;">${p.分數}</span>
            </div>`;
        }).join("");

        container.innerHTML = `
            <div class="lb-header">
                <span>排名 / 號碼</span>
                <span>${scoreTitle}</span>
            </div>
            ${listHtml}
        `;
    } catch (err) {
        console.error(err);
        container.innerHTML = "<p style='text-align:center; padding:20px;'>讀取失敗或試算表名稱錯誤</p>";
    }
}

// 控制更新開關的函式
function startLeaderboardUpdate() {
    updateLeaderboard(currentSheet); // 先跑一次
    if (!leaderboardInterval) {
        leaderboardInterval = setInterval(() => updateLeaderboard(currentSheet), 5000);
        console.log("排行榜自動更新: 啟動");
    }
}

function stopLeaderboardUpdate() {
    if (leaderboardInterval) {
        clearInterval(leaderboardInterval);
        leaderboardInterval = null;
        console.log("排行榜自動更新: 暫停");
    }
}