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
  <meta property="og:image:width" content="800">
  <meta property="og:image:height" content="500">
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
  
  <!-- 即座リダイレクト -->
  <meta http-equiv="refresh" content="0;url=${dest}">
</head>
<body>
  <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
    <p>学生証ジェネレーターに移動中...</p>
  </div>
  
  <!-- JavaScriptによる即座リダイレクト -->
  <script>
    // 即座にリダイレクト
    window.location.replace(${JSON.stringify(dest)});
  </script>
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
