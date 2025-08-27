export async function onRequest({ request }) {
  // -------- Settings --------
  // 人間を誘導したい最終遷移先（HP）
  const PAGE_URL = 'https://preview.studio.site/live/1Va6D4lMO7/student-id';
  const CLOUD_NAME = 'di5xqlddy';

  const url = new URL(request.url);
  const slug = url.pathname.split('/').pop() || '';

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
    `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/` +
    `c_fill,g_auto,w_1200,h_630,q_auto:good,f_jpg,fl_force_strip/` +
    `v1/student-id-generator/preview.jpg`;

  const buildOgpUrl = ({ i, p, v }) =>
    i || `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/` +
          `c_fill,g_auto,w_1200,h_630,q_auto:good,f_jpg,fl_force_strip/` +
          `v${v}/${segEnc(p)}.jpg`;

  let ogImg = DEFAULT_OGP;
  if (payload?.i) ogImg = payload.i;
  else if (payload?.p && payload?.v) ogImg = buildOgpUrl(payload);

  const dest = `${PAGE_URL}?share=${encodeURIComponent(slug)}`;

  const html = `<!doctype html><html lang="ja"><head>
<meta charset="utf-8">
<title>夢見が丘女子高等学校 学生証</title>
<meta property="og:type" content="website">
<meta property="og:title" content="夢見が丘女子高等学校 学生証">
<meta property="og:description" content="診断から学生証を自動生成。自分だけの学生証を作ろう！">
<meta property="og:url" content="${dest}">
<meta property="og:image" content="${ogImg}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0.8;url=${dest}">
</head><body>
<script>setTimeout(function(){location.replace(${JSON.stringify(dest)})},800);</script>
</body></html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=600, s-maxage=86400'
    }
  });
}
