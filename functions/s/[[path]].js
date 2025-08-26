export async function onRequest({ request }) {
  const url = new URL(request.url);
  // 期待パス: /s/v1234/path/to/public_id
  const m = url.pathname.match(/^\/s\/v(\d+)\/(.+)$/);
  if (!m) return new Response('Not found', { status: 404 });

  const version  = m[1];
  const publicId = decodeURIComponent(m[2]);

  // ←あなたの Cloudinary のクラウド名に置換
  const CLOUDINARY_CLOUD_NAME = 'di5xqlddy';
  const enc = (s) => s.split('/').map(encodeURIComponent).join('/');

  // OGP画像は"自ドメイン配信"にすると安定（下の /ogp を利用）
  const ogImg = `${url.origin}/ogp/v${version}/${enc(publicId)}.jpg`;

  // クリック後の遷移先（Studio）
  const previewUrl =
    `https://preview.studio.site/live/1Va6D4lMO7/student-id` +
    `?share=${encodeURIComponent(`v=${version}&p=${publicId}`)}`;

  const html = `<!doctype html><html lang="ja"><head>
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
</head><body>
<p>開いています… <a href="${previewUrl}">開かない場合はこちら</a></p>
<script>
  // BotはJSを実行しないのでOGPだけ読む。人間はStudioへ遷移。
  setTimeout(function(){ location.replace(${JSON.stringify(previewUrl)}); }, 300);
</script>
</body></html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=600, s-maxage=86400, stale-while-revalidate=604800'
    }
  });
}

// HEADでも200/ヘッダを返す（SNSがHEADを打つため）
export const onRequestHead = onRequest;
