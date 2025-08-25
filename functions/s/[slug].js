// /functions/s/[slug].js
export default async function onRequest({ request }) {
  const ua = request.headers.get('user-agent') || '';
  const url = new URL(request.url);
  const slug = url.pathname.split('/').pop() || '';
  
  const decodeB64Url = (s) => {
    s = s.replace(/-/g,'+').replace(/_/g,'/');
    const pad = s.length % 4;
    const bin = atob(s + (pad ? '='.repeat(4 - pad) : ''));
    // Unicode安全復元（btoa(unescape(encodeURIComponent))) の逆）
    // eslint-disable-next-line no-undef
    return decodeURIComponent(escape(bin));
  };

  let payload = null;
  try { 
    // decodeB64Url内で既にデコード済みのため、JSON.parseに直接渡す
    payload = JSON.parse(decodeB64Url(slug)); 
  } catch(e) {
    console.error('Slug decode error:', e);
  }

  // 画像URLの決定（OGP用、eager_urlがあれば最優先）
  const CLOUD = 'di5xqlddy'; // あなたの cloud name
  const segEnc = s => (s||'').split('/').map(encodeURIComponent).join('/');
  const DEFAULT_OGP =
    `https://res.cloudinary.com/${CLOUD}/image/upload/` +
    `c_fill,g_auto,w_1200,h_630,q_auto:good,f_jpg,fl_force_strip/` +
    `v1/student-id-generator/preview.jpg`;

  const buildOgpUrl = ({i, p, v}) => {
    if (i) return i;
    return `https://res.cloudinary.com/${CLOUD}/image/upload/` +
           `c_fill,g_auto,w_1200,h_630,q_auto:good,f_jpg,fl_force_strip/` +
           `v${v}/${segEnc(p)}.jpg`;
  };

  // 常にOGP画像を出す（payload不良でも既定画像にフォールバック）
  let ogImg = DEFAULT_OGP;
  if (payload?.p && payload?.v) {
    ogImg = buildOgpUrl({ i: payload.i, p: payload.p, v: payload.v });
  }

  // ---- Bot には 200 でOGP HTMLを返す ----
  // ボット判定を少し強化
  const isBot = /(Twitterbot|X-Twitter|Discordbot|Slackbot|facebookexternalhit|LinkedInBot|WhatsApp|TelegramBot|Pinterestbot)/i.test(ua);
  if (isBot) {
    const canonical = `https://preview.studio.site/live/1Va6D4lMO7/student-id`;
    const html = `<!doctype html><html lang="ja"><head>
<meta charset="utf-8">
<title>夢見が丘女子高等学校 学生証</title>
<meta property="og:type" content="website">
<meta property="og:title" content="夢見が丘女子高等学校 学生証">
<meta property="og:description" content="診断から学生証を自動生成">
<meta property="og:url" content="${url.href}">
<meta property="og:image" content="${ogImg}">
<meta property="og:image:secure_url" content="${ogImg}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${ogImg}">
<link rel="canonical" href="${url.href}">
</head><body>
<script>
  // 人間のブラウザはStudioへ即時リダイレクト
  if (!/bot|crawler|spider/i.test(navigator.userAgent)) {
    window.top.location.replace('https://preview.studio.site/live/1Va6D4lMO7/student-id');
  }
</script>
<noscript>
  <meta http-equiv="refresh" content="0;url=https://preview.studio.site/live/1Va6D4lMO7/student-id">
</noscript>
</body></html>`;
    return new Response(html, {
      headers: {
        'content-type':'text/html; charset=utf-8',
        'cache-control':'public, max-age=0, s-maxage=86400',
        'vary':'user-agent'
      }
    });
  }

  // ---- 人間は現在のサイトのトップページへ 302 ----
  // リクエストURLを元に、同じドメインのトップページにリダイレクト
  const baseUrl = new URL(request.url);
  const dest = new URL('/', baseUrl);
  dest.searchParams.set('share', slug);
  return Response.redirect(dest.toString(), 302);
}
