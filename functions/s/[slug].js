// /functions/s/[slug].js
export default async function onRequest({ request }) {
  const url = new URL(request.url);
  
  // 短いURL方式：/s/v{version}/{public_id} から直接読み取り
  const m = url.pathname.match(/^\/s\/v(\d+)\/(.+)$/);
  if (!m) {
    return new Response("Not found", { status: 404 });
  }

  const version = m[1];
  const publicId = decodeURIComponent(m[2]);

  // Cloudinary のクラウド名を設定
  const CLOUDINARY_CLOUD_NAME = 'di5xqlddy';
  
  const enc = s => s.split('/').map(encodeURIComponent).join('/');
  const ogImg = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/` +
                `c_fill,g_auto,w_1200,h_630,q_auto:good,f_jpg,fl_force_strip/` +
                `v${version}/${enc(publicId)}.jpg`;

  const previewUrl = `https://preview.studio.site/live/1Va6D4lMO7/student-id` +
                     `?share=${encodeURIComponent(`v=${version}&p=${publicId}`)}`;

  // 統一HTML：Botも人間も同じHTML、JSで人間だけ遷移
  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>夢見が丘女子高等学校 学生証</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta property="og:type" content="article">
<meta property="og:title" content="学生証ジェネレーター - 夢見が丘女子高等学校">
<meta property="og:description" content="診断から学生証を自動生成。カードをクリックで詳細へ。">
<meta property="og:url" content="${url.origin}${url.pathname}">
<meta property="og:image" content="${ogImg}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${ogImg}">
<link rel="canonical" href="${previewUrl}">
</head>
<body>
<p>開いています… <a href="${previewUrl}">開かない場合はこちら</a></p>
<script>setTimeout(function(){ location.replace("${previewUrl}"); }, 300);</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=600, s-maxage=86400, stale-while-revalidate=604800"
    }
  });
}

// HEADでも200を返す
export const onRequestHead = onRequest;
