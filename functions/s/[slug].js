// /functions/s/[slug].js
export async function onRequest(context) {
  try {
    const { slug } = context.params;
    
    // Base64URL → JSON で復号（後方互換対応）
    let payload;
    try {
      // Base64URL → Base64 → JSON
      const base64 = slug.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
      const jsonStr = decodeURIComponent(atob(padded));
      payload = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Slug decode error:', e);
      // 後方互換：デコード文字列を public_id として扱う
      try {
        const base64 = slug.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
        const publicId = decodeURIComponent(atob(padded));
        payload = { p: publicId, v: 1 };
      } catch (fallbackError) {
        console.error('Fallback decode error:', fallbackError);
        return getDefaultResponse();
      }
    }
    
    // 画像URLを構築
    let imageUrl;
    if (payload.i && payload.i.startsWith('http')) {
      // 完全なURLが提供されている場合
      imageUrl = payload.i;
    } else if (payload.p) {
      // public_id から Cloudinary URL を構築
      const cloudName = 'di5xqlddy'; // 設定ファイルから取得するのが理想的
      const publicId = payload.p;
      const version = payload.v || 1;
      imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_1200,h_630,c_fill,fl_force_strip/v${version}/${publicId}.png`;
    } else {
      return getDefaultResponse();
    }
    
    // OGP メタタグを含む HTML を返す
    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>夢見が丘女子高等学校 学生証</title>
  
  <!-- OGP メタタグ -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="夢見が丘女子高等学校 学生証">
  <meta property="og:description" content="診断から学生証を自動生成">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="${context.request.url}">
  <meta name="twitter:card" content="summary_large_image">
  
  <!-- 人間は生成ページへ誘導 -->
  <meta http-equiv="refresh" content="0;url=/generator.html">
  
  <style>
    body {
      font-family: 'Noto Sans JP', sans-serif;
      background: linear-gradient(135deg, #B997D6, #A895D0);
      margin: 0;
      padding: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: white;
      text-align: center;
    }
    .loading {
      background: rgba(255, 255, 255, 0.1);
      padding: 2rem;
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loading">
    <div class="spinner"></div>
    <p>学生証ジェネレーターに移動中...</p>
  </div>
</body>
</html>`;
    
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300' // 5分キャッシュ
      }
    });
    
  } catch (error) {
    console.error('Function error:', error);
    return getDefaultResponse();
  }
}

function getDefaultResponse() {
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>夢見が丘女子高等学校 学生証</title>
  
  <!-- デフォルト OGP -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="夢見が丘女子高等学校 学生証">
  <meta property="og:description" content="診断から学生証を自動生成">
  <meta property="og:image" content="https://res.cloudinary.com/di5xqlddy/image/upload/f_auto,q_auto,w_1200,h_630,c_fill,fl_force_strip/v1/student-id-generator/preview.png">
  <meta name="twitter:card" content="summary_large_image">
  
  <!-- 生成ページへ誘導 -->
  <meta http-equiv="refresh" content="0;url=/generator.html">
</head>
<body>
  <p>学生証ジェネレーターに移動中...</p>
</body>
</html>`;
  
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    }
  });
}
