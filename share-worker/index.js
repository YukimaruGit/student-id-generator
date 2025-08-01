addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const imageUrl = url.searchParams.get('img')
  
  if (!imageUrl) {
    return new Response('Image URL is required', { status: 400 })
  }

  const html = `<!DOCTYPE html>
<html lang="ja" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>放課後クロニクル 学生証を作成しました！</title>
  
  <!-- OGP 基本タグ -->
  <meta property="og:title" content="放課後クロニクル 学生証を作成しました！" />
  <meta property="og:description" content="放課後クロニクルの世界で自分だけの学生証を作成しよう！ #放課後クロニクル" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1222" />
  <meta property="og:image:height" content="768" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url.href}" />
  <meta property="og:site_name" content="放課後クロニクル 学生証ジェネレーター" />
  
  <!-- Twitter カード -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="放課後クロニクル 学生証を作成しました！" />
  <meta name="twitter:description" content="放課後クロニクルの世界で自分だけの学生証を作成しよう！ #放課後クロニクル" />
  <meta name="twitter:image" content="${imageUrl}" />

  <link rel="stylesheet" href="https://yukimarugit.github.io/student-id-generator/assets/css/style.css">
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
    <a href="https://yukimarugit.github.io/student-id-generator/" class="back-link">トップに戻る</a>
  </div>
</body>
</html>`

  return new Response(html, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'public, max-age=3600'
    }
  })
} 