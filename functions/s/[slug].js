// /functions/s/[slug].js
export async function onRequest({ params, request }) {
  const { slug } = params;
  try {
    // Base64URL → Uint8Array → UTF-8 文字列 → JSON
    const b64 = slug.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64);
    const bytes = new Uint8Array([...bin].map(c => c.charCodeAt(0)));
    const json = JSON.parse(new TextDecoder().decode(bytes));

    const publicId = json.p;
    const version = json.v;

    // 公開ドメイン固定でOGPプロキシを使う（埋め込み対策）
    const PUBLIC_ORIGIN = 'https://student-id-generator.pages.dev';
    const ogImage = `${PUBLIC_ORIGIN}/ogp/v${version}/as_chronicle/student_card/${publicId}.jpg`;
    const dest = `https://preview.studio.site/live/1Va6D4lMO7/student-id?studentCardImage=${encodeURIComponent(ogImage)}`;

    const html = `<!doctype html><html lang="ja"><head>
<meta charset="utf-8"><title>学生証を表示中…</title>
<meta property="og:title" content="放課後クロニクル 学生証">
<meta property="og:description" content="あなたが作った学生証">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="628">
<meta property="og:url" content="${request.url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="放課後クロニクル">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${ogImage}">
<meta http-equiv="refresh" content="0;url=${dest}"></head>
<body><script>location.replace(${JSON.stringify(dest)});</script>
<noscript><a href="${dest}">こちらをクリック</a></noscript></body></html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=86400",
        "X-Robots-Tag": "noindex"
      }
    });
  } catch {
    return new Response("Bad share link", { status: 400 });
  }
}
