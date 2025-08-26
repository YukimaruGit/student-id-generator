export async function onRequest({ request }) {
  const ua = request.headers.get('user-agent') || '';
  const url = new URL(request.url);
  const path = url.pathname;

  const decodeB64Url = (s) => {
    s = s.replace(/-/g,'+').replace(/_/g,'/');
    const pad = s.length % 4;
    const bin = atob(s + (pad ? '='.repeat(4 - pad) : ''));
    return decodeURIComponent(escape(bin));
  };

  // ① /s/v{version}/{public_id} 形式を先に判定
  let payload = null;
  let m = path.match(/^\/s\/v(\d+)\/(.+)$/);
  if (m) {
    payload = { v: m[1], p: decodeURIComponent(m[2]) }; // JSONではないが後段の共通処理で使える形に
  } else {
    // ② 従来の Base64(JSON) 方式
    const slug = path.split('/').pop() || '';
    try { payload = JSON.parse(decodeB64Url(slug)); } catch (_) {}
  }

  // 画像URL（OGP）構築
  const CLOUD = 'di5xqlddy';
  const segEnc = s => (s||'').split('/').map(encodeURIComponent).join('/');
  const DEFAULT_OGP =
    `https://res.cloudinary.com/${CLOUD}/image/upload/` +
    `c_pad,g_auto,w_1200,h_630,b_white,q_auto:good,f_png,fl_force_strip/` +
    `v1/student-id-generator/preview.png`; // ← 拡張子を .png に合わせる

  // OGP画像URL（SNSプレビュー用）: 自ドメイン配信で安定させる
  // ページの ?cb=... を画像URLにも付与して、Discord/X の画像キャッシュを確実に更新させる
  let ogImg = DEFAULT_OGP;
  if (payload?.i) ogImg = payload.i;
  else if (payload?.p && payload?.v) {
    // 自ドメイン経由の /ogp を使用（named transformation経由で安定）
    const ogImgBase = `${url.origin}/ogp/v${payload.v}/${segEnc(payload.p)}.jpg`;
    const cb = url.searchParams.get('cb');
    ogImg = cb ? `${ogImgBase}?cb=${encodeURIComponent(cb)}` : ogImgBase;
  }

  // クリック後の遷移先（Studio）
  const previewUrl =
    `https://preview.studio.site/live/1Va6D4lMO7/student-id` +
    `?share=${encodeURIComponent(`v=${payload?.v || '1'}&p=${payload?.p || 'student-id-generator'}`)}`;

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
