document.querySelectorAll("#tabs button").forEach(btn => {
  btn.addEventListener("click", () => {

    document.querySelectorAll("#tabs button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const target = btn.dataset.target;

    if (target === "intro") {
      document.getElementById("intro").style.display = "block";
      document.getElementById("leaderboard-frame").style.display = "none";
    } else {
      document.getElementById("intro").style.display = "none";
      document.getElementById("leaderboard-frame").style.display = "block";
    }
  });
});