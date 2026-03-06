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
    
    // 🔥 1. 讀取翻譯：載入中
    const tLoading = translations[currentLang]['lb_loading'];
    
    // 如果是第一次載入，或是切換頁籤時，顯示載入文字
    // (這裡稍微判斷一下，避免自動更新時一直閃爍)
    if (!container.querySelector('.lb-player')) {
        container.innerHTML = `<p style="text-align:center; padding:20px; color:#666;">${tLoading}</p>`;
    }

    try {
        const res = await fetch(sheetBase + encodeURIComponent(sheetName), { cache: "no-cache" });
        
        if (!res.ok) throw new Error("網路回應錯誤");
        
        const rawData = await res.json();

        // 過濾資料
        const data = rawData.filter(p => {
            const name = p.姓名 || p.Name;
            const number = p.編號 || p.玩家號碼;
            return (name && name.trim() !== "") || (number && number.toString().trim() !== "");
        });
                
        if (!data || data.length === 0) {
            // 🔥 2. 讀取翻譯：無資料
            const tNoData = translations[currentLang]['lb_no_data'];
            container.innerHTML = `<p style='text-align:center; padding:20px;'>${tNoData}</p>`;
            return;
        }

        const sorted = data.slice(0, 20);
        
        // 🔥 3. 讀取翻譯：欄位名稱
        const tRank = translations[currentLang]['lb_rank_col'];   // 排名
        const tName = translations[currentLang]['lb_name_col'];   // 暱稱
        const tNum  = translations[currentLang]['lb_num_col'];    // 編號
        
        // 判斷是「分數」還是「總積分」
        const isTotal = sheetName.includes("總錦標");
        const scoreTitle = isTotal ? translations[currentLang]['lb_total_col'] : translations[currentLang]['lb_score_col'];

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

        // 🔥 4. 組合 HTML (將翻譯變數放入)
        container.innerHTML = `
            <div class="lb-header">
                <span class="lb-rank">${tRank}</span>
                <span class="lb-name">${tName}</span>
                <span class="lb-number">${tNum}</span>
                <span class="lb-score">${scoreTitle}</span>
            </div>
            ${listHtml}
        `;
    } catch (err) {
        console.error(err);
        // 🔥 5. 讀取翻譯：錯誤訊息
        const tError = translations[currentLang]['lb_error'];
        container.innerHTML = `<p style='text-align:center; padding:20px; color:red;'>${tError}</p>`;
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
// 5. 組別展開功能 (含多圖滑動、全螢幕、電腦版按鈕) - 完整修復版
// ==========================================

// 🔥 設定：每一組的照片清單
const GROUP_GALLERY = {
    "G1": ["img/1.webp","img/1 (1).webp", "img/1 (2).webp", "img/1 (3).webp","img/1 (4).webp"],
    "G2": ["img/2.webp","img/2 (1).webp", "img/2 (2).webp", "img/2 (3).webp"], 
    "G3": ["img/3.webp","img/3 (1).webp", "img/3 (2).webp", "img/3 (3).webp"],
    "G4": ["img/4.webp","img/4 (1).webp", "img/4 (2).webp", "img/4 (3).webp"],
    "G6": ["img/6.webp","img/6 (1).webp", "img/6 (2).webp", "img/6 (3).webp"],
    "G8": ["img/8.webp","img/8 (1).webp", "img/8 (2).webp", "img/8 (3).webp"],
    "G9": ["img/9.webp","img/9 (1).webp", "img/9 (2).webp", "img/9 (3).webp", "img/9 (4).webp"],
    "G10": ["img/10.webp","img/10 (1).webp", "img/10 (2).webp", "img/10 (3).webp"],
    "G11": ["img/11.webp","img/11 (1).webp", "img/11 (2).webp"],
    "G12": ["img/12.webp","img/12 (1).webp", "img/12 (2).webp","img/12 (3).webp"],
    "G13": ["img/13.webp","img/13 (1).webp", "img/13 (2).webp", "img/13 (3).webp"],
    "G14": ["img/14.webp","img/14 (1).webp", "img/14 (2).webp", "img/14 (3).webp"],
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
// 🔥 新增：選取左右按鈕
const prevBtn = overlay.querySelector('.prev-btn');
const nextBtn = overlay.querySelector('.next-btn');

// 🔥 核心修正：將 Index 變數統一管理
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

    // 🔥 新增邏輯：如果只有一張圖，就隱藏左右按鈕
    if (currentImages.length <= 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    } else {
        // 恢復顯示 (因為 CSS 設定了 hover 才顯示，這裡用空白字串讓它回到 CSS 控制狀態)
        prevBtn.style.display = '';
        nextBtn.style.display = '';
    }

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

// --- 🔥 新增功能 G: 電腦版按鈕切換邏輯 ---
// 專門用來處理 Overlay 的按鈕點擊
function changeOverlaySlide(direction) {
    const total = currentImages.length;
    if (total <= 1) return; // 只有一張圖就不做事

    if (direction === 'next') {
        if (currentSlideIndex < total - 1) {
            currentSlideIndex++;
        }
    } else if (direction === 'prev') {
        if (currentSlideIndex > 0) {
            currentSlideIndex--;
        }
    }

    // 計算位置並移動
    const width = sliderTrack.offsetWidth;
    const currentTranslate = currentSlideIndex * -width;
    
    sliderTrack.style.transition = 'transform 0.3s ease-out';
    sliderTrack.style.transform = `translateX(${currentTranslate}px)`;
    
    // 更新計數器
    updateCounter(sliderCounter, currentSlideIndex + 1, total);

    // 動畫結束後移除 transition
    setTimeout(() => {
        sliderTrack.style.transition = 'none';
    }, 300);
}

// 綁定按鈕事件
prevBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // 防止點到圖片觸發全螢幕
    changeOverlaySlide('prev');
});
nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    changeOverlaySlide('next');
});


// --- 功能 D: 通用滑動邏輯 (手機觸控用) ---
function enableSwipe(trackElement, counterElement, isLightbox = false) {
    let startX = 0;
    let startY = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let isDragging = false;
    let animationID;
    let isHorizontal = null; 

    trackElement.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
        isHorizontal = null; 
        
        animationID = requestAnimationFrame(animation);
        
        if(!isLightbox) {
            // 如果是 Overlay，起始位置要根據當前的 Index 計算
            prevTranslate = currentSlideIndex * -trackElement.offsetWidth;
        }
    }, { passive: false });

    trackElement.addEventListener('touchmove', (e) => {
        if (!isDragging) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = currentX - startX;
        const diffY = currentY - startY;

        if (isHorizontal === null) {
            if (Math.abs(diffX) > Math.abs(diffY)) {
                isHorizontal = true; 
            } else {
                isHorizontal = false; 
            }
        }

        if (isHorizontal) {
            if (e.cancelable) e.preventDefault(); 
            currentTranslate = prevTranslate + diffX; 
        }
        
    }, { passive: false });

    trackElement.addEventListener('touchend', () => {
        isDragging = false;
        cancelAnimationFrame(animationID);

        if (isHorizontal) {
            const movedBy = currentTranslate - prevTranslate;
            const threshold = 50; 
            // 這裡使用外部的 currentSlideIndex 和 currentImages
            if (movedBy < -threshold && currentSlideIndex < currentImages.length - 1) {
                currentSlideIndex += 1;
            } else if (movedBy > threshold && currentSlideIndex > 0) {
                currentSlideIndex -= 1;
            }
        }
        
        setPositionByIndex();
    });

    function animation() {
        if(isDragging && isHorizontal) {
            setSliderPosition(currentTranslate);
            requestAnimationFrame(animation);
        }
    }

    function setSliderPosition(pos) {
        trackElement.style.transform = `translateX(${pos}px)`;
    }

    // 觸控結束後的歸位函式
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

// 啟用詳情頁的觸控滑動
enableSwipe(sliderTrack, sliderCounter, false);


// --- 功能 E: 全螢幕 Lightbox 邏輯 (含左右按鈕) ---

// 1. 選取全螢幕按鈕
const lbPrevBtn = lightbox.querySelector('.prev-btn');
const lbNextBtn = lightbox.querySelector('.next-btn');

// 2. 全域變數管理目前張數
let currentLightboxIndex = 0;

function openLightbox(startIndex) {
    // 初始化圖片
    initSlider(lightboxTrack, currentImages, 'lightbox-img');
    
    // 設定起始位置
    currentLightboxIndex = startIndex;
    updateLightboxPosition(false); // false = 不要動畫 (直接定位)
    
    // 檢查按鈕顯示狀態
    checkLightboxButtons();

    lightbox.classList.add('active');
    
    // 啟動滑動偵測
    setupLightboxSwipe();
}

// 更新位置與計數器
function updateLightboxPosition(enableTransition = true) {
    const width = window.innerWidth;
    const translate = currentLightboxIndex * -width;
    
    if (enableTransition) {
        lightboxTrack.style.transition = 'transform 0.3s ease-out';
    } else {
        lightboxTrack.style.transition = 'none';
    }
    
    lightboxTrack.style.transform = `translateX(${translate}px)`;
    updateCounter(lightboxCounter, currentLightboxIndex + 1, currentImages.length);
    
    // 動畫跑完後清掉 transition，避免視窗縮放時怪怪的
    if (enableTransition) {
        setTimeout(() => {
            lightboxTrack.style.transition = 'none';
        }, 300);
    }
}

// 檢查按鈕是否需要顯示 (只有一張圖就不用按鈕)
function checkLightboxButtons() {
    if (currentImages.length <= 1) {
        lbPrevBtn.style.display = 'none';
        lbNextBtn.style.display = 'none';
    } else {
        lbPrevBtn.style.display = ''; // 恢復 CSS 設定 (flex)
        lbNextBtn.style.display = '';
    }
}

// 按鈕點擊事件處理
function changeLightboxSlide(direction) {
    const total = currentImages.length;
    if (total <= 1) return;

    if (direction === 'next') {
        if (currentLightboxIndex < total - 1) {
            currentLightboxIndex++;
        } else {
            // (選用) 如果想要循環播放，可以把下面這行註解打開
            // currentLightboxIndex = 0; 
        }
    } else if (direction === 'prev') {
        if (currentLightboxIndex > 0) {
            currentLightboxIndex--;
        } else {
            // (選用) 循環播放
            // currentLightboxIndex = total - 1;
        }
    }
    updateLightboxPosition(true);
}

// 綁定按鈕事件
lbPrevBtn.onclick = (e) => { e.stopPropagation(); changeLightboxSlide('prev'); };
lbNextBtn.onclick = (e) => { e.stopPropagation(); changeLightboxSlide('next'); };

// 滑動邏輯 (Refactored to use global index)
function setupLightboxSwipe() {
    let startX = 0;
    let isDragging = false;
    
    // 移除舊的監聽器 (避免重複綁定)，這是一個好習慣，但為了簡化，我們假設每次 openLightbox 都不會造成記憶體洩漏太嚴重，
    // 或者使用 on-event 覆蓋。這裡我們用最簡單的方式：
    // 因為 lightboxTrack 是一直存在的 DOM，我們只要在外部綁定一次就好，
    // 但因為 `currentImages` 會變，所以這段邏輯保持在這裡沒問題，
    // 只要確保變數引用的是最新的 currentLightboxIndex。

    lightboxTrack.ontouchstart = (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        lightboxTrack.style.transition = 'none';
    };

    lightboxTrack.ontouchmove = (e) => {
        if (!isDragging) return;
        const diff = e.touches[0].clientX - startX;
        const width = window.innerWidth;
        const translate = (currentLightboxIndex * -width) + diff;
        lightboxTrack.style.transform = `translateX(${translate}px)`;
        e.preventDefault(); // 防止全螢幕時還能上下捲動網頁
    };

    lightboxTrack.ontouchend = (e) => {
        isDragging = false;
        const endX = e.changedTouches[0].clientX;
        const diff = endX - startX;
        
        // 判斷滑動距離是否足夠換頁 (門檻 50px)
        if (diff < -50 && currentLightboxIndex < currentImages.length - 1) {
            currentLightboxIndex++;
        } else if (diff > 50 && currentLightboxIndex > 0) {
            currentLightboxIndex--;
        }

        updateLightboxPosition(true);
    };
}

lightboxClose.addEventListener('click', () => {
    lightbox.classList.remove('active');
});

// --- 功能 F: 關閉詳情頁 ---
function closeOverlay() {
    overlay.classList.remove('active');
    setTimeout(() => {
        overlay.classList.add('overlay-hidden');
        document.body.classList.remove('lock-scroll');
        
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
// 6. 時程表手風琴效果 (Accordion)
// ==========================================
function toggleSchedule(element) {
    // 1. 切換當前點擊的項目的 active 狀態
    element.classList.toggle('active');

    const allGroups = document.querySelectorAll('.schedule-group');
    allGroups.forEach(group => {
        if (group !== element) {
            group.classList.remove('active');
        }
    });
}
// ==========================================
// 7. 多語言切換系統 (i18n - 完整翻譯版)
// ==========================================
const translations = {
    'zh': {
        // 導覽
        'nav_info': '賽事介紹', 'nav_sports': '運動項目', 'nav_rank': '排行榜',
        'close_btn': '點擊關閉',
        
        // 首頁
        'about_title': '關於本次賽事',
        'home_brand': '【ExErcise】科技 × 運動賽事',
        'home_slogan': '打破傳統，我們用科技重新定義運動競技。',
        'home_desc': '無論你是哪類猛將，這裡都有屬於你的戰場。<br>準備好挑戰極限了嗎？快來與夥伴一同釋放自己的潛能吧！',
        'event_items': '七大競賽項目',
        'detail_title': '賽事細節',

        // 分頁按鈕
        'tab_schedule': '時程表', 'tab_scoring': '計分方法', 'tab_map': '賽事地圖', 'tab_rules': '競賽辦法',

        // 時程表
        'batch_1': '第一梯次', 'batch_2': '第二梯次', 'batch_3': '第三梯次', 'batch_4': '第四梯次', 'batch_5': '第五梯次',
        'act_reg_1': '第一梯次報到', 'act_warm_1': '第一梯次熱身', 'act_play_1': '第一梯次體驗遊玩',
        'act_reg_2': '第二梯次報到', 'act_warm_2': '第二梯次熱身', 'act_play_2': '第二梯次體驗遊玩',
        'act_reg_3': '第三梯次報到', 'act_warm_3': '第三梯次熱身', 'act_play_3': '第三梯次體驗遊玩',
        'act_reg_4': '第四梯次報到', 'act_warm_4': '第四梯次熱身', 'act_play_4': '第四梯次體驗遊玩',
        'act_reg_5': '第五梯次報到', 'act_warm_5': '第五梯次熱身', 'act_play_5': '第五梯次體驗遊玩',
        'rest_noon': '午休', 'rest_short': '休息片刻', 'event_closing': '頒獎閉幕', 'event_photo': '全體大合照',

        // 計分方法
        'score_h1': '一、個人單項挑戰',
        'score_label_rank': '排名方式', 'score_text_rank': '依各項目的分數高低進行排名。',
        'score_label_reward': '獎勵機制', 'score_text_reward': '各單項取第一名給予獎勵。',
        'score_label_tie': '同分判定', 'score_text_tie': '如遇成績相同（同分）之情況，將依較早完成報到者排名優先。',
        'score_h2': '二、個人全項總積分',
        'score_sub_calc': '積分換算', 'score_desc_calc': '各單項排名前十名者可獲得對應積分：',
        'rank_1': '第 1 名', 'rank_2': '第 2 名', 'rank_others': '...以此類推', 'rank_10': '第 10 名',
        'score_sub_method': '採計方式',
        'score_li_1': '本賽事共分為七大類別。',
        'score_li_2': '若於同一大類別中參與多個項目並皆獲得積分，將取最高分之項目，作為該類別的最終積分。',
        'score_sub_total': '總排名與獎勵',
        'score_li_3': '結算七大類別總積分，分數越高者排名越前。',
        'score_li_4': '總排名前三名給予獎勵。',

        // 競賽辦法
        'rule_h1': '一、線上報名',
        'rule_li_1': '採表單預約制，每梯次限額 34 人。',
        'rule_li_2': '報名完成後，系統將於兩日內寄【報名確認信】至您填寫的電子信箱。',
        'rule_li_3': '若沒收到，請務必於 12/26（五）前 聯繫主辦單位。',
        'rule_h2': '二、參賽須知',
        'rule_li_4': '完成報到後，將發放「參賽編號手環」用於紀錄競賽成績；活動期間請妥善保管手環，並於離場時繳回服務處。',
        'rule_li_5': '請務必穿著適合運動的服裝與運動鞋，以確保活動安全。',
        'rule_li_6': '挑戰過程中請隨時留意自身身體狀況，量力而為。',
        'note_title': '【注意事項】',
        'note_content': '提醒有任何身體不適、心臟病、高血壓、頸部或背部問題、孕婦者不宜參與。<br>請參賽者留意自身健康狀況，若感到不適，建議不要勉強參加。如仍決定參與，請自行承擔相關風險。<br><br>＊本活動為互動系113級二年級上學期專題展，其各項科技運動遊戲屬於前期測試＊<br>＊若有不盡人意的地方，還請多海涵＊',

        // Footer
        'footer_host': '主辦單位：', 'footer_co': '合作單位：',
        'footer_dept': '國立臺北科技大學 113級互動設計系', 'footer_locked': '尚未解鎖', 'btn_ig': '追蹤官方IG',

        // 排行榜
        'lb_title': '即時排行榜', 'lb_loading': '載入中...', 'lb_all': '七大項總錦標',

        // 運動類別
        'cat_focus': '專注力', 'cat_reaction': '反應力', 'cat_agility': '敏捷力', 'cat_endurance': '耐力',
        'cat_explosive': '爆發力', 'cat_coordination': '協調力', 'cat_intellect': '智力',
        'label_intro': '組別介紹', 'label_members': '組員', 'label_advisor': '指導老師',

        // 17 組名稱
        'g1_name': '培根行動', 'g2_name': 'PECOPECO', 'g3_name': 'SOS:Snap Or Scrap', 'g4_name': '流汗吧！健美詠者',
        'g5_name': '企色戰隊', 'g6_name': '不是．鴿們', 'g7_name': '老娘不幹了', 'g8_name': '賽馬郎',
        'g9_name': '溫水煮青蛙', 'g10_name': '超派拍對', 'g11_name': '翻身', 'g12_name': 'hurry down',
        'g13_name': '重生之我在神界當牛馬', 'g14_name': 'Baa Hind the Door',
        'g15_name': 'Legend of the rower', 'g16_name': 'Legend of MUAY THAI', 'g17_name': 'THE STONE FLOWER',

        // 17 組介紹 (中文)
        'g1_desc': '《培根行動 Project Bacon》是一款結合 節奏判定 × 動作揮擊 的反應型遊戲，改編自經典童話《三隻小豬》，玩家將扮演大野狼，在混亂又充滿節奏感的攻防中，突破三隻小豬的連續攻擊。',
        'g2_desc': '《PECOPECO》是一款可愛互動反應遊戲！玩家手持鳳梨酥，抓準台灣黑熊、石虎與藍鵲張嘴的時機，快速餵食提升好感度，30 秒內收服牠們成為好夥伴吧！',
        'g3_desc': '以高速婆婆傳說改編，考驗敏捷反應力。玩家需要一邊左右閃避來車，一邊操作皮拉提斯環拍下高速婆婆的清晰身影。各位窮苦超屁的大學生們，快來看看誰能拍到最清晰的瞬間、賺取最高的賞金吧！',
        'g4_desc': '拔起你的石中劍，打爆邪惡法師梅林，一起甩出汗水💦與肌肉💪‼️<br>成為健美詠者吧‼️',
        'g5_desc': '你說的對🗣️👍，但是《企色戰隊》🐧🐧🐧是由Group5️⃣自主研發💡的一款節奏類🎵有氧運動遊戲🦵🦵。遊戲發生在一個被稱作「南極🥶」的大陸🌍，某一天，漁船🚢撞擊冰山💥🧊漏出有毒物質😱☣️，部分企鵝變成殭屍🧟⁉️。你🫵將成為助力💪「企鵝戰隊」🐧🩵的神秘力量😏，在「☠️致命殭屍節奏🎶」與「💨有氧驅動踏板👣🔘」之間操控「企鵝機甲🦾🤖」發射水炮💦💦，和企鵝們一起擊敗殭屍👊😡，找回失散的平靜🤗🤗——同時，逐步👣👣發掘「企鵝」的美好🐧❤️🐧💚🐧💙。',
        'g6_desc': '「鴿們就靠你了！」 變身諾亞方舟上的鴿子，努力拍動翅膀，小心閃避障礙，在洪水中找到那根代表希望的橄欖枝吧！',
        'g7_desc': '在長期被霸總壓迫的職場中，秘書選擇不再忍耐。<br>本作品以誇張卻熟悉的職場情境為背景，邀請你化身為「決定離職的秘書」，透過丟擲文件的動作，釋放累積已久的壓力。',
        'g8_desc': '一直跑一直跳 一直動手接金幣水果滿分 變帥潮逼逼馬 變成最盟最帥最最快的賽馬郎',
        'g9_desc': '野外求生的第三天到達了飢餓邊緣，在這極限30秒內，持續打氣來煮熟青蛙吧，請小心被牠察覺到你的意圖並逃走！',
        'g10_desc': '身為一名充滿熱情的魔法烘焙師，本來要做出完美的派 🍓🥧，卻在施法時……用了錯誤的魔法咒語 😱✨！ 結果……派 爆走啦！！！ 🧨🤯<br>派變成超派(super pie)居然瘋狂開始朝我丟水果 🍌🍍🍉🍇🍓！！！<br>ㄚㄚㄚㄚ~~ 物痾痾痾物物～～不要再砸了啦！！😭😭<br>再丟下去我這派就 真的不太妙了 🍰💥<br>沒辦法……只好使出這招了 💪🔥<br>👉 水果全反擊！！ 🍓🍋🍉💥<br>準備好讓水果 飛來飛去 🍊✈️🍍✈️<br>展現你的反擊之力吧！！💥🧙‍♂️🎉',
        'g11_desc': '人生的結果是已知的，那要怎麼創造未知的過程<br>玩家將扮演一隻鹹魚，藉由翻身運動來翻面掙扎，表達自己不甘於現狀的心態',
        'g12_desc': '愛麗絲在逃離紅心皇后的追捕時，意外跌入了神秘的魔法空間！？<br>在這重力與方向全都失序的空間，她必須努力穩住身體，閃避四面而來的危險與追兵。<br>抓緊平衡、勇敢前進，讓愛麗絲逃離紅心皇后的魔掌吧！',
        'g13_desc': '這是一個不公平的工作啊<br>欸不是<br>我一隻都沒有漏然後判我輸喔<br>被我拿斧頭打到的死樵夫贏喔<br>有沒有邏輯啊不是啊 <br>我把他打到頭破掉 這樣算我輸喔<br>他亂丟我 我一隻都沒有少ㄟ<br>啊這樣算我輸喔 <br>你們裁判怎麼判的啦<br>好啦 我要回家了啦<br>辭呈送給你啦 乞丐',
        'g14_desc': '面對狡猾的大野狼不斷從四面八方闖入，你必須眼明手快，將牠阻擋在門外！每一次成功守護，都離小羊的安全更近一步🐑🏠<br>你，能守護到最後嗎？',
        'g15_desc': 'Inspired by the iconic leg-rowing of Inlay Lake’s Intha fishermen, this game turns tradition into a fast-paced fitness challenge. Balance, row, and chase the thrill of catching as many fish as you can before time runs out.',
        'g16_desc': 'Our project is inspired by the story of the Muay Thai legend Nai Khanom Tom. <br>Players must coordinate elbow and leg movements to punch the correct buttons in order to defeat the opponent. <br>Within 30 seconds, the more points the player punches, the higher their ranking will be.',
        'g17_desc': 'Inspired by the folklore of The Stone Flower, this game turns the art of stone carving into an engaging mastery challenge. Break through the stone wall, refine your skills, and uncover beauty hidden within the rock. Only true masters can carve the perfect Stone Flower.',
        // 🔥 新增：排行榜欄位
        'lb_rank_col': '排名',
        'lb_name_col': '暱稱',
        'lb_num_col': '編號',
        'lb_score_col': '分數',
        'lb_total_col': '總積分',
        'lb_no_data': '目前尚無資料',
        'lb_loading': '資料更新中...',
        'lb_error': '讀取失敗，請檢查網路'
    },
    
    'en': {
        // Nav
        'nav_info': 'Info', 'nav_sports': 'Sports', 'nav_rank': 'Ranking',
        'close_btn': 'Tap to Close',
        
        // Home
        'about_title': 'About the Event',
        'home_brand': '【ExErcise】Tech × Sports',
        'home_slogan': 'Through breaking tradition, we redefine competitive sports with technology.',
        'home_desc': 'No matter what kind of warrior you are, there is a battlefield for you here.<br>Are you ready to challenge your limits? Come unleash your potential with your companions!',
        'event_items': '7 Competition Events',
        'detail_title': 'Event Details',

        // Tabs
        'tab_schedule': 'Schedule', 'tab_scoring': 'Scoring', 'tab_map': 'Map', 'tab_rules': 'Rules',

        // Schedule
        'batch_1': 'Batch 1', 'batch_2': 'Batch 2', 'batch_3': 'Batch 3', 'batch_4': 'Batch 4', 'batch_5': 'Batch 5',
        'act_reg_1': 'Registration (Batch 1)', 'act_warm_1': 'Warm-up (Batch 1)', 'act_play_1': 'Gameplay (Batch 1)',
        'act_reg_2': 'Registration (Batch 2)', 'act_warm_2': 'Warm-up (Batch 2)', 'act_play_2': 'Gameplay (Batch 2)',
        'act_reg_3': 'Registration (Batch 3)', 'act_warm_3': 'Warm-up (Batch 3)', 'act_play_3': 'Gameplay (Batch 3)',
        'act_reg_4': 'Registration (Batch 4)', 'act_warm_4': 'Warm-up (Batch 4)', 'act_play_4': 'Gameplay (Batch 4)',
        'act_reg_5': 'Registration (Batch 5)', 'act_warm_5': 'Warm-up (Batch 5)', 'act_play_5': 'Gameplay (Batch 5)',
        'rest_noon': 'Lunch Break', 'rest_short': 'Short Break', 'event_closing': 'Closing Ceremony', 'event_photo': 'Group Photo',

        // Scoring
        'score_h1': '1. Seventeen Exercises Championships',
        'score_label_rank': 'Ranking', 'score_text_rank': 'Ranked by score.',
        'score_label_reward': 'Winners and Rewards', 'score_text_reward': 'First in each competition gets a prize.',
        'score_label_tie': 'In Case of a Tie', 'score_text_tie': 'In case of a tie, priority is given to the one who registered in the earlier batch.',
        'score_h2': '2. Collective Score Tournament',
        'score_sub_calc': 'Points Definition', 'score_desc_calc': 'Top 10 in each exercise get points:',
        'rank_1': '1st', 'rank_2': '2nd', 'rank_others': '...and so on', 'rank_10': '10th',
        'score_sub_method': 'Score Calculation',
        'score_li_1': 'There are 7 categories in total.',
        'score_li_2': 'If you participate in multiple competitions within the same category, only the highest score is counted.',
        'score_sub_total': 'Ranking and Winners',
        'score_li_3': 'Sum of points from 7 categories. Higher score ranks higher.',
        'score_li_4': 'Top 3 overall get rewards.',

        // Rules
        'rule_h1': '1. Online Registration',
        'rule_li_1': 'Reservation only. 34 people per batch.',
        'rule_li_2': 'A confirmation email will be sent within 2 days after registration.',
        'rule_li_3': 'If nothing was received, please contact us by 12/26 (Fri).',
        'rule_h2': '2. Competition Guidelines',
        'rule_li_4': 'Upon registration, you will receive a "wristband" for scoring. Please return it upon exit.',
        'rule_li_5': 'Please wear appropriate clothing, like sportswear and sports shoes for your safety.',
        'rule_li_6': 'Remember to pay attention to your physical condition during the challenge.',
        'note_title': '【Notice】',
        'note_content': 'Participants with physical discomfort, heart disease, high blood pressure, neck/back problems, or are pregnant are not advised to participate.<br>Please monitor your health. If you feel unwell, do not force yourself. Participation is at your own risk.<br><br>*This event is the Sophomore Project Exhibition of NTUT Interaction Design Class 113. All tech-sports games are in the prototype testing phase.*<br>*We appreciate your understanding for any imperfections.*',

        // Footer
        'footer_host': 'Organizer:', 'footer_co': 'Co-organizer:',
        'footer_dept': 'NTUT Interaction Design 113', 'footer_locked': 'To Be Determined', 'btn_ig': 'Follow Instagram',

        // Leaderboard
        'lb_title': 'Ranking', 'lb_loading': 'Loading...', 'lb_all': 'Collective Score Tournament',

        // Categories & Labels
        'cat_focus': 'Focus', 'cat_reaction': 'Reaction', 'cat_agility': 'Agility', 'cat_endurance': 'Endurance',
        'cat_explosive': 'Explosive Power', 'cat_coordination': 'Coordination', 'cat_intellect': 'Intellect',
        'label_intro': 'Introduction', 'label_members': 'Team Members', 'label_advisor': 'Advisor',

        // Group Names
        'g1_name': 'Project Bacon', 'g2_name': 'PECOPECO', 'g3_name': 'SOS:Snap Or Scrap', 'g4_name': 'Macho Magic:Sweat It Out!',
        'g5_name': 'PENGRGB squad', 'g6_name': 'Pigeon The finder', 'g7_name': 'I Quit!', 'g8_name': 'umaro',
        'g9_name': 'Boiling Frog', 'g10_name': 'Super Pie Party', 'g11_name': 'Turn The Table', 'g12_name': 'hurry down',
        'g13_name': 'Labor in God’s Realm', 'g14_name': 'Baa Hind the Door',
        'g15_name': 'Legend of the rower', 'g16_name': 'Legend of MUAY THAI', 'g17_name': 'THE STONE FLOWER',

        // Group Descriptions (English)
        'g1_desc': '"Project Bacon" is a reaction game combining rhythm and action, adapted from the Three Little Pigs. Players play as the Big Bad Wolf, breaking through the pigs\' attacks in a chaotic rhythm battle.',
        'g2_desc': '"PECOPECO" is a cute interactive reaction game! Holding a pineapple cake, catch the moment when the Formosan Black Bear, Leopard Cat, and Magpie open their mouths to feed them. Tame them within 30 seconds!',
        'g3_desc': 'Adapted from the legend of the High-Speed Grandma, testing agility and reaction. Players must dodge cars while using a Pilates ring to capture clear photos of the grandma. Earn the highest bounty!',
        'g4_desc': 'Pull out your sword from the stone, defeat the evil wizard Merlin, and fling out sweat 💦 and muscle 💪‼️<br>Become a bodybuilding chanter‼️',
        'g5_desc': 'You are right👍, but 《PENGRGB squad》🐧🐧🐧 is a rhythm🎵-based action🦵🦵 game independently developed💡 by Group 5️⃣.The story takes place🌍 on a continent known as the「 South Pole🥶」. One day, a ship🚢 accidentally crashes into an iceberg 💥🧊, causing mysterious substances to leak out😱 🧪. As a result, some penguins become mutated... into zombies! 🧟‍♂️🧟‍♂️⁉️You🫵 will take on the role of a member of the PENGRGB squad 🐧🎨, harnessing the penguins’ special powers 😏 to restore balance to the land. By ☠️matching colors🎶 and💨 rhythms 👣🔘, you will eliminate the mutated penguins 👊🧟❌, defeat the ZOMBIE👊😡, regain the lost peace 😌😌, and along the journey👣👣, rediscover the beauty of penguins 🐧❤️🐧💚🐧💙.',
        'g6_desc': '"Bros, rely on you!" Transform into a pigeon on Noah\'s Ark. Flap your wings, dodge obstacles, and find the olive branch of hope in the flood!',
        'g7_desc': 'In a workplace oppressed by a boss, the secretary chooses not to endure anymore.<br>Set in an exaggerated workplace, play as the "Quitting Secretary" and throw documents to release stress.',
        'g8_desc': 'Run, jump, and catch coins and fruits. Become the coolest, handsomest, and fastest Horse Man.',
        'g9_desc': 'On the 3rd day of survival, hunger strikes. Within 30 seconds, pump air to boil the frog, but be careful not to let it notice and escape!',
        'g10_desc': 'As a magic baker, a spell went wrong 😱✨! The Super Pie went crazy and started throwing fruits 🍌🍍. Fight back!! 🍓🍋🍉💥 Use your counterattack power to deflect the fruits.',
        'g11_desc': 'The outcome of life is predetermined, so how can we create an unknown journey within it?In this game, the player takes on the role of a salted fish, struggling to flip over through repeated motions, embodying a mindset that refuses to accept the status quo.',
        'g12_desc': 'Alice fell into a mysterious magic space while escaping the Queen of Hearts!?<br>In this disordered space, stabilize your body, dodge dangers, and help Alice escape!',
        'g13_desc': 'This is unfair work.<br>Wait, no.<br>I didn\'t miss one, but I lost?<br>The woodcutter who hit me with an axe won?<br>Where is the logic?<br>I hit his head, and I lose?<br>He threw stuff at me, I didn\'t miss any.<br>And I lose?<br>How do you referees judge?<br>Fine, I\'m going home.<br>Here\'s my resignation, beggar.',
        'g14_desc': 'Facing the sly big bad wolf charging in from every direction, you must react fast and keep it out of the door！With every successful defense, you bring the little lambs one step closer to safety 🐑🏠<br>Can you protect them until the very end?',
        'g15_desc': 'Inspired by the iconic leg-rowing of Inlay Lake’s Intha fishermen, this game turns tradition into a fast-paced fitness challenge. Balance, row, and chase the thrill of catching as many fish as you can before time runs out.',
        'g16_desc': 'Our project is inspired by the story of the Muay Thai legend Nai Khanom Tom. <br>Players must coordinate elbow and leg movements to punch the correct buttons in order to defeat the opponent. <br>Within 30 seconds, the more points the player punches, the higher their ranking will be.',
        'g17_desc': 'Inspired by the folklore of The Stone Flower, this game turns the art of stone carving into an engaging mastery challenge. Break through the stone wall, refine your skills, and uncover beauty hidden within the rock. Only true masters can carve the perfect Stone Flower.',
        // 🔥 新增：排行榜欄位
        'lb_rank_col': 'Rank',
        'lb_name_col': 'Nickname',
        'lb_num_col': 'ID',
        'lb_score_col': 'Score',
        'lb_total_col': 'Total',
        'lb_no_data': 'No Data Available',
        'lb_loading': 'Updating...',
        'lb_error': 'Load Error'
    }
};

let currentLang = 'zh';

// 修改後的切換語言函式 (含過場動畫)
function toggleLanguage() {
    const overlay = document.getElementById('transition-overlay');
    
    // 1. 顯示過場動畫
    overlay.classList.add('active');

    // 2. 設定一個延遲 (例如 500毫秒 = 0.5秒)，讓畫面先變白，再偷偷換文字
    setTimeout(() => {
        const btnText = document.querySelector('#lang-btn .lang-text');
        
        // 切換語言邏輯
        if (currentLang === 'zh') {
            currentLang = 'en';
            btnText.innerText = '中'; 
        } else {
            currentLang = 'zh';
            btnText.innerText = 'EN';
        }

        // 執行翻譯 (這時候畫面被遮住了，使用者看不到文字跳動)
        applyTranslations();

        // 如果在排行榜頁面，也順便更新
        if (document.getElementById('view-leaderboard').classList.contains('active')) {
            updateLeaderboard(currentSheet); 
        }

        // 3. 翻譯好之後，稍微再等一下下再把遮罩關掉，感覺比較順
        setTimeout(() => {
            overlay.classList.remove('active');
        }, 300);

    }, 500); // 這裡控制遮罩要停留多久 (500 = 0.5秒)
}

function applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        
        if (translations[currentLang][key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translations[currentLang][key];
            } else {
                el.innerHTML = translations[currentLang][key]; 
            }
        }
    });
}
// ==========================================
// 🔥 新增：啟動畫面控制 (Splash Screen Control)
// ==========================================
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    
    // 為了美觀，即便載入很快也強制讓它顯示 1.2 秒
    setTimeout(() => {
        splash.classList.add('fade-out');
        
        // 動畫結束後完全從 DOM 移除（選用，可避免擋住點擊）
        setTimeout(() => {
            splash.style.display = 'none';
        }, 600);
    }, 1200); 
});