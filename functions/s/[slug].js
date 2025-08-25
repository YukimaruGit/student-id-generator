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
    console.log('Decoded payload:', payload); // デバッグ用
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
  if (payload?.i) {
    // eager_urlが存在する場合は直接使用
    ogImg = payload.i;
  } else if (payload?.p && payload?.v) {
    // eager_urlがない場合は生成
    ogImg = buildOgpUrl({ i: payload.i, p: payload.p, v: payload.v });
  }

  // ---- 全アクセスにOGP付きHTMLを返し、1秒後に自動遷移 ----
  // UA誤判定のリスクを排除し、Discord/Xは確実に画像プレビュー、人間はHPへ自動遷移
  
  const previewUrl = `https://preview.studio.site/live/1Va6D4lMO7/student-id?share=${encodeURIComponent(slug)}`;
  
  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<title>夢見が丘女子高等学校 学生証</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta property="og:type" content="article">
<meta property="og:title" content="学生証ジェネレーター - 夢見が丘女子高等学校">
<meta property="og:description" content="診断から学生証を自動生成／完成カードをシェアできます。">
<meta property="og:image" content="${ogImg}">
<meta property="og:url" content="${url.href}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="1; url=${previewUrl}">
</head>
<body>
<p>まもなく移動します。開かない場合は<a href="${previewUrl}">こちら</a>。</p>
<script>setTimeout(function(){location.replace("${previewUrl}");}, 600);</script>
</body></html>`;

  return new Response(html, { 
    headers: { 
      'content-type':'text/html; charset=utf-8', 
      'cache-control':'public, max-age=600' 
    }
  });
}
