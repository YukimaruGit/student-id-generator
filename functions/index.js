// /functions/index.js
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const s = url.searchParams.get('s');
  if (!s) {
    // パラメータが無ければ普通に index（静的）を返させる
    return context.next();
  }

  // 既存 /s/[slug].js と同等の OGP レスポンスを生成
  const CLOUD = context.env.CLOUDINARY_CLOUD_NAME || 'di5xqlddy';

  // decode（/s/ と同じ形式で作っているならそのまま使える）
  const decoded = atob(s.split('-')[0].replace(/-/g,'+').replace(/_/g,'/'));
  const pid = decoded; // 既存と同じく public_id を想定
  const safePid = pid.split('/').map(encodeURIComponent).join('/');
  const image = `https://res.cloudinary.com/${CLOUD}/image/upload/` +
                `f_auto,q_auto,w_1200,h_630,c_fill,fl_force_strip/${safePid}.png`;

  const title = '放課後クロニクル 学生証';
  const desc  = 'あなたの学生証が完成！';

  const html = `<!doctype html><html lang="ja"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><meta name="description" content="${desc}">
<link rel="canonical" href="${url.toString()}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url.toString()}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${image}">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
</head><body>
<script>location.replace('/');</script>
</body></html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=31536000, immutable'
    }
  });
}
