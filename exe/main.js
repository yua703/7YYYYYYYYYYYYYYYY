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
// 5. 組別展開功能 (含多圖滑動 & 全螢幕) - Bug修復版
// ==========================================

// 🔥 設定：每一組的照片清單
const GROUP_GALLERY = {
    "G1": ["img/1.webp", "img/1.webp", "img/1.webp"], 
    "G4": ["img/4.webp", "img/4.webp"],
    // 其他沒寫的組別，程式會自動預設只有一張封面圖
};

// DOM 元素選取
const overlay = document.getElementById('clone-overlay');
const overlayTitle = overlay.querySelector('.overlay-title');
const overlayDesc = overlay.querySelector('.overlay-desc');
const overlayBadge = overlay.querySelector('.overlay-badge');
const overlayBody = overlay.querySelector('.overlay-body');
const overlayScrollContainer = overlay.querySelector('.overlay-scroll-container');
const overlayCloseBtns = overlay.querySelectorAll('.overlay-bottom-close');

// 滑動相關元素
const sliderTrack = overlay.querySelector('.overlay-slider-track');
const sliderCounter = overlay.querySelector('.overlay-image-counter');

// 🔥 核心修正：將 Index 變數統一管理，不要讓 enableSwipe 自己私藏
let currentImages = []; 
let currentSlideIndex = 0; 

// 全螢幕相關元素
const lightbox = document.getElementById('fullscreen-lightbox');
const lightboxTrack = lightbox.querySelector('.lightbox-track');
const lightboxCounter = lightbox.querySelector('.lightbox-counter');
const lightboxClose = lightbox.querySelector('.lightbox-close');

// --- 功能 A: 開啟詳情頁 (Overlay) ---
function openOverlay(card) {
    document.body.classList.add('lock-scroll');

    // 1. 抓取基本文字資料
    const badgeText = card.querySelector('.group-badge').innerText; 
    const titleText = card.querySelector('h3').innerText;
    const descText = card.querySelector('.group-info p').innerText;
    const hiddenBody = card.querySelector('.group-content-inner');
    const originalImgSrc = card.querySelector('.group-img').src;

    // 2. 準備圖片資料
    if (GROUP_GALLERY[badgeText]) {
        currentImages = GROUP_GALLERY[badgeText];
    } else {
        // 預設只有一張圖
        currentImages = [originalImgSrc];
    }

    // 3. 填入文字
    overlayBadge.innerText = badgeText;
    overlayTitle.innerText = titleText;
    overlayDesc.innerText = descText;
    overlayBody.innerHTML = hiddenBody ? hiddenBody.innerHTML : "";

    // 4. 初始化滑動器
    initSlider(sliderTrack, currentImages, 'overlay-slide-img');
    
    // 🔥 核心修正：打開時強制歸零
    currentSlideIndex = 0; 
    updateCounter(sliderCounter, 1, currentImages.length);
    sliderTrack.style.transform = `translateX(0px)`; 

    // 5. 顯示 Overlay
    if(overlayScrollContainer) overlayScrollContainer.scrollTop = 0;
    overlay.classList.remove('overlay-hidden');
    requestAnimationFrame(() => {
        overlay.classList.add('active');
    });
}

// --- 功能 B: 初始化滑動軌道 ---
function initSlider(trackElement, images, imgClass) {
    trackElement.innerHTML = ''; // 清空
    images.forEach((src, index) => {
        const img = document.createElement('img');
        img.src = src;
        img.className = imgClass; 
        // 點擊詳情頁圖片 -> 開啟全螢幕
        if (imgClass === 'overlay-slide-img') {
            img.onclick = () => openLightbox(index);
        }
        trackElement.appendChild(img);
    });
}

// --- 功能 C: 更新計數器文字 ---
function updateCounter(element, current, total) {
    element.innerText = `${current}/${total}`;
}

// --- 功能 D: 通用滑動邏輯 (防手勢衝突優化版) ---
function enableSwipe(trackElement, counterElement, isLightbox = false) {
    let startX = 0;
    let startY = 0; // 🔥 新增：紀錄垂直位置
    let currentTranslate = 0;
    let prevTranslate = 0;
    let isDragging = false;
    let animationID;
    let isHorizontal = null; // 🔥 新增：用來鎖定方向的旗標

    // 觸控開始
    trackElement.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY; // 🔥 紀錄 Y
        isDragging = true;
        isHorizontal = null; // 重置方向判定
        animationID = requestAnimationFrame(animation);
        
        if(!isLightbox) {
            prevTranslate = currentSlideIndex * -trackElement.offsetWidth;
        }
    }, { passive: false }); // 🔥 關鍵修改：改成 false 才能擋住捲動

    // 觸控移動
    trackElement.addEventListener('touchmove', (e) => {
        if (!isDragging) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = currentX - startX;
        const diffY = currentY - startY;

        // 🔥 核心邏輯：方向鎖定
        // 如果還沒判定方向，就先比較 X 和 Y 的移動距離
        if (isHorizontal === null) {
            // 如果 X 移動距離 > Y 移動距離，認定為「水平滑動意圖」
            if (Math.abs(diffX) > Math.abs(diffY)) {
                isHorizontal = true;
            } else {
                isHorizontal = false;
            }
        }

        // 🔥 如果判定是水平滑動，就執行圖片移動，並「殺掉」垂直捲動
        if (isHorizontal) {
            if (e.cancelable) e.preventDefault(); // 🛑 禁止網頁上下捲動
            currentTranslate = prevTranslate + diffX;
        }
        // 如果是垂直滑動 (isHorizontal === false)，就不更新 currentTranslate
        // 這樣圖片不會動，瀏覽器會自然地去捲動網頁

    }, { passive: false }); // 🔥 關鍵修改：改成 false

    // 觸控結束
    trackElement.addEventListener('touchend', () => {
        isDragging = false;
        cancelAnimationFrame(animationID);

        // 只有在真的是水平滑動時，才計算換頁
        if (isHorizontal) {
            const movedBy = currentTranslate - prevTranslate;
            const threshold = 50; 

            if (movedBy < -threshold && currentSlideIndex < currentImages.length - 1) {
                currentSlideIndex += 1;
            } else if (movedBy > threshold && currentSlideIndex > 0) {
                currentSlideIndex -= 1;
            }
            
            setPositionByIndex();
        } else {
            // 如果剛剛是垂直滑動，圖片位置要歸位 (防止稍微被拖動到一點點)
             setPositionByIndex();
        }
    });

    // 動畫幀
    function animation() {
        if(isDragging && isHorizontal) { // 只有鎖定水平時才跑動畫
            setSliderPosition(currentTranslate);
            requestAnimationFrame(animation);
        }
    }

    // 設定位置 (拖曳中)
    function setSliderPosition(pos) {
        trackElement.style.transform = `translateX(${pos}px)`;
    }

    // 設定位置 (放開後吸附)
    function setPositionByIndex() {
        const width = trackElement.offsetWidth;
        currentTranslate = currentSlideIndex * -width;
        
        trackElement.style.transition = 'transform 0.3s ease-out';
        trackElement.style.transform = `translateX(${currentTranslate}px)`;
        
        setTimeout(() => {
            trackElement.style.transition = 'none';
        }, 300);

        updateCounter(counterElement, currentSlideIndex + 1, currentImages.length);
    }
}

// 啟用詳情頁的滑動
enableSwipe(sliderTrack, sliderCounter, false);


// --- 功能 E: 全螢幕 Lightbox 邏輯 ---
function openLightbox(startIndex) {
    initSlider(lightboxTrack, currentImages, 'lightbox-img');
    lightbox.classList.add('active');
    
    // 全螢幕使用獨立的 index，不干擾詳情頁
    setupLightboxSwipe(startIndex);
}

function setupLightboxSwipe(initialIndex) {
    let index = initialIndex; // 全螢幕內部的獨立變數
    let startX = 0;
    let isDragging = false;
    
    // 初始化位置
    const width = window.innerWidth;
    lightboxTrack.style.transition = 'none'; // 避免開啟時有動畫
    lightboxTrack.style.transform = `translateX(${-index * width}px)`;
    updateCounter(lightboxCounter, index + 1, currentImages.length);

    lightboxTrack.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        isDragging = true;
        lightboxTrack.style.transition = 'none';
    });

    lightboxTrack.addEventListener('touchmove', e => {
        if (!isDragging) return;
        const diff = e.touches[0].clientX - startX;
        const width = window.innerWidth;
        const translate = (index * -width) + diff;
        lightboxTrack.style.transform = `translateX(${translate}px)`;
        e.preventDefault(); 
    }, { passive: false });

    lightboxTrack.addEventListener('touchend', e => {
        isDragging = false;
        const endX = e.changedTouches[0].clientX;
        const diff = endX - startX;
        const width = window.innerWidth;

        if (diff < -50 && index < currentImages.length - 1) {
            index++;
        } else if (diff > 50 && index > 0) {
            index--;
        }

        lightboxTrack.style.transition = 'transform 0.3s ease';
        lightboxTrack.style.transform = `translateX(${index * -width}px)`;
        updateCounter(lightboxCounter, index + 1, currentImages.length);
    });
}

// 關閉全螢幕
lightboxClose.addEventListener('click', () => {
    lightbox.classList.remove('active');
});

// --- 功能 F: 關閉詳情頁 ---
function closeOverlay() {
    overlay.classList.remove('active');
    setTimeout(() => {
        overlay.classList.add('overlay-hidden');
        document.body.classList.remove('lock-scroll');
        
        // 關閉時也保險歸零一次
        currentSlideIndex = 0;
        sliderTrack.style.transform = `translateX(0px)`;
    }, 300);
}

// 綁定點擊卡片事件
const cards = document.querySelectorAll('.group-card');
cards.forEach(card => {
    card.addEventListener('click', () => openOverlay(card));
});

// 綁定關閉按鈕
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

