// Cloudflare Workers: OGP対応シェアページ生成
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const imageUrl = url.searchParams.get('img');
    
    if (!imageUrl) {
      return new Response('画像URLが指定されていません', { status: 400 });
    }
    
    const html = `<!DOCTYPE html>
<html lang="ja" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>放課後クロニクル 学生証</title>
  
  <!-- OGP タグ -->
  <meta property="og:title" content="放課後クロニクル 学生証を作成しました！" />
  <meta property="og:description" content="放課後クロニクルの世界で自分だけの学生証を作成しよう！ #放課後クロニクル" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="800" />
  <meta property="og:image:height" content="500" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${request.url}" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="放課後クロニクル 学生証を作成しました！" />
  <meta name="twitter:description" content="放課後クロニクルの世界で自分だけの学生証を作成しよう！ #放課後クロニクル" />
  <meta name="twitter:image" content="${imageUrl}" />
  
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
    <img src="${imageUrl}" class="student-card" alt="学生証">
    <a href="https://your-domain.com" class="back-link">学生証を作成する</a>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }
}; 