const sheetURL = "https://opensheet.elk.sh/1L_CCR3hjhCiSXe-fE4Y253PPnEQwAIPIMD8epDfzEbw/第一組排名";

async function updateLeaderboard() {
  try {
    const res = await fetch(sheetURL + "?t=" + Date.now());
    const data = await res.json();

    const sorted = data.sort((a, b) => Number(b.分數) - Number(a.分數)).slice(0, 5);

    document.getElementById("leaderboard").innerHTML = sorted.map(
      (p, i) => `
        <div class="player">
          <span class="rank">${i + 1}</span>
          <span>${p.人名}</span>
          <span>${p.分數}</span>
        </div>`
    ).join("");
  } catch (err) {
    document.getElementById("leaderboard").innerHTML = "讀取失敗 😢";
    console.error(err);
  }
}

updateLeaderboard();
setInterval(updateLeaderboard, 10000); // 每10秒更新