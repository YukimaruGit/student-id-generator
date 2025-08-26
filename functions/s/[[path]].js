export async function onRequestGet(ctx) {
  const url = new URL(ctx.request.url);
  
  // 新しいOGPパス: /ogp/:v/:project/student_card/:publicId.jpg
  let m = url.pathname.match(/^\/ogp\/([^/]+)\/as_chronicle\/student_card\/([^/]+)\.jpg$/);
  let publicId, version;
  
  if (m) {
    version = m[1];
    publicId = m[2];
  } else {
    // 既存の /s/v{version}/{public_id} 形式も対応
    const seg = url.pathname.split('/').filter(Boolean);
    if (seg[0] === 's' && seg[1]?.startsWith('v')) {
      version = seg[1].replace(/^v/, '');
      publicId = decodeURIComponent(seg.slice(2).join('/'));
    }
  }
  
  if (!publicId || !version) {
    return new Response('Not found', { status: 404 });
  }

  // Cloudinary 直リンク（t_ogp_card を適用）
  const CLOUD_NAME = 'di5xqlddy';
  const ogp = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/t_ogp_card/as_chronicle/student_card/${publicId}.jpg`;

  const ua = ctx.request.headers.get('user-agent') || '';
  const isBot = /(twitterbot|discordbot|facebookexternalhit|Slackbot|bingbot|Googlebot)/i.test(ua);

  if (!isBot) {
    // 人は生成ページ or 詳細へ
    return Response.redirect(`https://student-id-generator.pages.dev/generator.html?card=${encodeURIComponent(publicId)}`, 302);
  }

  const html = `<!doctype html><html><head>
    <meta charset="utf-8">
    <meta property="og:title" content="学生証ジェネレーター – 夢見が丘女子高等学校">
    <meta property="og:description" content="診断結果から学生証を自動生成。カードをクリックで詳細へ。">
    <meta property="og:image" content="${ogp}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="628">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="robots" content="noindex,nofollow">
  </head><body></body></html>`;
  
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=600, s-maxage=86400"
    }
  });
}

// HEADでも200/ヘッダを返す（SNSがHEADを打つため）
export const onRequestHead = onRequest;
