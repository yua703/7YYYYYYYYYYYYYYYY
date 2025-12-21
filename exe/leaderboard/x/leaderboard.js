// Google Sheet 文件 ID
const sheetBase = "https://opensheet.elk.sh/1EdjiH8Itg6wNBf4MS9IlT-j5yYkFqR3uqo0Toic28N8/";

// 初始顯示的表單名稱（預設為「個人總積分」）
let currentSheet = "個人總積分";

// 主要更新排行榜函式
async function updateLeaderboard(sheetName) {
  try {
    // 從 Google Sheet 取得 JSON 資料
    const res = await fetch(sheetBase + encodeURIComponent(sheetName) + "?t=" + Date.now());
    const data = await res.json();

    // ✅ 不排序，依照試算表順序顯示
    const sorted = data.slice(0, 10);

    // 根據表單名稱決定右上角標題
    const scoreTitle = (sheetName === "個人總積分") ? "總積分" : "分數";

    // ✅ 改良版同分併列排名演算法
    let lastScore = null;
    let lastRank = 0;
    let actualRank = 0; // 實際第幾筆資料（不跳號）

    const html = `
      <div class="header">
        <span>排名</span>
        <span>玩家號碼</span>
        <span>${scoreTitle}</span>
      </div>
      ${sorted.map((p) => {
        actualRank++; // 每筆資料+1

        let rank;
        if (p.分數 === lastScore) {
          // 分數相同 → 跟前一個同名次
          rank = lastRank;
        } else {
          // 分數不同 → 以目前第幾筆作為排名
          rank = actualRank;
          lastRank = rank;
          lastScore = p.分數;
        }

        return `
        <div class="player">
          <span class="rank">${rank}</span>
          <span>${p.編號}</span>
          <span>${p.分數}</span>
        </div>`;
      }).join("")}
    `;

    document.getElementById("leaderboard").innerHTML = html;
  } catch (err) {
    document.getElementById("leaderboard").innerHTML = "讀取失敗 😢";
    console.error(err);
  }
}

// 處理切換按鈕
document.querySelectorAll("#tabs button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#tabs button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentSheet = btn.dataset.sheet;
    updateLeaderboard(currentSheet);
  });
});

// 初次載入排行榜
updateLeaderboard(currentSheet);

// 每 5 秒自動更新排行榜
setInterval(() => updateLeaderboard(currentSheet), 5000);
