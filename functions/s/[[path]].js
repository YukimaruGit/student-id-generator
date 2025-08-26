// functions/s/[[path]].js
export async function onRequest({ request }) {
  const url = new URL(request.url);
  const ua = request.headers.get('user-agent') || '';
  
  // 期待パス: /s/v<version>/<public_id...>
  const m = url.pathname.match(/^\/s\/v(\d+)\/(.+)$/);
  if (!m) return new Response("Not found", { status: 404 });

  const version = m[1];
  const publicId = decodeURIComponent(m[2]);

  const CLOUDINARY_CLOUD_NAME = 'di5xqlddy'; // ←必要に応じて変更
  const enc = s => s.split('/').map(encodeURIComponent).join('/');
  const ogImg = `${url.origin}/ogp/v${version}/${enc(publicId)}.jpg`;

  const previewUrl =
    `https://preview.studio.site/live/1Va6D4lMO7/student-id` +
    `?share=${encodeURIComponent(`v=${version}&p=${publicId}`)}`;

  // Bot判定
  const isBot = /(Twitterbot|Discordbot|Slackbot|facebookexternalhit|LinkedInBot|WhatsApp|TelegramBot|Pinterestbot)/i.test(ua);
  
  if (isBot) {
    // Botには純粋なOGP HTMLだけ（メタリフレッシュ/JS遷移なし）
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
</body>
</html>`;

    return new Response(html, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300, s-maxage=3600',
        'vary': 'user-agent'
      }
    });
  } else {
    // 人間は302でStudioへ（リダイレクト）
    return Response.redirect(previewUrl, 302);
  }
}

// HEADでも 200 を返す（Xのプリフライト対策）
export const onRequestHead = onRequest;
