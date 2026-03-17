/* =========================================
   🔥 強制重整後回到最上方 (手機電腦通吃終極版)
   ========================================= */
// 1. 關閉瀏覽器預設的「記住捲動位置」功能
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// 2. 獨立寫一個強制回頂部的函數，多管齊下
function forceScrollToTop() {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;             // 專治手機版 Safari
    document.documentElement.scrollTop = 0;  // 專治手機版 Chrome
}

// 3. 第一道防線：DOM 結構一出來就先推回去
document.addEventListener('DOMContentLoaded', forceScrollToTop);

// 4. 第二道防線：等所有圖片跟資源都載入完，再強制推一次
window.addEventListener('load', function() {
    forceScrollToTop();
    
    // 🌟 第三道防線：給手機版瀏覽器 100 毫秒的緩衝時間，確保它不會又滑下去
    setTimeout(forceScrollToTop, 100);
});

// ==========================================
// 1. 漢堡選單、導覽切換與多語言整合 (全新版)
// ==========================================
const menuBtn = document.getElementById('menu-btn');
const fullMenu = document.getElementById('full-menu');
const menuLinks = document.querySelectorAll('.mega-link, .desktop-link, .header-logo');

/* 🔥 就是漏了下面這兩行，把它們補回來！ */
const newLangBtn = document.getElementById('new-lang-btn');
const pages = document.querySelectorAll('.page-view');

let leaderboardInterval = null;

// --- A. 漢堡按鈕開關邏輯 ---
menuBtn.addEventListener('click', () => {
    // 切換按鈕的打叉動畫與選單的顯示狀態
    menuBtn.classList.toggle('open');
    fullMenu.classList.toggle('active');
    
    // 當選單打開時，鎖定背景不讓它滾動
    if (fullMenu.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
});

// --- B. 點擊選單連結切換頁面 (加入大頁面專屬 Loading) ---
menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.dataset.target;
        const targetPage = document.getElementById(targetId);

        if (!targetPage) return;

        // 🌟 新增：只要使用者點擊進入「排行榜」，就自動幫他抓取最新資料！
        if (targetId === 'view-leaderboard') {
            updateLeaderboard(currentSheet);
        }

        // 🌟 核心修改：如果點擊的是「當前已經在的頁面」，不要罷工，讓他平滑滾動到最上方！
        if (targetPage.classList.contains('active')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // 順手關閉手機版的滿版選單
            menuBtn.classList.remove('open');
            fullMenu.classList.remove('active');
            document.body.style.overflow = '';
            return; 
        }

        const transitionOverlay = document.getElementById('transition-overlay');

        // 1. 顯示短短的 Loading 動畫
        if (transitionOverlay) transitionOverlay.classList.add('active');

        // 2. 處理導覽列 UI 狀態與關閉漢堡選單
        menuLinks.forEach(l => l.classList.remove('active'));
        document.querySelectorAll(`[data-target="${targetId}"]`).forEach(el => {
            el.classList.add('active');
        });
        menuBtn.classList.remove('open');
        fullMenu.classList.remove('active');
        document.body.style.overflow = ''; 

        // 優先觸發手機版紫色導覽列更新
        if(typeof updateMobileHeader === 'function') updateMobileHeader(targetId);

        // 3. 延遲 300 毫秒切換內容
        setTimeout(() => {
            pages.forEach(page => page.classList.remove('active'));
            targetPage.classList.add('active');
            window.scrollTo(0, 0);

            // 4. 內容切換完成，拿掉 Loading 遮罩
            setTimeout(() => {
                if (transitionOverlay) transitionOverlay.classList.remove('active');
            }, 50); 

        }, 300); 
    });
});

// --- C. 全新語言切換邏輯 (綁定漢堡選單內的按鈕) ---
if (newLangBtn) {
    newLangBtn.addEventListener('click', () => {
        const transitionOverlay = document.getElementById('transition-overlay');
        
        // 1. 為了體驗順暢，按下去先關閉漢堡選單
        menuBtn.classList.remove('open');
        fullMenu.classList.remove('active');
        document.body.style.overflow = '';

        // 2. 顯示過場載入動畫
        if (transitionOverlay) transitionOverlay.classList.add('active');

        // 3. 延遲 0.5 秒偷偷換文字
        setTimeout(() => {
            if (currentLang === 'zh') {
                currentLang = 'en';
                newLangBtn.innerText = '中文'; // 切成英文後，按鈕顯示中文選項
            } else {
                currentLang = 'zh';
                newLangBtn.innerText = 'EN';
            }

            // 執行翻譯
            if (typeof applyTranslations === 'function') applyTranslations();

            // 若在排行榜頁面，同步更新
            if (document.getElementById('view-leaderboard').classList.contains('active')) {
                if (typeof updateLeaderboard === 'function') updateLeaderboard(currentSheet);
            }

            // 4. 翻譯好後，稍微等一下再把遮罩關掉
            setTimeout(() => {
                if (transitionOverlay) transitionOverlay.classList.remove('active');
            }, 300);

        }, 500); 
    });
}

/* =========================================
   🔥 跑馬燈自動無限循環 (完美無縫雙等份版)
   ========================================= */
function initMarquee() {
    const scroller = document.querySelector('.pixel-ticker-scroller');
    if (!scroller) return;

    // 🌟 手機防閃保護：如果寬度沒變（例如只是上下滑動造成網址列縮放），就不重新計算
    if (scroller.dataset.initialized === 'true' && window.innerWidth === parseInt(scroller.dataset.lastWidth)) {
        return;
    }

    // 抓取 HTML 中原始的那一組文字
    let inner = scroller.querySelector('.scroller-inner');
    if (!inner) return;

    // 暫時清空容器，只保留原始組件來計算寬度
    scroller.innerHTML = '';
    scroller.appendChild(inner);

    const itemWidth = inner.offsetWidth;
    const screenWidth = window.innerWidth;

    // 計算填滿「一個螢幕寬度」所需要的複製次數
    const neededCopies = Math.max(1, Math.ceil(screenWidth / itemWidth));

    // 創建「前半段」(Half 1)
    const half1 = document.createElement('div');
    half1.style.display = 'flex';
    half1.style.flexShrink = '0';
    for (let i = 0; i < neededCopies; i++) {
        half1.appendChild(inner.cloneNode(true));
    }

    // 創建「後半段」(Half 2) - 完全複製前半段
    const half2 = half1.cloneNode(true);
    half2.setAttribute('aria-hidden', 'true'); // 讓語音朗讀器忽略後半段

    // 將兩半放回捲動容器中
    scroller.innerHTML = '';
    scroller.appendChild(half1);
    scroller.appendChild(half2);

    // 標記完成並記錄當前寬度
    scroller.dataset.initialized = 'true';
    scroller.dataset.lastWidth = window.innerWidth;
}

// 網頁載入時執行
document.addEventListener('DOMContentLoaded', initMarquee);

// 視窗縮放時防抖動執行
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(initMarquee, 200);
});

// ==========================================
// 2. 賽事細節分頁 (縱向按鈕 + 搖桿切換 加強版)
// ==========================================
const detailBtns = document.querySelectorAll('.detail-tab-btn');
const detailContents = document.querySelectorAll('.detail-content');
// 🔥 新增：選取搖桿按鈕
const prevDetailBtn = document.getElementById('prev-detail-btn');
const nextDetailBtn = document.getElementById('next-detail-btn');

// --- 功能 A: 核心切換函式 ---
function switchDetailTab(targetBtn) {
    if (!targetBtn) return;

    // 1. 取得目標內容 ID
    const targetId = targetBtn.dataset.target;
    const targetDiv = document.getElementById(targetId);

    if (!targetDiv) {
        console.error("找不到內容區塊 ID: " + targetId);
        return;
    }

    // 2. 按鈕狀態切換 (這會觸發 CSS 的螢光綠背景、字體變大)
    detailBtns.forEach(b => b.classList.remove('active'));
    targetBtn.classList.add('active');

    // 3. 內容切換
    detailContents.forEach(content => content.classList.remove('active'));
    targetDiv.classList.add('active');
}

// --- 功能 B: 初始化函式 ---
function initDetailTabs() {
    // 移除原本舊版的 moveIndicator 呼叫
    const activeBtn = document.querySelector('.detail-tab-btn.active');
    if (activeBtn) {
        switchDetailTab(activeBtn); // 強制執行一次切換邏輯，確保 CSS 選取狀態正確
    }
}

// 監聽網頁載入
window.addEventListener('load', initDetailTabs);
// 視窗縮放 (RWD)：舊版的對齊邏輯在 CSS 處理，這裡不需要 moveIndicator，但可以保留 init 確保狀態
window.addEventListener('resize', initDetailTabs);

// --- 功能 C: 監聽原本按鈕的點擊 ---
detailBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        switchDetailTab(btn); // 點擊直接切換
    });
});

// --- 🔥 功能 D: 監聽紫色搖桿的切換 (新增) ---

// 切換的邏輯：找出下一個按鈕
function navigateDetailTabs(direction) {
    // 1. 先找出目前是哪個按鈕被選取 (active)
    const currentActiveBtn = document.querySelector('.detail-tab-btn.active');
    
    // 將所有按鈕轉換成陣列，方便尋找 Index
    const btnsArray = Array.from(detailBtns);
    const currentIndex = btnsArray.indexOf(currentActiveBtn);
    let targetIndex;

    if (direction === 'next') {
        // 下一個，如果到最後一個就循環回第一個
        targetIndex = (currentIndex + 1) % btnsArray.length;
    } else if (direction === 'prev') {
        // 上一個，如果到第一個就循環到最後一個
        targetIndex = (currentIndex - 1 + btnsArray.length) % btnsArray.length;
    }

    // 2. 找到目標按鈕，並觸發切換
    const targetBtn = btnsArray[targetIndex];
    if (targetBtn) {
        switchDetailTab(targetBtn);
    }
}

// 綁定搖桿按鈕事件
if (prevDetailBtn && nextDetailBtn) {
    // 上一個 (左箭頭)
    prevDetailBtn.addEventListener('click', () => {
        navigateDetailTabs('prev');
    });

    // 下一個 (右箭頭)
    nextDetailBtn.addEventListener('click', () => {
        navigateDetailTabs('next');
    });
}

// ==========================================
// 🌟 新增：Day 1 / Day 2 時程表日期切換邏輯
// ==========================================
const dayTabBtns = document.querySelectorAll('.day-tab-btn');
const dayContents = document.querySelectorAll('.day-content');

dayTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // 1. 移除所有日期按鈕的 active 狀態
        dayTabBtns.forEach(b => b.classList.remove('active'));
        // 2. 移除所有日期內容的 active 狀態
        dayContents.forEach(c => c.classList.remove('active'));

        // 3. 把點擊的按鈕加上 active
        btn.classList.add('active');
        
        // 4. 找到對應的內容區塊 (day1 或 day2) 並顯示
        const targetDayId = btn.dataset.day;
        const targetContent = document.getElementById(targetDayId);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    });
});

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
// 5. 組別展開功能 (含隱藏導覽列功能)
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
    "G14": ["img/14.webp","img/14 (1).webp", "img/14 (2).webp", "img/14 (3).webp"]
};

// DOM 元素選取
const overlay = document.getElementById('clone-overlay');
const overlayTitle = overlay.querySelector('.overlay-title');
const overlayDesc = overlay.querySelector('.overlay-desc');
const overlayBadge = overlay.querySelector('.overlay-badge');
const overlayBody = overlay.querySelector('.overlay-body');
const overlayScrollContainer = overlay.querySelector('.overlay-scroll-container');

// 滑動相關元素
const sliderTrack = overlay.querySelector('.overlay-slider-track');
const sliderCounter = overlay.querySelector('.overlay-image-counter');
const prevBtn = overlay.querySelector('.prev-btn');
const nextBtn = overlay.querySelector('.next-btn');

// 🔥 核心變數 (絕對不能刪掉這兩行)
let currentImages = []; 
let currentSlideIndex = 0; 

// 全螢幕相關元素
const lightbox = document.getElementById('fullscreen-lightbox');
const lightboxTrack = lightbox.querySelector('.lightbox-track');
const lightboxCounter = lightbox.querySelector('.lightbox-counter');
const lightboxClose = lightbox.querySelector('.lightbox-close');

// --- 功能 A: 開啟詳情頁 (Overlay) ---
function openOverlay(card) {
    try {
        document.body.classList.add('lock-scroll');

        // 🌟 觸發隱藏導覽列
        const header = document.querySelector('.top-header');
        if (header) header.classList.add('header-hidden');

        // 1. 抓取基本文字資料
        const badgeElement = card.querySelector('.group-badge');
        const titleElement = card.querySelector('h3');
        const descElement = card.querySelector('.group-info p');
        const imgElement = card.querySelector('.group-img');
        const hiddenBody = card.querySelector('.group-content-inner');

        const badgeText = badgeElement ? badgeElement.innerText : ""; 
        const titleText = titleElement ? titleElement.innerText : "";
        const descText = descElement ? descElement.innerText : "";
        const originalImgSrc = imgElement ? imgElement.src : "";

        // 2. 準備圖片資料
        if (GROUP_GALLERY[badgeText]) {
            currentImages = GROUP_GALLERY[badgeText];
        } else {
            currentImages = [originalImgSrc];
        }

        // 3. 填入文字
        if (overlayBadge) overlayBadge.innerText = badgeText;
        if (overlayTitle) overlayTitle.innerText = titleText;
        if (overlayDesc) overlayDesc.innerText = descText;
        if (overlayBody) overlayBody.innerHTML = hiddenBody ? hiddenBody.innerHTML : "";

        // 4. 初始化滑動器
        initSlider(sliderTrack, currentImages, 'overlay-slide-img');
        
        currentSlideIndex = 0; 
        updateCounter(sliderCounter, 1, currentImages.length);
        if (sliderTrack) sliderTrack.style.transform = `translateX(0px)`; 

        // 邏輯：如果只有一張圖，就隱藏左右按鈕
        if (prevBtn && nextBtn) {
            if (currentImages.length <= 1) {
                prevBtn.style.display = 'none';
                nextBtn.style.display = 'none';
            } else {
                prevBtn.style.display = '';
                nextBtn.style.display = '';
            }
        }

        // 5. 顯示 Overlay
        if(overlayScrollContainer) overlayScrollContainer.scrollTop = 0;
        if (overlay) {
            overlay.classList.remove('overlay-hidden');
            requestAnimationFrame(() => {
                overlay.classList.add('active');
            });
        }
    } catch (error) {
        console.error("開啟組別時發生錯誤：", error);
    }
}

// --- 功能 B: 初始化滑動軌道 ---
function initSlider(trackElement, images, imgClass) {
    if (!trackElement) return;
    trackElement.innerHTML = ''; 
    images.forEach((src, index) => {
        const img = document.createElement('img');
        img.src = src;
        img.className = imgClass; 
        if (imgClass === 'overlay-slide-img') {
            img.onclick = () => openLightbox(index);
        }
        trackElement.appendChild(img);
    });
}

// --- 功能 C: 更新計數器文字 ---
function updateCounter(element, current, total) {
    if (element) element.innerText = `${current}/${total}`;
}

// --- 功能 G: 電腦版按鈕切換邏輯 ---
function changeOverlaySlide(direction) {
    const total = currentImages.length;
    if (total <= 1 || !sliderTrack) return; 

    if (direction === 'next') {
        if (currentSlideIndex < total - 1) currentSlideIndex++;
    } else if (direction === 'prev') {
        if (currentSlideIndex > 0) currentSlideIndex--;
    }

    const width = sliderTrack.offsetWidth;
    const currentTranslate = currentSlideIndex * -width;
    
    sliderTrack.style.transition = 'transform 0.3s ease-out';
    sliderTrack.style.transform = `translateX(${currentTranslate}px)`;
    
    updateCounter(sliderCounter, currentSlideIndex + 1, total);

    setTimeout(() => {
        sliderTrack.style.transition = 'none';
    }, 300);
}

if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        changeOverlaySlide('prev');
    });
}
if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        changeOverlaySlide('next');
    });
}

// --- 功能 D: 通用滑動邏輯 (手機觸控用) ---
function enableSwipe(trackElement, counterElement, isLightbox = false) {
    if (!trackElement) return;
    let startX = 0, startY = 0, currentTranslate = 0, prevTranslate = 0;
    let isDragging = false, animationID, isHorizontal = null; 

    trackElement.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
        isHorizontal = null; 
        animationID = requestAnimationFrame(animation);
        if(!isLightbox) {
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
            isHorizontal = Math.abs(diffX) > Math.abs(diffY);
        }

        if (isHorizontal) {
            if (e.cancelable) e.preventDefault(); 
            currentTranslate = prevTranslate + diffX; 
        }
    }, { passive: false });

    trackElement.addEventListener('touchend', (e) => {
        isDragging = false;
        cancelAnimationFrame(animationID);

        if (isHorizontal) {
            const movedBy = currentTranslate - prevTranslate;
            const threshold = 50; 
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
            trackElement.style.transform = `translateX(${currentTranslate}px)`;
            requestAnimationFrame(animation);
        }
    }

    function setPositionByIndex() {
        const width = trackElement.offsetWidth;
        currentTranslate = currentSlideIndex * -width;
        trackElement.style.transition = 'transform 0.3s ease-out';
        trackElement.style.transform = `translateX(${currentTranslate}px)`;
        setTimeout(() => trackElement.style.transition = 'none', 300);
        updateCounter(counterElement, currentSlideIndex + 1, currentImages.length);
    }
}

enableSwipe(sliderTrack, sliderCounter, false);

// --- 功能 E: 全螢幕 Lightbox 邏輯 ---
const lbPrevBtn = lightbox ? lightbox.querySelector('.prev-btn') : null;
const lbNextBtn = lightbox ? lightbox.querySelector('.next-btn') : null;
let currentLightboxIndex = 0;

function openLightbox(startIndex) {
    if (!lightbox) return;
    initSlider(lightboxTrack, currentImages, 'lightbox-img');
    currentLightboxIndex = startIndex;
    updateLightboxPosition(false); 
    checkLightboxButtons();
    lightbox.classList.add('active');
    setupLightboxSwipe();
}

function updateLightboxPosition(enableTransition = true) {
    if (!lightboxTrack) return;
    const width = window.innerWidth;
    const translate = currentLightboxIndex * -width;
    lightboxTrack.style.transition = enableTransition ? 'transform 0.3s ease-out' : 'none';
    lightboxTrack.style.transform = `translateX(${translate}px)`;
    updateCounter(lightboxCounter, currentLightboxIndex + 1, currentImages.length);
    if (enableTransition) {
        setTimeout(() => lightboxTrack.style.transition = 'none', 300);
    }
}

function checkLightboxButtons() {
    if (!lbPrevBtn || !lbNextBtn) return;
    if (currentImages.length <= 1) {
        lbPrevBtn.style.display = 'none';
        lbNextBtn.style.display = 'none';
    } else {
        lbPrevBtn.style.display = ''; 
        lbNextBtn.style.display = '';
    }
}

function changeLightboxSlide(direction) {
    const total = currentImages.length;
    if (total <= 1) return;
    if (direction === 'next' && currentLightboxIndex < total - 1) currentLightboxIndex++;
    else if (direction === 'prev' && currentLightboxIndex > 0) currentLightboxIndex--;
    updateLightboxPosition(true);
}

if(lbPrevBtn) lbPrevBtn.onclick = (e) => { e.stopPropagation(); changeLightboxSlide('prev'); };
if(lbNextBtn) lbNextBtn.onclick = (e) => { e.stopPropagation(); changeLightboxSlide('next'); };

function setupLightboxSwipe() {
    if (!lightboxTrack) return;
    let startX = 0, isDragging = false;
    lightboxTrack.ontouchstart = (e) => { startX = e.touches[0].clientX; isDragging = true; lightboxTrack.style.transition = 'none'; };
    lightboxTrack.ontouchmove = (e) => {
        if (!isDragging) return;
        const diff = e.touches[0].clientX - startX;
        lightboxTrack.style.transform = `translateX(${(currentLightboxIndex * -window.innerWidth) + diff}px)`;
        e.preventDefault(); 
    };
    lightboxTrack.ontouchend = (e) => {
        isDragging = false;
        const diff = e.changedTouches[0].clientX - startX;
        if (diff < -50 && currentLightboxIndex < currentImages.length - 1) currentLightboxIndex++;
        else if (diff > 50 && currentLightboxIndex > 0) currentLightboxIndex--;
        updateLightboxPosition(true);
    };
}

if(lightboxClose) {
    lightboxClose.addEventListener('click', () => lightbox.classList.remove('active'));
}

// --- 功能 F: 關閉詳情頁 ---
function closeOverlay() {
    if (!overlay) return;
    overlay.classList.remove('active');
    
    // 🌟 恢復顯示導覽列
    const header = document.querySelector('.top-header');
    if (header) header.classList.remove('header-hidden');

    setTimeout(() => {
        overlay.classList.add('overlay-hidden');
        document.body.classList.remove('lock-scroll');
        currentSlideIndex = 0;
        if (sliderTrack) sliderTrack.style.transform = `translateX(0px)`;
    }, 300);
}

// 綁定點擊卡片事件 (這裡最重要，確保卡片點得開)
const cards = document.querySelectorAll('.group-card');
cards.forEach(card => {
    // 為了防止重複綁定，先移除再綁定 (安全機制)
    const newCard = card.cloneNode(true);
    card.parentNode.replaceChild(newCard, card);
    newCard.addEventListener('click', () => openOverlay(newCard));
});

// 🌟 綁定新的左上角返回按鈕
const overlayBackBtn = document.getElementById('overlay-back-btn');
if (overlayBackBtn) {
    overlayBackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeOverlay();
    });
}

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
        'event_title': '關於本次賽事',
        'detail_title': '賽事細節',
        'hero_welcome_1': '歡迎來到',
        'hero_welcome_2': '科技x運動體適能挑戰賽',
        'event_p1': '【ExErcise 2.0】科技運動體適能挑戰賽',
        'event_p2': '17 個互動關卡 × 30 秒極限挑戰！',
        'event_p3': '測試你的七大運動能力，解鎖專屬「體適能報表」與「AI 數據角色卡」。',
        'event_p4': '想知道你的極限在哪？北科大互動設計系 × 迪卡儂中和店等你來戰！',

        // 分頁按鈕
        'tab_schedule': '時程表', 'tab_scoring': '計分方法', 'tab_map': '賽事地圖', 'tab_rules': '競賽辦法',

        // 時程表
        'batch_1': '第一梯次', 'batch_2': '第二梯次', 'batch_3': '第三梯次', 'batch_4': '第四梯次', 'batch_5': '第五梯次',
        'act_reg_1': '第一梯次報到', 'act_warm_1': '第一梯次熱身', 'act_play_1': '第一梯次體驗遊玩',
        'act_reg_2': '第二梯次報到', 'act_warm_2': '第二梯次熱身', 'act_play_2': '第二梯次體驗遊玩',
        'act_reg_3': '第三梯次報到', 'act_warm_3': '第三梯次熱身', 'act_play_3': '第三梯次體驗遊玩',
        'act_reg_4': '第四梯次報到', 'act_warm_4': '第四梯次熱身', 'act_play_4': '第四梯次體驗遊玩',
        'act_reg_5': '第五梯次報到', 'act_warm_5': '第五梯次熱身', 'act_play_5': '第五梯次體驗遊玩',

        // 計分方法
        'score_h1': '一、個人單項挑戰',
        'score_label_rank': '排名方式', 'score_text_rank': '比賽期間將自動登錄參賽者成績，由各項目計分方式進行排序。',
        'score_label_reward': '獎勵機制', 'score_text_reward': '各單項取第一名給予獎勵。',
        'score_label_tie': '同分判定', 'score_text_tie': '如遇成績相同（同分）之情況，將依較早完成報到者排名優先。',
        'score_h2': '二、個人全項總積分',
        'score_sub_calc': '積分換算', 'score_desc_calc': '各單項排名前十名者可獲得對應積分：',
        'rank_1': '第 1 名', 'rank_2': '第 2 名', 'rank_others': '...以此類推', 'rank_10': '第 10 名',
        'score_sub_method': '採計方式',
        'score_li_1': '本賽事共分為七大類別。',
        'score_li_2': '若於同一大類別中參與多個項目並皆獲得積分，將取最高分之項目，作為該類別的最終積分。',
        'score_sub_total': '總排名與獎勵',
        'score_li_3': '七大項目積分進行結算，加總積分越多排名越前，總排名前三名給予獎勵。',

        // 競賽辦法
        'rule_h1': '參賽須知',
        'rule_li_1': '完成報到後，將發放「參賽編號手環」用於紀錄競賽成績；活動期間請妥善保管手環，並於離場時繳回服務處，參賽者們於競賽期間請小心保管，若有遺失或損壞，須照價賠償。',
        'rule_li_2': '請務必穿著適合運動的服裝與運動鞋，以確保活動安全。',
        'rule_li_3': '基於安全維護考量，12 歲以下孩童參與本活動時，請務必由監護人在旁陪同照顧。',
        'rule_li_4': '為維護賽事公平性與安全，請所有參賽者於賽前確實掌握賽事規範與各項流程細節。',
        'rule_h2': '權益聲明',
        'rule_li_5': '請注意隨身之物品金錢及貴重物品，若有遺失恕不負責',
        'rule_li_6': '蒐集之個人資料僅供本活動及相關或後續活動之聯繫與活動作業使用，並僅限本單位及迪卡儂於活動執行範圍內使用。',
        'rule_li_7': '大會有權將此項比賽錄影、相片及成績於世界各地播放、展出、登錄於主辦單位授權網站與刊物上，參賽者必須同意肖像與成績，用於相關比賽之宣傳與播放活動上。若不同意上述事項，請勿報名參賽。',
        'rule_li_8': '如遇不可抗力之因素（如天災或天候不佳等）所迫，大會得考量安全等因素將活動取消、延期，相關資訊將於活動前公告於活動官網，恕不另行通知。',
        'rule_li_9': '參賽者一旦報名，視同同意本次賽事簡章的所有規定，主辦單位保有修改活動條款及細則之權利，以上章程事項如有未盡事宜，主辦單位得隨時修訂之，恕不另行通知。如有任何爭議，大會保留最終決定權。',
        'note_title': '【注意事項】',
        'note_content': '提醒有任何身體不適、心臟病、高血壓、頸部或背部問題、孕婦者不宜參與。<br>請參賽者留意自身健康狀況，若感到不適，建議不要勉強參加。如仍決定參與，請自行承擔相關風險。',

        // Footer
        'footer_host': '主辦單位：', 'footer_co': '合作單位：',
        'footer_dept': '國立臺北科技大學 113級互動設計系', 'footer_locked': '迪卡儂 新北中和店', 'btn_ig': '追蹤官方IG',

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
        'lb_error': '讀取失敗，請檢查網路',

        // 🔥 新增：全站其他遺漏翻譯
        'mega_highlight': '● 回顧精彩亮點',
        'mega_exe1_web': 'ExE 1.0官方網站',
        'mega_exe1_vid': 'ExE 1.0回顧影片',
        'mega_address': '國立臺北科技大學<br>互動設計系 113級',
        'splash_text': 'Loading… Opening the .exe file',
        'ht_left': '17關全能挑戰',
        'ht_right': 'EXERCISE 2.0',
        'hero_bottom_1': '突破關卡、獨自升級<br>一起奔向最終章',
        'ixd_title': '互動設計系',
        'ixd_desc': '互動設計系跨足運動科技，致力將肢體動作與感測技術深度融合。<br>讓數位科技釋放競技極限，探索體育與科技的交匯可能。',
        'day1_tab': 'Day 1 (3/28)',
        'day2_tab': 'Day 2 (3/29)',
        'sch_warmup': '熱身報到',
        'sch_play': '遊玩時間',
        'map_locked': '尚未解鎖',
        'footer_highlight': '● 回顧精彩亮點',
        'btn_back': '返回',

        // 🔥 新增：組別成員與指導老師 (ZH)
        'g1_m1': '睡美人的肝臟設計師｜陳孝宣',
        'g1_m2': '壞巫婆的假牙設計師｜楊依韻',
        'g1_m3': '白雪公主的腋毛設計師｜王政諺',
        'g1_m4': '神仙教母的帽子設計師｜陳家蓁',
        'g2_m1': '腦袋空空設計師｜徐郁銓',
        'g2_m2': '吃個桃桃設計師｜郭純希',
        'g2_m3': '綠茶多多設計師｜牧彩香',
        'g2_m4': '人好睏睏設計師｜黃俊凱',
        'g3_m1': '青箭口香糖 #牛逼 U呢體程式設計師｜謝瑋庭',
        'g3_m2': '巧克力香蕉 #超頂軟硬體連接設計師｜莊婷伃',
        'g3_m3': '芝士大漢堡 #要拼主視覺美術設計師｜林科余',
        'g3_m4': '自清的橘子 #超扯點子王硬體設計師｜羅至侑',
        'g4_m1': '大總裁介面設計師｜陳心愉',
        'g4_m2': '女強人程式設計師｜林岱妍',
        'g4_m3': '女秘書美術設計師｜賴星妍',
        'g4_m4': '小女人音效設計師｜洪雅恩',
        'g5_m1': '林紫琪、韋宥筠、賴詠彤、李承祐',
        'g6_m1': '不會美術的美術設計鴿｜范諭暄',
        'g6_m2': '諾亞轉生為程式設計鴿｜夏宇柔',
        'g6_m3': '準備轉職當PM的設計鴿｜楊康媞',
        'g6_m4': '做翅膀的勞力員設計鴿｜時瑋甯',
        'g7_m1': '林妤安、蔡珺瑶、趙於萱、鄭儀嘉',
        'g8_m1': '謀摳林程式設計師｜宋浤銘',
        'g8_m2': '真的假的視覺設計師｜江庭真',
        'g8_m3': '國文唐師建模師｜陳彥均',
        'g8_m4': '互動金采源企劃構想師｜陳婉琦',
        'g9_m1': '陳靖元、謝昀珊、曾于軒、周鈺倍',
        'g10_m1': '超派正しくない魔女殺手程式設計師｜莊惟喆',
        'g10_m2': '超派壽司女郎草莓惡魔粉碎機主視覺設計師｜孫翊瑄',
        'g10_m3': '超派超絕牛馬剉冰製造機3D設計師 ｜賴柏佑',
        'g10_m4': '超派魔音穿腦大肉丸實景設計師｜高婉媃',
        'g10_m5': '超派異域風情陽春麵老闆美術設計師｜楊春春',
        'g11_m1': '縫縫補補的設計總監｜張煒茹',
        'g11_m2': '夢想成為鹹魚的角色動畫設計師｜孔奕寧',
        'g11_m3': '&lt;&lt;是淑儀也是蘇怡的書宜aka不放棄程式設計師&gt;&gt;｜楊書宜',
        'g11_m4': '超級貓咪視覺設計師｜柯佩岑',
        'g12_m1': '陳宜靜、李安中、黃智恒、蘇奕菲',
        'g13_m1': '木匠阿黃/互動設計｜蔣易珊',
        'g13_m2': '木匠阿綠/程式設計｜何美玲',
        'g13_m3': '木匠阿紅/美術設計｜陳怡亘',
        'g13_m4': '斧頭本斧/美術設計｜呂妍',
        'g14_m1': '林筱婕、盧佩雲、吳欣祈、吳千佳',
        'g15_m1': 'Aein Kyawt Han、Anujin Bazardargia、Aye Pyae Pyae Khin、Jintapa Laipitaksin、Katriela Nicoline',
        'g16_m1': '丁玉寶珍、Gwynne Purnama、Ratchapakorn Thanwised、Jesslyn Boediono Goenawan、AZZRA RIENOV FAHLIVI',
        'g17_m1': '陳小清、Leanne Garcia、Emiliia Malkova、Khuat Thi Khanh Linh、PHAM LAN HUONG',

        'adv_sung': '宋兆祥',
        'adv_wang': '王明道',
        'adv_chien': '簡明哲',
        'adv_cheng': '鄭建文',
        'adv_han': '韓秉軒'
    },
    
    'en': {
        // Nav
        'nav_info': 'Info', 'nav_sports': 'Sports', 'nav_rank': 'Ranking',
        'close_btn': 'Tap to Close',
        
        // Home
        'event_title': 'About the Event',
        'detail_title': 'Event Details',
        'hero_welcome_1': 'Welcome to',
        'hero_welcome_2': 'Tech × Sports Fitness Challenge',
        'event_p1': '【ExErcise 2.0】Tech Sports Fitness Challenge',
        'event_p2': '17 Tech Stages × 30-Second Limit Challenge!',
        'event_p3': 'Test your 7 major athletic abilities to unlock an exclusive "Fitness Report" and "AI Data Character Card".',
        'event_p4': 'Want to know where your limits lie? NTUT IxD × Decathlon Zhonghe Store awaits your challenge!',

        // Tabs
        'tab_schedule': 'Schedule', 'tab_scoring': 'Scoring', 'tab_map': 'Map', 'tab_rules': 'Rules',

        // Schedule
        'batch_1': 'Batch 1', 'batch_2': 'Batch 2', 'batch_3': 'Batch 3', 'batch_4': 'Batch 4', 'batch_5': 'Batch 5',
        'act_reg_1': 'Registration (Batch 1)', 'act_warm_1': 'Warm-up (Batch 1)', 'act_play_1': 'Gameplay (Batch 1)',
        'act_reg_2': 'Registration (Batch 2)', 'act_warm_2': 'Warm-up (Batch 2)', 'act_play_2': 'Gameplay (Batch 2)',
        'act_reg_3': 'Registration (Batch 3)', 'act_warm_3': 'Warm-up (Batch 3)', 'act_play_3': 'Gameplay (Batch 3)',
        'act_reg_4': 'Registration (Batch 4)', 'act_warm_4': 'Warm-up (Batch 4)', 'act_play_4': 'Gameplay (Batch 4)',
        'act_reg_5': 'Registration (Batch 5)', 'act_warm_5': 'Warm-up (Batch 5)', 'act_play_5': 'Gameplay (Batch 5)',

        // Scoring
        'score_h1': '1. Seventeen Exercises Championships',
        'score_label_rank': 'Ranking', 'score_text_rank': 'Participant scores will be automatically recorded and ranked according to the scoring method of each event.',
        'score_label_reward': 'Winners and Rewards', 'score_text_reward': 'First in each competition gets a prize.',
        'score_label_tie': 'In Case of a Tie', 'score_text_tie': 'In case of a tie, priority is given to the one who registered in the earlier batch.',
        'score_h2': '2. Collective Score Tournament',
        'score_sub_calc': 'Points Definition', 'score_desc_calc': 'Top 10 in each exercise get points:',
        'rank_1': '1st', 'rank_2': '2nd', 'rank_others': '...and so on', 'rank_10': '10th',
        'score_sub_method': 'Score Calculation',
        'score_li_1': 'There are 7 categories in total.',
        'score_li_2': 'If you participate in multiple competitions within the same category, only the highest score is counted.',
        'score_sub_total': 'Ranking and Winners',
        'score_li_3': 'The points from the 7 categories will be tallied. The higher the total points, the higher the ranking. The top 3 overall will receive rewards.',


        // Rules
        'rule_h1': 'Competition Guidelines',
        'rule_li_1': 'Upon check-in, a "Participant ID Wristband" will be issued to record scores. Please keep it safe and return it upon leaving. Any loss or damage will require compensation.',
        'rule_li_2': 'Please wear appropriate sportswear and sports shoes to ensure safety.',
        'rule_li_3': 'For safety reasons, children under 12 must be accompanied by a guardian.',
        'rule_li_4': 'To maintain fairness and safety, all participants must fully understand the event rules and processes before competing.',
        'rule_h2': 'Rights and Declarations',
        'rule_li_5': 'Please take care of your personal belongings and valuables. We are not responsible for any loss.',
        'rule_li_6': 'Collected personal data will only be used for contact and operations related to this event, limited to the organizers and Decathlon.',
        'rule_li_7': 'The organizers reserve the right to broadcast, exhibit, and publish event videos, photos, and scores worldwide. Participants must agree to the use of their portrait and scores for promotional purposes. If you disagree, please do not register.',
        'rule_li_8': 'In case of force majeure (e.g., natural disasters), the organizers may cancel or postpone the event for safety. Information will be announced on the official website without separate notice.',
        'rule_li_9': 'Registration implies agreement to all event rules. The organizers reserve the right to modify the terms and conditions at any time. In case of disputes, the organizers hold the final decision.',
        'note_title': '【Notice】',
        'note_content': 'Participants with physical discomfort, heart disease, high blood pressure, neck/back problems, or are pregnant are not advised to participate.<br>Please monitor your health. If you feel unwell, do not force yourself. Participation is at your own risk.',

        // Footer
        'footer_host': 'Organizer:', 'footer_co': 'Co-organizer:',
        'footer_dept': 'NTUT Interaction Design 113', 'footer_locked': 'Decathlon New Taipei Zhonghe Store', 'btn_ig': 'Follow Instagram',

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
        'lb_error': 'Load Error',

        // 🔥 新增：全站其他遺漏翻譯 (EN)
        'mega_highlight': '● Past Highlights',
        'mega_exe1_web': 'ExE 1.0 Official Website',
        'mega_exe1_vid': 'ExE 1.0 Recap Video',
        'mega_address': 'National Taipei University of Technology<br>Interaction Design Class of 113',
        'splash_text': 'Loading… Opening the .exe file',
        'ht_left': '17-Stage Challenge',
        'ht_right': 'EXERCISE 2.0',
        'hero_bottom_1': 'Break through levels, upgrade yourself<br>Sprint to the final chapter together',
        'ixd_title': 'Interaction Design',
        'ixd_desc': 'The Department of Interaction Design steps into sports technology, dedicated to deeply integrating physical movements with sensing technology.<br>Unleashing competitive limits through digital technology, exploring the intersection of sports and tech.',
        'day1_tab': 'Day 1 (3/28)',
        'day2_tab': 'Day 2 (3/29)',
        'sch_warmup': 'Warm-up & Check-in',
        'sch_play': 'Gameplay',
        'map_locked': 'Locked',
        'footer_highlight': '● Past Highlights',
        'btn_back': 'Back',

        // 🔥 新增：組別成員與指導老師 (EN)
        'g1_m1': 'Sleeping Beauty\'s Liver Designer | Chen Hsiao-Hsuan',
        'g1_m2': 'Wicked Witch\'s Denture Designer | Yang Yi-Yun',
        'g1_m3': 'Snow White\'s Armpit Hair Designer | Wang Cheng-Yen',
        'g1_m4': 'Fairy Godmother\'s Hat Designer | Chen Chia-Chen',
        'g2_m1': 'Empty-headed Designer | Hsu Yu-Chuan',
        'g2_m2': 'Eating a Peach Designer | Kuo Chun-Hsi',
        'g2_m3': 'Green Tea Yakult Designer | Mu Tsai-Hsiang',
        'g2_m4': 'Super Sleepy Designer | Huang Chun-Kai',
        'g3_m1': 'Doublemint Gum #Awesome Unity Programmer | Hsieh Wei-Ting',
        'g3_m2': 'Chocolate Banana #Top-Tier Hardware Integrator | Chuang Ting-Yu',
        'g3_m3': 'Cheese Burger #Tryhard Visual Artist | Lin Ke-Yu',
        'g3_m4': 'Innocent Orange #Ridiculous Hardware Designer | Lo Chih-Yu',
        'g4_m1': 'Big Boss UI Designer | Chen Hsin-Yu',
        'g4_m2': 'Strong Woman Programmer | Lin Tai-Yen',
        'g4_m3': 'Secretary Art Designer | Lai Hsing-Yen',
        'g4_m4': 'Little Woman Sound Designer | Hung Ya-En',
        'g5_m1': 'Lin Tzu-Chi, Wei You-Yun, Lai Yung-Tung, Li Cheng-Yu',
        'g6_m1': 'Art Designer Pigeon Who Can\'t Draw | Fan Yu-Hsuan',
        'g6_m2': 'Noah Reincarnated as Programmer Pigeon | Hsia Yu-Jou',
        'g6_m3': 'Designer Pigeon Switching to PM | Yang Kang-Ti',
        'g6_m4': 'Laborer Pigeon Making Wings | Shih Wei-Ning',
        'g7_m1': 'Lin Yu-An, Tsai Chun-Yao, Chao Yu-Hsuan, Cheng Yi-Chia',
        'g8_m1': 'Impossible Programmer | Sung Hung-Ming',
        'g8_m2': 'For Real Visual Designer | Chiang Ting-Chen',
        'g8_m3': 'Chinese Teacher Modeler | Chen Yen-Chun',
        'g8_m4': 'Interactive Concept Planner | Chen Wan-Chi',
        'g9_m1': 'Chen Ching-Yuan, Hsieh Yun-Shan, Tseng Yu-Hsuan, Chou Yu-Pei',
        'g10_m1': 'Super Pie Incorrect Witch Killer Programmer | Chuang Wei-Che',
        'g10_m2': 'Super Pie Sushi Girl Strawberry Crusher Designer | Sun Yi-Hsuan',
        'g10_m3': 'Super Pie Ultimate Shaved Ice Machine 3D Designer | Lai Po-You',
        'g10_m4': 'Super Pie Ear-Piercing Meatball Prop Designer | Kao Wan-Jou',
        'g10_m5': 'Super Pie Exotic Plain Noodle Boss Art Designer | Yang Chun-Chun',
        'g11_m1': 'Stitching & Mending Design Director | Chang Wei-Ju',
        'g11_m2': 'Character Animator Dreaming of Being a Salted Fish | Kung Yi-Ning',
        'g11_m3': '&lt;&lt;Shu-Yi aka The Programmer Who Never Gives Up&gt;&gt; | Yang Shu-Yi',
        'g11_m4': 'Super Cat Visual Designer | Ke Pei-Tsen',
        'g12_m1': 'Chen Yi-Ching, Li An-Chung, Huang Chih-Heng, Su Yi-Fei',
        'g13_m1': 'Carpenter Yellow / Interaction Design | Chiang Yi-Shan',
        'g13_m2': 'Carpenter Green / Programming | He Mei-Ling',
        'g13_m3': 'Carpenter Red / Art Design | Chen Yi-Hsuan',
        'g13_m4': 'The Axe Itself / Art Design | Lu Yen',
        'g14_m1': 'Lin Hsiao-Chieh, Lu Pei-Yun, Wu Hsin-Chi, Wu Chien-Chia',
        'g15_m1': 'Aein Kyawt Han, Anujin Bazardargia, Aye Pyae Pyae Khin, Jintapa Laipitaksin, Katriela Nicoline',
        'g16_m1': 'Dinh Ngoc Bao Tran, Gwynne Purnama, Ratchapakorn Thanwised, Jesslyn Boediono Goenawan, AZZRA RIENOV FAHLIVI',
        'g17_m1': 'Chen Xiao-Qing, Leanne Garcia, Emiliia Malkova, Khuat Thi Khanh Linh, PHAM LAN HUONG',

        'adv_sung': 'Sung Chao-Hsiang',
        'adv_wang': 'Wang Ming-Dao',
        'adv_chien': 'Chien Ming-Che',
        'adv_cheng': 'Cheng Chien-Wen',
        'adv_han': 'Han Ping-Hsuan'
    }
};

let currentLang = 'zh';

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
        }, 400);
    }, 500); 
});
// ==========================================
// 🌟 手機版：同步「大綠色方塊」的文字
// ==========================================
function syncMobileTabText() {
    const activeBtn = document.querySelector('.game-tabs-list .detail-tab-btn.active');
    const mobileDisplay = document.getElementById('mobile-tab-display');
    
    if (activeBtn && mobileDisplay) {
        mobileDisplay.textContent = activeBtn.textContent;
    }
}

// 監聽點擊，同步文字
document.querySelectorAll('.detail-tab-btn, .pixel-ctrl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setTimeout(syncMobileTabText, 50); 
    });
});
// ==========================================
// 🌟 手機版：動態導覽列背景與標題 (效能優化版)
// ==========================================
function updateMobileHeader(targetId = null) {
    const header = document.querySelector('.top-header');
    const mobileTitle = document.getElementById('header-mobile-title');
    
    let pageId = targetId;
    if (!pageId) {
        const activePage = document.querySelector('.page-view.active');
        pageId = activePage ? activePage.id : null;
    }

    if (pageId && window.innerWidth <= 1023) {
        if (pageId === 'view-groups') {
            header.classList.add('solid-purple');
            if (mobileTitle) mobileTitle.textContent = '運動項目';
        } else if (pageId === 'view-leaderboard') {
            header.classList.add('solid-purple');
            if (mobileTitle) mobileTitle.textContent = '即時排行榜';
        } else {
            header.classList.remove('solid-purple');
            if (mobileTitle) mobileTitle.textContent = '';
        }
    } else {
        header.classList.remove('solid-purple');
    }
}

// 網頁剛載入與視窗縮放時執行
updateMobileHeader();
window.addEventListener('resize', () => updateMobileHeader());

// 👇 🌟 把它搬到最底端：確保翻譯字典都載入完畢後，才執行第一次排行榜抓取！
updateLeaderboard(currentSheet);