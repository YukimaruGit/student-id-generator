export async function onRequest({ request }) {
  const { request: req } = { request };
  const url = new URL(req.url);
  const seg = url.pathname.split('/').filter(Boolean); // ["s","v1234567890", ...publicIdParts ]
  // v の後ろが Cloudinary version、残りが public_id
  const version = seg[1]?.replace(/^v/, '') || '';
  const publicId = decodeURIComponent(seg.slice(2).join('/')); // as_chronicle/student_card/slug.jpg 等

  // Cloudinary 直リンク（t_ogp_card を適用）
  const cloud = 'di5xqlddy';
  const ogpImage = `https://res.cloudinary.com/${cloud}/image/upload/t_ogp_card/v${version}/${publicId}.jpg`;

  const title = '学生証ジェネレーター – 夢見が丘女子高等学校';
  const desc  = '診断から学生証を自動生成。カードをクリックで詳細へ。';
  const shareUrl = url.origin + url.pathname; // このURL自体
  const hp = 'https://preview.studio.site/live/1Va6D4lMO7/student-id';

  const html = `<!doctype html><html lang="ja"><head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="${shareUrl}">
<meta property="og:image" content="${ogpImage}">
<meta property="og:image:secure_url" content="${ogpImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="628">
<meta property="og:image:type" content="image/jpeg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${ogpImage}">
<meta http-equiv="refresh" content="1; url=${hp}">
<link rel="canonical" href="${hp}">
<meta name="robots" content="noindex,nofollow">
<style>html,body{height:100%;margin:0;background:#0b0b0b;color:#fff;display:grid;place-items:center;font:14px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif}</style>
</head><body>
<p>プレビュー用ページです。<br>自動的に <a href="${hp}">公式ページ</a> へ移動します。</p>
<script>setTimeout(function(){location.replace("${hp}")},1000)</script>
</body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public,max-age=600' }});
}

// HEADでも200/ヘッダを返す（SNSがHEADを打つため）
export const onRequestHead = onRequest;
