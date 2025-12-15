// ==========================================
// 1. 底部導覽列切換 (Bottom Navigation)
// ==========================================
const navButtons = document.querySelectorAll('.bottom-nav .nav-btn');
const pages = document.querySelectorAll('.page-view');
let leaderboardInterval = null;

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // 如果點擊當前頁面，滑回頂端
        if (btn.classList.contains('active')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // 🔥 加強：如果在首頁按了「賽事介紹」，也重置回「時程表」
            if (btn.dataset.view === 'view-home') {
                const defaultTab = document.querySelector('.detail-tab-btn[data-target="detail-time"]');
                if (defaultTab) defaultTab.click();
            }
            return;
        }

        // 1. UI 狀態更新
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // 2. 頁面切換
        pages.forEach(page => page.classList.remove('active'));
        const targetId = btn.dataset.view;
        const targetPage = document.getElementById(targetId);
        if (targetPage) targetPage.classList.add('active');

        // 切換頁面後回到頂端
        window.scrollTo(0, 0);

        // 🔥 新增邏輯：如果切換回「首頁 (view-home)」，強制重置為「時程表」
        if (targetId === 'view-home') {
            // 找到時程表按鈕並觸發點擊，這樣藍色方塊和內容都會歸位
            const defaultTab = document.querySelector('.detail-tab-btn[data-target="detail-time"]');
            if (defaultTab) defaultTab.click();
        }

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
// 3. 七大項目無限絲滑輪播 (防手勢衝突版)
// ==========================================
const track = document.querySelector('.carousel-track');
const container = document.querySelector('.carousel-container');

if (track && container) {
    const items = Array.from(document.querySelectorAll('.carousel-item'));
    const itemWidth = items[0].offsetWidth; 
    const gap = 15; 
    const singleSetWidth = (itemWidth + gap) * items.length; 

    // 複製 2 組卡片以實現無限滾動 (總共 3 組)
    items.forEach(item => track.appendChild(item.cloneNode(true)));
    items.forEach(item => track.appendChild(item.cloneNode(true)));

    let currentScroll = 0;
    const speedPPS = 32; // 自動播放速度
    let isPaused = false;
    let lastTime = performance.now(); 

    // 手勢控制變數
    let startX = 0;
    let startY = 0;
    let startScroll = 0;
    let isDragging = false;

    // 1. 動畫迴圈
    function animate(currentTime) {
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        if (!isPaused) {
            const moveDistance = speedPPS * deltaTime;
            currentScroll += moveDistance;
            
            // 處理向左無限循環
            if (currentScroll >= singleSetWidth) {
                currentScroll -= singleSetWidth;
            }
            // 處理向右無限循環 (防止手動拖曳過頭)
            if (currentScroll < 0) {
                currentScroll += singleSetWidth;
            }

            track.style.transform = `translateX(${-currentScroll}px)`;
        }
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    // 2. 觸控開始
    container.addEventListener('touchstart', (e) => {
        isPaused = true;
        isDragging = true;
        startX = e.touches[0].pageX;
        startY = e.touches[0].pageY; // 記錄垂直位置，用來判斷方向
        startScroll = currentScroll; // 記錄按下時的位置
    }, { passive: false }); // 🔥 關鍵：允許我們阻止預設滾動

    // 3. 觸控移動 (核心邏輯：方向鎖定)
    container.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        const x = e.touches[0].pageX;
        const y = e.touches[0].pageY;
        
        // 計算水平與垂直的移動距離
        const diffX = x - startX;
        const diffY = y - startY;

        // 🔥 判斷：如果「水平移動」大於「垂直移動」，代表你想滑動卡片
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (e.cancelable) e.preventDefault(); // 🛑 禁止網頁上下捲動！
            
            // 跟隨手指移動 (乘上 1.5 倍讓滑動感更靈敏)
            currentScroll = startScroll - (diffX * 1.5);
            
            // 即時更新位置
            track.style.transform = `translateX(${-currentScroll}px)`;
        }
        // 如果是垂直移動大於水平，就不做事，讓瀏覽器正常捲動網頁
    }, { passive: false }); // 🔥 這裡也要加 passive: false

    // 4. 觸控結束
    container.addEventListener('touchend', () => { 
        isPaused = false; 
        isDragging = false;
        lastTime = performance.now(); // 重置時間防止暴衝
    });

    // 滑鼠暫停 (電腦版)
    container.addEventListener('mouseenter', () => { isPaused = true; });
    container.addEventListener('mouseleave', () => { 
        isPaused = false; 
        lastTime = performance.now(); 
    });
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
        
        const rawData = await res.json(); // 1. 先抓原始資料

// 2. 過濾：只有當「姓名」或「編號」其中一個有值時，才算有效資料
const data = rawData.filter(p => {
    const name = p.姓名 || p.Name;
    const number = p.編號 || p.玩家號碼;
    // 檢查是不是空字串或不存在
    return (name && name.trim() !== "") || (number && number.toString().trim() !== "");
});
                
        if (!data || data.length === 0) {
            container.innerHTML = "<p style='text-align:center; padding:20px;'>目前尚無資料</p>";
            return;
        }

        const sorted = data.slice(0, 20);
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
// 5. 組別展開功能 (App Store 風格 - 分身投影版)
// ==========================================
const overlay = document.getElementById('clone-overlay');
const overlayCard = overlay.querySelector('.overlay-card');
const overlayImg = overlay.querySelector('.overlay-img');
const overlayTitle = overlay.querySelector('.overlay-title');
const overlayDesc = overlay.querySelector('.overlay-desc');
const overlayBadge = overlay.querySelector('.overlay-badge');
const overlayBody = overlay.querySelector('.overlay-body');

// 🔥 這裡只抓取「底部收合按鈕」，因為右上角的叉叉已經拿掉了
const overlayCloseBtns = overlay.querySelectorAll('.overlay-bottom-close');

let originalCard = null; // 用來記住目前是從哪張卡片點開的

// --- 1. 打開動畫 ---
function openOverlay(card) {
    if (overlay.classList.contains('active')) return;
    
    originalCard = card;
    
    // 抓取原本卡片的資料
    const originalImg = card.querySelector('.group-img');
    const badgeText = card.querySelector('.group-badge').innerText;
    const titleText = card.querySelector('h3').innerText;
    const descText = card.querySelector('.group-info p').innerText;
    const hiddenBody = card.querySelector('.group-content-inner'); 
    
    // 1. 鎖定背景捲動
    document.body.classList.add('lock-scroll');

    // 2. 抓取原本卡片在螢幕上的位置 (FLIP - First)
    const rect = card.getBoundingClientRect();
    
    // 3. 把內容複製進分身
    overlayImg.src = originalImg.src;
    overlayBadge.innerText = badgeText;
    overlayTitle.innerText = titleText;
    overlayDesc.innerText = descText;
    
    // 複製詳情內容
    if(hiddenBody) {
        overlayBody.innerHTML = hiddenBody.innerHTML;
    } else {
        overlayBody.innerHTML = "";
    }

    // 4. 設定分身初始狀態 (位置與大小跟原本卡片一模一樣)
    overlay.classList.remove('overlay-hidden');
    overlay.style.display = 'block';
    
    overlayCard.style.width = `${rect.width}px`;
    overlayCard.style.height = `${rect.height}px`;
    overlayCard.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
    overlayCard.style.borderRadius = '12px'; 
    
    // 5. 隱藏本尊 (保持佔位，但視覺隱藏)
    card.classList.add('is-hidden-by-overlay');

    // 6. 執行展開動畫 (FLIP - Play)
    requestAnimationFrame(() => {
        // 加入 active class 啟動 CSS transition
        overlay.classList.add('active');
        
        // 設定最終狀態 (全螢幕)
        overlayCard.style.width = '100%';
        overlayCard.style.height = '100%'; 
        overlayCard.style.minHeight = '100vh';
        overlayCard.style.transform = `translate(0, 0)`;
        overlayCard.style.borderRadius = '0px';
    });
}

// --- 2. 關閉動畫 (防連點修正版) ---
function closeOverlay() {
    // 如果已經在關閉中 (沒有 originalCard)，就直接擋掉，防止連點
    if (!originalCard) return;

    // 1. 🔥 關鍵：立刻鎖死點擊，防止手速快的人按兩下造成 bug
    overlay.style.pointerEvents = 'none';

    // 2. 重新抓取原本卡片的位置
    const rect = originalCard.getBoundingClientRect();

    // 3. 移除 active，按鈕會瞬間消失 (因為 CSS 改成了 transition: 0s)
    overlay.classList.remove('active');
    
    // 4. 強制分身飛回原本的位置
    overlayCard.style.width = `${rect.width}px`;
    overlayCard.style.height = `${rect.height}px`; 
    overlayCard.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
    overlayCard.style.borderRadius = '12px';

    // 5. 等動畫跑完 (0.3s)
    setTimeout(() => {
        // 隱藏分身層
        overlay.style.display = 'none';
        overlay.classList.add('overlay-hidden');
        
        // 顯示本尊
        originalCard.classList.remove('is-hidden-by-overlay');
        
        // 解鎖背景
        document.body.classList.remove('lock-scroll');
        
        // 清理變數
        originalCard = null;
        
        // 捲動回分身的頂部
        document.querySelector('.overlay-scroll-container').scrollTop = 0;
        
        // 🔥 關鍵：動畫結束後，恢復點擊功能 (讓下次打開時可以點)
        overlay.style.pointerEvents = 'auto';
        
    }, 300);
}

// --- 事件監聽 ---

// 1. 綁定所有卡片點擊
const cards = document.querySelectorAll('.group-card');
cards.forEach(card => {
    card.addEventListener('click', () => openOverlay(card));
});

// 2. 綁定關閉按鈕 (只剩下底部那個)
overlayCloseBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeOverlay();
    });
});

// ==========================================
// 6. GSAP 視差與動畫效果
// ==========================================

// 確保 GSAP 插件已註冊
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // --- 視差滾動 (Parallax) ---
    const parallaxTl = gsap.timeline({
        scrollTrigger: {
            trigger: ".para-container",
            start: "top top",
            end: "bottom top", 
            scrub: true // 綁定滾動條
        }
    });

    // 設定各圖層移動速度 
    // y 為負值代表往上移
    // 數字越大 (越負) = 動越快 = 感覺離鏡頭越近
    parallaxTl
        // .to(".para-back",        { y: -100, ease: "none" }, 0) // 背景動很慢
        .to(".para-mid",         { y: -100, ease: "none" }, 0) // 中景動稍快
        .to(".para-front",       { y: -200, ease: "none" }, 0) // 前景動快
        .to(".para-super-front", { y: -300, ease: "none" }, 0); // 特寫動最快

} else {
    console.warn("GSAP 未載入");
}

