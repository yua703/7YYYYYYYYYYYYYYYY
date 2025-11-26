// ==========================================
// 1. 底部導覽列切換 (Bottom Navigation)
// ==========================================
const navButtons = document.querySelectorAll('.bottom-nav .nav-btn');
const pages = document.querySelectorAll('.page-view');

// 排行榜的自動更新計時器
let leaderboardInterval = null;

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // 1. UI 狀態更新
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // 2. 頁面切換
        pages.forEach(page => page.classList.remove('active'));
        const targetId = btn.dataset.view;
        const targetPage = document.getElementById(targetId);
        if (targetPage) targetPage.classList.add('active');

        // 3. 排行榜自動更新邏輯
        if (targetId === 'view-leaderboard') {
            startLeaderboardUpdate();
        } else {
            stopLeaderboardUpdate();
        }
    });
});


// ==========================================
// 2. 賽事細節分頁 (競賽規章/時程表/計分/地圖)
// ==========================================
const detailBtns = document.querySelectorAll('.detail-tab-btn');
// 這裡很重要：我們抓取所有 class 為 detail-content 的區塊
const detailContents = document.querySelectorAll('.detail-content');

detailBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // 1. 移除按鈕 active
        detailBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // 2. 隱藏所有內容區塊
        detailContents.forEach(content => content.classList.remove('active'));

        // 3. 顯示目標區塊
        const targetId = btn.dataset.target;
        const targetDiv = document.getElementById(targetId);
        if (targetDiv) {
            targetDiv.classList.add('active');
        } else {
            console.error("找不到 ID 為 " + targetId + " 的區塊，請檢查 HTML ID");
        }
    });
});


// ==========================================
// 3. 七大項目自動輪播 (Carousel)
// ==========================================
const carousel = document.getElementById('events-carousel');
let autoScroll;

function startCarousel() {
    autoScroll = setInterval(() => {
        // 如果滑到最右邊，就回到最左邊
        if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 10) {
            carousel.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            carousel.scrollBy({ left: 180, behavior: 'smooth' });
        }
    }, 2500); // 每 2.5 秒滑動一次
}

// 用戶觸碰時暫停輪播，提升體驗
if(carousel) {
    carousel.addEventListener('touchstart', () => clearInterval(autoScroll));
    carousel.addEventListener('touchend', () => startCarousel()); // 手放開後繼續
    startCarousel(); // 啟動
}


// ==========================================
// 4. 排行榜功能 (Leaderboard)
// ==========================================
const sheetBase = "https://opensheet.elk.sh/1EdjiH8Itg6wNBf4MS9IlT-j5yYkFqR3uqo0Toic28N8/";
let currentSheet = "七大項總錦標"; 

const lbTabs = document.querySelectorAll('#leaderboard-tabs-container .lb-tab');

lbTabs.forEach(btn => {
    btn.addEventListener('click', () => {
        lbTabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSheet = btn.dataset.sheet;
        
        // 切換時顯示載入中
        document.getElementById('leaderboard-data').innerHTML = '<p style="text-align:center; padding:20px; color:#666;">資料更新中...</p>';
        updateLeaderboard(currentSheet);
        
        // 確保選中的按鈕滾動到可視範圍
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
});

async function updateLeaderboard(sheetName) {
    const container = document.getElementById('leaderboard-data');
    try {
        const res = await fetch(sheetBase + encodeURIComponent(sheetName) + "?t=" + Date.now());
        
        if (!res.ok) throw new Error("網路回應錯誤");
        
        const data = await res.json();
        
        if (!data || data.length === 0) {
            container.innerHTML = "<p style='text-align:center; padding:20px;'>目前尚無資料</p>";
            return;
        }

        const sorted = data.slice(0, 15);
        const scoreTitle = (sheetName.includes("總錦標")) ? "總積分" : "分數";

        let lastScore = null, lastRank = 0, actualRank = 0;

        const listHtml = sorted.map((p) => {
            actualRank++;
            
            const pName = p.姓名 || p.Name || "-"; 
            const pNumber = p.編號 || p.玩家號碼 || "未知";
            
            // 🔥 關鍵修改：如果有分數，四捨五入到小數點第 2 位
            let rawScore = p.分數 !== undefined ? Number(p.分數) : 0;
            // 如果不是數字(例如 NaN)，就顯示 0
            if (isNaN(rawScore)) rawScore = 0;
            
            // 使用 toFixed(2) 固定顯示兩位小數，例如 68320.00 或 982.20
            // 如果你不想要 .00，可以用 Math.round(rawScore * 100) / 100
            let pScore = Number.isInteger(rawScore) ? rawScore : rawScore.toFixed(2);

            let rank = (rawScore === lastScore) ? lastRank : actualRank;

            if (rawScore !== lastScore) {
                lastRank = rank;
                lastScore = rawScore;
            }
            
            return `
            <div class="lb-player">
                <span class="lb-rank">#${rank}</span>
                <span class="lb-name">${pName}</span>
                <span class="lb-number">${pNumber}</span>
                <span class="lb-score">${pScore}</span>
            </div>`;
        }).join("");

        container.innerHTML = `
            <div class="lb-header">
                <span class="lb-rank">排名</span>
                <span class="lb-name">姓名</span>
                <span class="lb-number">號碼</span>
                <span class="lb-score">${scoreTitle}</span>
            </div>
            ${listHtml}
        `;
    } catch (err) {
        console.error(err);
        container.innerHTML = "<p style='text-align:center; padding:20px; color:red;'>讀取失敗，請檢查網路或試算表</p>";
    }
}

function startLeaderboardUpdate() {
    updateLeaderboard(currentSheet);
    if (!leaderboardInterval) {
        leaderboardInterval = setInterval(() => updateLeaderboard(currentSheet), 5000);
        console.log("排行榜監聽中...");
    }
}

function stopLeaderboardUpdate() {
    if (leaderboardInterval) {
        clearInterval(leaderboardInterval);
        leaderboardInterval = null;
        console.log("排行榜監聽暫停");
    }
}
// ==========================================
// 5. 組別展開功能 (底部按鈕版)
// ==========================================
const groupCards = document.querySelectorAll('.group-card');

function closeAllCards() {
    groupCards.forEach(c => c.classList.remove('active'));
    document.body.classList.remove('lock-scroll');
}

groupCards.forEach(card => {
    // 1. 卡片本身的點擊 (展開用)
    card.addEventListener('click', (e) => {
        // 如果點到的是底部關閉區，不執行這裡 (交給下面處理)
        if (e.target.closest('.close-bottom-area')) return;

        const isAlreadyActive = card.classList.contains('active');

        if (isAlreadyActive) {
            // 如果已經開著，就不用做事(讓使用者點下方按鈕關閉)，或是你想點擊任意處關閉也可以
            // 這裡保留點擊任意處不關閉，強迫使用下方按鈕 (體驗比較明確)
        } else {
            closeAllCards();
            card.classList.add('active');
            document.body.classList.add('lock-scroll');
        }
    });

    // 2. 監聽「底部關閉區域」的點擊
    const closeBtn = card.querySelector('.close-bottom-area');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 避免觸發卡片點擊
            closeAllCards();     // 執行關閉
        });
    }
});