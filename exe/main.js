// Google Sheet 文件 ID
const sheetBase = "https://opensheet.elk.sh/1L_CCR3hjhCiSXe-fE4Y253PPnEQwAIPIMD8epDfzEbw/";

// 初始顯示的表單名稱（預設為「個人總積分」）
let currentSheet = "個人總積分";

// 主要更新排行榜函式
async function updateLeaderboard(sheetName) {
  try {
    // 取得對應組別的 Google Sheet JSON 資料
    const res = await fetch(sheetBase + encodeURIComponent(sheetName) + "?t=" + Date.now());
    const data = await res.json();

    // 依分數排序（高→低），取前 10 名
    const sorted = data.sort((a, b) => Number(b.分數) - Number(a.分數)).slice(0, 10);

    // 根據表單名稱決定表頭右邊的文字
    const scoreTitle = (sheetName === "個人總積分") ? "總積分" : "分數";

    // 計算同分併列排名
    let lastScore = null;
    let lastRank = 0;

    // 組出 HTML 表格內容（多了「梯次」）
    const html = `
      <div class="header">
        <span>排名</span>
        <span>梯次</span>
        <span>玩家號碼</span>
        <span>${scoreTitle}</span>
      </div>
      ${sorted.map((p, i) => {
        // 如果分數和上一筆一樣，排名不變；否則排名等於目前索引 + 1
        let rank;
        if (p.分數 === lastScore) {
          rank = lastRank;
        } else {
          rank = i + 1;
          lastRank = rank;
          lastScore = p.分數;
        }
        return `
        <div class="player">
          <span class="rank">${rank}</span>
          <span>${p.梯次 || "-"}</span>
          <span>${p.號碼}</span>
          <span>${p.分數}</span>
        </div>`;
      }).join("")}
    `;

    // 將排行榜內容更新到頁面上
    document.getElementById("leaderboard").innerHTML = html;
  } catch (err) {
    document.getElementById("leaderboard").innerHTML = "讀取失敗 😢";
    console.error(err);
  }
}

// 處理標籤按鈕點擊事件
document.querySelectorAll("#tabs button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#tabs button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentSheet = btn.dataset.sheet;
    updateLeaderboard(currentSheet);
  });
});

// 初次載入時更新一次排行榜
updateLeaderboard(currentSheet);

// 每 5 秒自動更新目前顯示的組別排行榜
setInterval(() => updateLeaderboard(currentSheet), 5000);
