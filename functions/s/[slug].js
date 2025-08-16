// functions/s/[slug].js
export async function onRequest({ params }) {
  const CLOUD_NAME   = 'di5xqlddy'; // Cloudinary設定と同値
  const REDIRECT_TO  = 'https://preview.studio.site/live/1Va6D4lMO7/student-id'; // 人間の遷移先
  const TWITTER_SITE = '@as_chronicle'; // 任意のTwitterアカウント

  try {
    // slugパラメータを取得
    const { slug } = params;
    
    if (!slug) {
      return new Response('Invalid slug', { status: 400 });
    }

    // slugからpublic_idを復元（Base64URLデコード）
    const publicId = decodeBase64Url(slug.split('-')[0]);
    
    if (!publicId) {
      return new Response('Invalid public_id', { status: 400 });
    }

    // Cloudinaryの画像URLを生成（1200x630変換）
    const imageUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_1200,h_630,c_fill,q_auto,f_auto/${publicId}`;

    // OGP付きHTMLを生成（サーバーサイドレンダリング）
    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>放課後クロニクル 学生証</title>
  
  <!-- OGPタグ（JS後入れ禁止） -->
  <meta property="og:title" content="放課後クロニクル 学生証">
  <meta property="og:description" content="あなただけの学生証を作成しよう！">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="https://student-id.app/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="放課後クロニクル">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="${TWITTER_SITE}">
  <meta name="twitter:title" content="放課後クロニクル 学生証">
  <meta name="twitter:description" content="あなただけの学生証を作成しよう！">
  <meta name="twitter:image" content="${imageUrl}">
  
  <!-- リダイレクト用メタタグ -->
  <meta http-equiv="refresh" content="0;url=${REDIRECT_TO}">
  
  <style>
    body { 
      font-family: 'Noto Sans JP', sans-serif; 
      text-align: center; 
      padding: 50px 20px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: 0;
    }
    .container { max-width: 600px; margin: 0 auto; }
    .loading { font-size: 18px; margin: 20px 0; }
    .spinner { 
      width: 40px; 
      height: 40px; 
      border: 4px solid rgba(255,255,255,0.3); 
      border-top: 4px solid white; 
      border-radius: 50%; 
      animation: spin 1s linear infinite; 
      margin: 20px auto; 
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎓 放課後クロニクル 学生証</h1>
    <div class="loading">学生証を読み込み中...</div>
    <div class="spinner"></div>
    <p>自動的に診断ゲームに移動します...</p>
    <p><small>移動しない場合は<a href="${REDIRECT_TO}" style="color: #ffd700;">こちら</a>をクリック</small></p>
  </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('Error in [slug].js:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Base64URLデコード関数
function decodeBase64Url(str) {
  try {
    // Base64URLをBase64に変換
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // パディングを追加
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    // デコード
    return decodeURIComponent(escape(atob(padded)));
  } catch (error) {
    console.error('Base64URL decode error:', error);
    return null;
  }
}
