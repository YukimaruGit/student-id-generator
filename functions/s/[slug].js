// /functions/s/[slug].js
export default async function onRequest({ request }) {
  const ua = request.headers.get('user-agent') || '';
  const url = new URL(request.url);
  const slug = url.pathname.split('/').pop() || '';
  
  const decodeB64Url = s => {
    s = s.replace(/-/g,'+').replace(/_/g,'/'); 
    const pad = s.length % 4;
    return atob(s + (pad ? '='.repeat(4 - pad) : ''));
  };

  let payload = null;
  try { 
    payload = JSON.parse(decodeURIComponent(decodeB64Url(slug))); 
  } catch {}

  // 画像URLの決定（JPG固定。f_auto はボットで失敗するため使わない）
  const CLOUD = 'di5xqlddy'; // あなたの cloud name
  const segEnc = s => (s||'').split('/').map(encodeURIComponent).join('/');
  const buildJpeg = ({p,v}) =>
    `https://res.cloudinary.com/${CLOUD}/image/upload/` +
    `c_fill,g_auto,w_1200,h_630,q_auto:good,f_jpg,fl_force_strip/` +
    `v${v}/${segEnc(p)}.jpg`;

  // p,v があれば必ず JPG を生成して使う
  const ogImg = (payload?.p && payload?.v)
    ? buildJpeg({ p: payload.p, v: payload.v })
    : null;

  // ---- Bot には 200 でOGP HTMLを返す ----
  // ボット判定を少し強化
  const isBot = /(Twitterbot|X-Twitter|Discordbot|Slackbot|facebookexternalhit|LinkedInBot|WhatsApp|TelegramBot|Pinterestbot)/i.test(ua);
  if (isBot) {
    const canonical = `https://student-id-generator.pages.dev/s/${slug}`;
    const html = `<!doctype html><html lang="ja"><head>
<meta charset="utf-8">
<title>夢見が丘女子高等学校 学生証</title>
<meta property="og:type" content="website">
<meta property="og:title" content="夢見が丘女子高等学校 学生証">
<meta property="og:description" content="診断から学生証を自動生成">
<meta property="og:url" content="${canonical}">
${ogImg ? `<meta property="og:image" content="${ogImg}">` : ''}
${ogImg ? `<meta property="og:image:secure_url" content="${ogImg}">` : ''}
${ogImg ? `<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">` : ''}
<meta name="twitter:card" content="summary_large_image">
${ogImg ? `<meta name="twitter:image" content="${ogImg}">` : ''}
<link rel="canonical" href="${canonical}">
</head><body></body></html>`;
    return new Response(html, {
      headers: {
        'content-type':'text/html; charset=utf-8',
        'cache-control':'public, max-age=0, s-maxage=86400',
        'vary':'user-agent'
      }
    });
  }

  // ---- 人間は Studio の診断ページへ 302 ----
  const dest = `https://preview.studio.site/live/1Va6D4lMO7/student-id?share=${encodeURIComponent(slug)}`;
  return Response.redirect(dest, 302);
}
