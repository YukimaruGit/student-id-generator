export default {
  async fetch(request) {
    const url = new URL(request.url);
    const img = url.searchParams.get("img") || "";
    // 安全のため最低限エンコードだけする
    const safeImg = encodeURI(img);
    const title = "放課後クロニクル 学生証を作成しました！";
    const desc  = "#放課後クロニクル";

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <!-- Open Graph -->
  <meta property="og:title"       content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image"       content="${safeImg}" />
  <meta property="og:type"        content="website" />
  <meta property="og:url"         content="${request.url}" />

  <!-- Twitter Card -->
  <meta name="twitter:card"       content="summary_large_image" />
  <meta name="twitter:title"      content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image"      content="${safeImg}" />

  <style>
    body {
      margin: 0;
      padding: 20px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #6b46c1 0%, #3182ce 100%);
      color: white;
      font-family: 'Noto Sans JP', sans-serif;
    }
    .share-container {
      max-width: 800px;
      width: 100%;
      text-align: center;
    }
    .student-card {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin: 20px 0;
    }
    .share-message {
      font-size: 1.5rem;
      margin-bottom: 20px;
    }
    .back-link {
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border: 2px solid white;
      border-radius: 6px;
      margin-top: 20px;
      display: inline-block;
      transition: all 0.3s ease;
    }
    .back-link:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  </style>
</head>
<body>
  <div class="share-container">
    <h1 class="share-message">放課後クロニクル 学生証を作成しました！</h1>
    <img src="${safeImg}" alt="学生証" class="student-card">
    <a href="/" class="back-link">トップに戻る</a>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: { 
        "content-type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=0, must-revalidate"
      }
    });
  }
}; 