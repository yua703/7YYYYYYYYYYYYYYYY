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
// 2. 賽事細節分頁 (滑動背景 + 內容切換 修復版)
// ==========================================
const detailBtns = document.querySelectorAll('.detail-tab-btn');
const detailContents = document.querySelectorAll('.detail-content');
const tabIndicator = document.querySelector('.tab-indicator');

// 移動滑動塊的函式
function moveIndicator(targetBtn) {
    if (!targetBtn || !tabIndicator) return;

    // 1. 計算目標按鈕相對於父容器的位置
    const left = targetBtn.offsetLeft;
    const width = targetBtn.offsetWidth;

    // 2. 設定滑動塊的寬度與位置
    tabIndicator.style.width = `${width}px`;
    tabIndicator.style.transform = `translateX(${left}px)`; 
}

// 初始化：頁面載入時，把滑塊移到目前的 active 按鈕上
function initTabs() {
    const activeBtn = document.querySelector('.detail-tab-btn.active');
    if (activeBtn) {
        moveIndicator(activeBtn);
        
        // 確保對應的內容也是顯示的
        const targetId = activeBtn.dataset.target;
        const targetDiv = document.getElementById(targetId);
        if (targetDiv) {
            detailContents.forEach(c => c.classList.remove('active'));
            targetDiv.classList.add('active');
        }
    }
}

// 監聽視窗大小改變 (RWD)：重新計算位置，避免跑版
window.addEventListener('resize', () => {
    const activeBtn = document.querySelector('.detail-tab-btn.active');
    if (activeBtn) moveIndicator(activeBtn);
});

// 頁面載入完成後執行初始化
window.addEventListener('load', initTabs);

// 按鈕點擊事件
detailBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // 1. 按鈕狀態切換 (字體變色)
        detailBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // 2. 移動藍色背景塊 (解決卡頓關鍵)
        moveIndicator(btn);

        // 3. 內容切換 (解決內容不見的問題)
        // 先把所有內容藏起來
        detailContents.forEach(content => content.classList.remove('active'));
        
        // 再把目標內容顯示出來
        const targetId = btn.dataset.target;
        const targetDiv = document.getElementById(targetId);
        
        if (targetDiv) {
            targetDiv.classList.add('active');
        } else {
            console.error("找不到 ID 為 " + targetId + " 的區塊，請檢查 HTML");
        }
    });
});


// ==========================================
// 3. 七大項目無限絲滑輪播 (自動 + 手動拖曳版)
// ==========================================
const track = document.querySelector('.carousel-track');
const container = document.querySelector('.carousel-container');

if (track && container) {
    const items = Array.from(document.querySelectorAll('.carousel-item'));
    
    // 防呆：如果沒有項目就不執行
    if (items.length > 0) {
        const itemWidth = items[0].offsetWidth; 
        const gap = 15; // 請確保這跟 CSS 設定的 gap 一樣
        const singleSetWidth = (itemWidth + gap) * items.length; 

        // 1. 複製卡片 (為了讓拖曳時左右都有東西，建議複製 2 組)
        items.forEach(item => track.appendChild(item.cloneNode(true)));
        items.forEach(item => track.appendChild(item.cloneNode(true)));

        // 2. 變數設定
        let currentScroll = 0;
        const speedPPS = 32; // 自動播放速度
        let isPaused = false; // 是否暫停自動播放
        let lastTime = performance.now(); 

        // 拖曳相關變數
        let isDragging = false;
        let startX = 0;
        let startScrollPos = 0;

        // 3. 核心動畫函式 (負責更新畫面與檢查邊界)
        function animate(currentTime) {
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            // 只有在「沒被暫停」且「沒在拖曳」時，才自動增加數值
            if (!isPaused && !isDragging) {
                const moveDistance = speedPPS * deltaTime;
                currentScroll += moveDistance;
            }

            // --- 無限循環的核心邏輯 (雙向檢查) ---
            // 狀況 A: 往左跑超過一組寬度 -> 歸零 (無縫跳回開頭)
            if (currentScroll >= singleSetWidth) {
                currentScroll -= singleSetWidth;
            }
            // 狀況 B: 往右滑過頭 (變成負數) -> 補上一組寬度 (無縫跳去後面)
            else if (currentScroll < 0) {
                currentScroll += singleSetWidth;
            }

            // 更新 DOM 位置
            track.style.transform = `translateX(${-currentScroll}px)`;
            
            requestAnimationFrame(animate);
        }

        // 啟動動畫
        requestAnimationFrame(animate);

        // =========================================
        // 3.1 手指觸控事件 (Mobile Swipe)
        // =========================================
        
        // 手指按下去
        container.addEventListener('touchstart', (e) => {
            isPaused = true;        // 暫停自動播
            isDragging = true;      // 標記開始拖曳
            startX = e.touches[0].pageX; // 記錄手指初始 X 位置
            startScrollPos = currentScroll; // 記錄當下的滾動位置
        });

        // 手指移動中
        container.addEventListener('touchmove', (e) => {
            if (!isDragging) return; // 沒按著就不理它
            
            const currentX = e.touches[0].pageX;
            const walk = currentX - startX; // 計算滑動距離 (右滑為正，左滑為負)
            
            // 更新滾動位置 (減號是因為 translateX 越負越往左)
            currentScroll = startScrollPos - walk; 
        });

        // 手指放開
        container.addEventListener('touchend', () => {
            isDragging = false;
            isPaused = false;       // 恢復自動播
            lastTime = performance.now(); // 重置時間，避免時間差造成暴衝
        });

        // =========================================
        // 3.2 滑鼠事件 (電腦版也要能拖的話可保留)
        // =========================================
        container.addEventListener('mousedown', (e) => {
            isPaused = true;
            isDragging = true;
            startX = e.pageX;
            startScrollPos = currentScroll;
            container.style.cursor = 'grabbing'; // 改變游標樣式
        });

        container.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault(); // 防止選取文字
            const x = e.pageX;
            const walk = x - startX;
            currentScroll = startScrollPos - walk;
        });

        const stopDragging = () => {
            isDragging = false;
            isPaused = false;
            lastTime = performance.now();
            container.style.cursor = 'grab';
        };

        container.addEventListener('mouseup', stopDragging);
        container.addEventListener('mouseleave', stopDragging);
    }
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
        
        document.getElementById('leaderboard-data').innerHTML = '<p style="text-align:center; padding:20px; color:#666;">資料更新中...</p>';
        updateLeaderboard(currentSheet);
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

        const sorted = data.slice(0, 10);
        const scoreTitle = (sheetName.includes("總錦標")) ? "總積分" : "分數";

        let lastScore = null, lastRank = 0, actualRank = 0;

        const listHtml = sorted.map((p) => {
            actualRank++;
            
            const pName = p.姓名 || p.Name || "-"; 
            const pNumber = p.編號 || p.玩家號碼 || "未知";
            
            let rawScore = p.分數 !== undefined ? Number(p.分數) : 0;
            if (isNaN(rawScore)) rawScore = 0;
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
                <span class="lb-name">暱稱</span>
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
    card.addEventListener('click', (e) => {
        if (e.target.closest('.close-bottom-area')) return;

        const isAlreadyActive = card.classList.contains('active');

        if (isAlreadyActive) {
            // 已展開時不做事
        } else {
            closeAllCards();
            card.classList.add('active');
            document.body.classList.add('lock-scroll');
        }
    });

    const closeBtn = card.querySelector('.close-bottom-area');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            closeAllCards();     
        });
    }
});