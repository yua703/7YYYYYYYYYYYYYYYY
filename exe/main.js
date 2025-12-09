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
// ==========================================
// 🔥 新增：強制每次進入或重整都在頁面頂端
// ==========================================
if ('scrollRestoration' in history) {
    // 告訴瀏覽器：「不要雞婆幫我記住捲動位置，我要自己控制」
    history.scrollRestoration = 'manual'; 
}
// 滾動到頂端
window.scrollTo(0, 0);

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
        .to(".para-mid",         { y: -200, ease: "none" }, 0) // 中景動稍快
        .to(".para-front",       { y: -400, ease: "none" }, 0) // 前景動快
        .to(".para-super-front", { y: -600, ease: "none" }, 0); // 特寫動最快

} else {
    console.warn("GSAP 未載入");
}


//     // --- B. 飛入飛出效果 (Trigger Animation) ---
//     // 這是一個獨立的動畫，不綁定 scrub，而是觸發播放
//     gsap.fromTo(".para-flying-obj", 
//         { 
//             y: -800,      // 初始狀態：在右邊 800px (螢幕外)
//             opacity: 0   // 初始狀態：透明
//         },
//         {
//             y: 0,        // 結束狀態：回到原位
//             opacity: 1,  // 結束狀態：顯示
//             duration: 1.5, // 動畫時間 1.5 秒
//             ease: "bounce.out", // 緩動效果：快進慢出
//             scrollTrigger: {
//                 trigger: ".para-container",
//                 start: "top center", // 當容器頂部 碰到 視窗中間 時觸發
                
//                 toggleActions: "play none none reverse" 
//             }
//         }
//     );

// } else {
//     console.warn("GSAP 或 ScrollTrigger 未載入，請檢查 HTML 是否引入 CDN");
// }