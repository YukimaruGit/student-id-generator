export async function onRequest({ params, request }) {
  try {
    const b64 = params.slug.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64);
    const bytes = new Uint8Array([...bin].map(c => c.charCodeAt(0)));
    const { p: shortPublicId, v: version, i: shortImageName } = JSON.parse(new TextDecoder().decode(bytes));

    // 短縮版データから完全なURLを復元
    const fullImageUrl = shortImageName ? 
      `https://res.cloudinary.com/di5xqlddy/image/upload/v1/as_chronicle/student_card/${shortImageName}` : 
      `https://res.cloudinary.com/di5xqlddy/image/upload/f_auto,q_auto,w_1200,h_630,c_fill,fl_force_strip/v1/student-id-generator/preview.png`;

    // 正しい遷移先URL
    const dest = `https://preview.studio.site/live/1Va6D4lMO7/student-id?shared=true&image=${encodeURIComponent(fullImageUrl)}`;
    
    // OGP画像URL（Cloudinaryの画像を直接使用）
    const ogImage = fullImageUrl;

    // Bot判定対策: より自然なHTML構造とメタタグ
    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>放課後クロニクル 学生証</title>
  
  <!-- 基本OGP -->
  <meta property="og:title" content="放課後クロニクル 学生証">
  <meta property="og:description" content="あなたが作った学生証をチェック！">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:alt" content="放課後クロニクル 学生証">
  <meta property="og:url" content="${request.url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="放課後クロニクル">
  <meta property="og:locale" content="ja_JP">
  
  <!-- Twitter Card最適化 -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@as_chronicle">
  <meta name="twitter:creator" content="@as_chronicle">
  <meta name="twitter:title" content="放課後クロニクル 学生証">
  <meta name="twitter:description" content="あなたが作った学生証をチェック！">
  <meta name="twitter:image" content="${ogImage}">
  <meta name="twitter:image:alt" content="放課後クロニクル 学生証">
  
  <!-- Discord最適化 -->
  <meta name="theme-color" content="#dda0dd">
  <meta name="msapplication-TileColor" content="#dda0dd">
  
  <!-- Bot判定対策: 自然なHTML構造 -->
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .student-card { text-align: center; margin: 20px 0; }
    .student-card img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
    .info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .redirect-notice { background: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff; margin: 20px 0; }
    .loading { text-align: center; padding: 40px; color: #666; }
    .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="container">
    <div class="student-card">
      <h1>放課後クロニクル 学生証</h1>
      <div class="info">
        <p>あなたが作った学生証を表示中...</p>
        <img src="${ogImage}" alt="放課後クロニクル 学生証" width="600" height="315">
      </div>
      
      <div class="redirect-notice">
        <h3>学生証ジェネレーターに移動中...</h3>
        <p>より詳細な学生証情報を確認するために、学生証ジェネレーターに移動します。</p>
        <div class="loading">
          <div class="spinner"></div>
          <p>ページを移動中...</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Bot判定対策: 自然なJavaScript -->
  <script>
    // 自然な遅延でリダイレクト（Bot判定回避）
    setTimeout(function() {
      window.location.href = ${JSON.stringify(dest)};
    }, 2000);
    
    // ユーザーインタラクションによる即座リダイレクト
    document.addEventListener('click', function() {
      window.location.href = ${JSON.stringify(dest)};
    });
    
    // キーボード入力による即座リダイレクト
    document.addEventListener('keydown', function() {
      window.location.href = ${JSON.stringify(dest)};
    });
  </script>
  
  <!-- フォールバック: メタリフレッシュ -->
  <meta http-equiv="refresh" content="3;url=${dest}">
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=86400",
        "X-Robots-Tag": "noindex",
        "X-Debug-PublicId": shortPublicId,
        "X-Debug-Version": String(version),
        "X-Debug-OgImage": ogImage
      }
    });
  } catch (e) {
    return new Response(`Bad share link: ${String(e)}`, { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
