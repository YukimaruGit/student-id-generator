// functions/s/[slug].js
export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // ★ /s/<slug> だけを処理。/s/以外は静的配信へ（/generator 等は確実に素通り）
  const m = url.pathname.match(/^\/s\/([^/]+)$/);
  if (!m) return next();
  const slug = m[1];

  // -------- Settings --------
  // 人間を誘導したい最終遷移先（HP）
  const PAGE_URL = 'https://preview.studio.site/live/1Va6D4lMO7/student-id';
  const CLOUD_NAME = 'di5xqlddy';          // 既存のまま
  const NAMED = 't_ogp_card';              // ★レターボックスのNamed変換

  // --- URL-safe Base64 → UTF-8 文字列 ---
  const decodeB64Url = (s) => {
    s = s.replace(/-/g,'+').replace(/_/g,'/');
    const pad = s.length % 4; if (pad) s += '='.repeat(4 - pad);
    const bin = atob(s);
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  };

  let payload = null;
  try {
    payload = JSON.parse(decodeB64Url(slug));
  } catch (e) {
    console.error('Slug decode error:', e);
  }

  const segEnc = s => (s||'').split('/').map(encodeURIComponent).join('/');
  const DEFAULT_OGP =
    `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${NAMED}/v1/student-id-generator/preview.jpg`;

  const buildOgpUrl = ({ i, p, v }) =>
    i || `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${NAMED}/v${v}/${segEnc(p)}.jpg`;

  let ogImg = DEFAULT_OGP;
  if (payload?.i) ogImg = payload.i;
  else if (payload?.p && payload?.v) ogImg = buildOgpUrl(payload);

  const dest = `${PAGE_URL}?share=${encodeURIComponent(slug)}`;

  const html = `<!doctype html><html lang="ja"><head>
<meta charset="utf-8">
<title>学生証ジェネレーター - 夢見が丘女子高等学校</title>
<meta property="og:title" content="学生証ジェネレーター - 夢見が丘女子高等学校">
<meta property="og:description" content="診断から自分だけの学生証を自動生成。カードをクリックで詳細へ。">
<meta property="og:type" content="website">
<meta property="og:url" content="${dest}">
<meta property="og:site_name" content="放課後クロニクル">
<meta property="og:image" content="${ogImg}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="628">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${ogImg}">
<meta http-equiv="refresh" content="0.8;url=${dest}">
</head><body>
<div style="text-align: center; padding: 2rem; font-family: sans-serif;">
  <h2>学生証ジェネレーター</h2>
  <p>リダイレクト中...</p>
  <a href="${dest}" rel="noopener" class="share-cta" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: #B997D6; color: white; text-decoration: none; border-radius: 8px;">学生証を作る（HPへ）</a>
</div>
<script>setTimeout(function(){location.replace(${JSON.stringify(dest)})},800);</script>
</body></html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=600, s-maxage=86400'
    }
  });
}
