// /functions/s/[slug].js
export async function onRequest({ params, request }) {
  const { slug } = params;
  
  try {
    console.log('Processing slug:', slug);
    
    // Base64URL → Uint8Array → UTF-8 文字列 → JSON
    const b64 = slug.replace(/-/g, '+').replace(/_/g, '/');
    console.log('Base64:', b64);
    
    const bin = atob(b64);
    console.log('Binary length:', bin.length);
    
    const bytes = new Uint8Array([...bin].map(c => c.charCodeAt(0)));
    console.log('Bytes length:', bytes.length);
    
    const jsonStr = new TextDecoder().decode(bytes);
    console.log('JSON string:', jsonStr);
    
    const json = JSON.parse(jsonStr);
    console.log('Parsed JSON:', json);

    const publicId = json.p;
    const version = json.v;

    // 公開ドメイン固定でOGPプロキシを使う（埋め込み対策）
    const PUBLIC_ORIGIN = 'https://student-id-generator.pages.dev';
    const ogImage = `${PUBLIC_ORIGIN}/ogp/v${version}/${publicId}.jpg`;
    const dest = `https://preview.studio.site/live/1Va6D4lMO7/student-id?studentCardImage=${encodeURIComponent(ogImage)}`;

    const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <title>学生証を表示中…</title>
  <meta property="og:title" content="放課後クロニクル 学生証">
  <meta property="og:description" content="あなたが作った学生証">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="628">
  <meta property="og:url" content="${request.url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="放課後クロニクル">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${ogImage}">
  <meta http-equiv="refresh" content="0;url=${dest}">
</head>
<body>
  <h1>学生証を表示中…</h1>
  <p>自動的にリダイレクトされます。</p>
  <p><a href="${dest}">ここをクリック</a></p>
  <script>location.replace(${JSON.stringify(dest)});</script>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=86400",
        "X-Robots-Tag": "noindex"
      }
    });
  } catch (error) {
    console.error('Error processing slug:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      slug: slug
    });
    
    return new Response(`Bad share link: ${error.message}`, { 
      status: 400,
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  }
}
