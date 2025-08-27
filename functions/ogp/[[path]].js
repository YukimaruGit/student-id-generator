// functions/ogp/[[path]].js
export async function onRequest(context) {
  const { request, params } = context;
  // /ogp/:v/:folder/:public_id.jpg 互換吸収
  const url = new URL(request.url);
  const paths = url.pathname.split('/').filter(Boolean); // ["ogp", "v123", "as_chronicle", "student_card", "abcd.jpg"]

  // 最後の要素から public_id を抽出
  const last = paths[paths.length - 1]; // abcd.jpg
  const publicId = last.replace(/\.jpg$/i, "");
  const folder = paths.slice(2, paths.length - 1).join("/"); // as_chronicle/student_card or それ以外

  const cloudName = "di5xqlddy"; // ←必要なら env から
  const ogpImage = `https://res.cloudinary.com/${cloudName}/image/upload/t_ogp_card/${folder}/${publicId}.jpg`;

  const pageUrl = "https://preview.studio.site/live/1Va6D4lMO7/student-id";
  const title = "学生証ジェネレーター – 夢見が丘女子高等学校";
  const desc  = "診断から学生証を自動生成。カードをクリックで詳細へ。";

  const html = `<!doctype html><html lang="ja"><head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="${pageUrl}">
<meta property="og:image" content="${ogpImage}">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0.5;url=${pageUrl}">
</head><body>
<script>setTimeout(function(){location.replace(${JSON.stringify(pageUrl)})},500);</script>
<p>Redirecting...</p>
</body></html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=600, s-maxage=86400"
    }
  });
}
