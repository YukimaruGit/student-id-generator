// /functions/s/[slug].js
export async function onRequest(context) {
  const { slug } = context.params;
  const CLOUD = (context.env && context.env.CLOUD_NAME) || 'di5xqlddy';

  // ---- helpers ----
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function b64urlDecodeSafe(s){
    try {
      s = s.replace(/-/g,'+').replace(/_/g,'/'); while (s.length % 4) s += '=';
      return atob(s);
    } catch { return null; }
  }

  // 旧形式 slug-<ts> にも耐える（先頭だけ使う）
  const head = String(slug).split('-')[0];
  const decoded = b64urlDecodeSafe(head);

  let image = '', title = '放課後クロニクル 学生証', desc = 'あなただけの学生証を作成しよう！';

  if (decoded) {
    // まずJSON試行（旧形式）
    try {
      const data = JSON.parse(decodeURIComponent(escape(decoded)));
      if (typeof data.i === 'string') image = data.i;
      if (typeof data.n === 'string' && data.n) title = `${data.n} の学生証`;
    } catch {
      // 新形式：decoded は public_id とみなす → ここでCloudinaryのOGP画像URLを組み立て
      // 注意：versionが提供できない場合は、JSON方式への移行を推奨
      const pid = decoded;
      const safePid = pid.split('/').map(encodeURIComponent).join('/');
      // 変換指定の「後」に v を入れるのが正解（versionが不明な場合はv1を仮定）
      image = `https://res.cloudinary.com/${CLOUD}/image/upload/` +
              `f_auto,q_auto,w_1200,h_630,c_fill,fl_force_strip/` +
              `v1/${safePid}.png`;
    }
  }

  const canonical = new URL(context.request.url).toString();
  const html = `<!doctype html>
<html lang="ja"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
${image ? `<meta property="og:image" content="${image}">` : ''}
<meta name="twitter:card" content="summary_large_image">
${image ? `<meta name="twitter:image" content="${image}">` : ''}
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,"Noto Sans JP";padding:24px}</style>
</head><body>
<h1>${esc(title)}</h1><p>${esc(desc)}</p>
${image ? `<img src="${image}" alt="preview" style="max-width:640px;width:100%;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.12)">` : ''}
<p><a href="/generator.html">学生証を作成する</a></p>
</body></html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=31536000, immutable'
    }
  });
}
