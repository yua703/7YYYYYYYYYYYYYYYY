function doGet(e) {
  // 取得從網頁傳進來的姓名參數
  var targetName = e.parameter.name;
  
  // 取得目前的試算表與工作表
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // 假設「姓名」在試算表的第二欄 (B欄)，如果是 A 欄請改成 "A:A"
  // 這裡抓取整欄的資料來比對
  var data = sheet.getRange("B:B").getValues(); 
  var found = false;

  // 跑迴圈尋找有沒有符合的姓名
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] == targetName) {
      found = true;
      break;
    }
  }

  // 準備回傳給網頁的結果
  var result = {
    "success": true,
    "found": found
  };

  // 將結果轉換成 JSON 格式回傳
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}