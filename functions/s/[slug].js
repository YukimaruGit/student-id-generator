// /functions/s/[slug].js
export async function onRequest(context) {
  try {
    const { slug } = context.params;
    
    // Base64URL → 短縮スラッグ or JSON で復号（新旧両対応）
    let payload;
    try {
      // Base64URL → Base64 → 文字列
      const base64 = slug.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
      const decoded = decodeURIComponent(atob(padded));
      
      // 新形式: "v:VERSION:PUBLIC_ID" の短縮スラッグ
      if (decoded.startsWith('v:')) {
        const parts = decoded.split(':');
        if (parts.length >= 3) {
          const version = parts[1];
          const publicId = parts.slice(2).join(':'); // コロンを含むpublic_idに対応
          payload = { p: publicId, v: parseInt(version) || 1 };
        } else {
          return getDefaultResponse(context);
        }
      } else if (decoded.startsWith('{')) {
        // 旧形式: JSON スラッグ
        payload = JSON.parse(decoded);
      } else {
        // 旧形式: public_id のみを Base64URL しているケース
        payload = { p: decoded, v: 1 };
      }
    } catch (e) {
      return getDefaultResponse(context);
    }
    
    // 画像URLを構築
    let imageUrl;
    if (payload.i?.startsWith('http')) {
      imageUrl = payload.i;
    } else if (payload.p) {
      const cloudName = 'di5xqlddy';
      const publicId = payload.p;
      const version = payload.v || 1;
      // フォルダの「/」はエンコードしない。各セグメントだけエンコードする
      const encodedPublicId = publicId
        .split('/')
        .map(encodeURIComponent)
        .join('/');
      imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_1200,h_630,c_fill,g_auto,fl_force_strip/v${version}/${encodedPublicId}.png`;
    } else {
      return getDefaultResponse(context);
    }
    
    // User-Agent判定でクローラか人間かを判定
    const userAgent = context.request.headers.get('user-agent') || '';
    const isBot = /(twitterbot|facebookexternalhit|slackbot|discordbot|line|linkedinbot|embedly|vkshare|pinterest|crawler|spider|bot|whatsapp|telegram)/i.test(userAgent);
    
    const shareUrl = context.request.url;
    const title = '夢見が丘女子高等学校 学生証';
    const description = '診断から学生証を自動生成';
    
    // クローラにはOGPメタタグ付きHTMLを返す（リダイレクトしない）
    if (isBot) {
      const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${shareUrl}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="夢見が丘女子高等学校 学生証">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${imageUrl}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:url" content="${shareUrl}">
  <link rel="canonical" href="${shareUrl}">
</head>
<body></body>
</html>`;
      
      return new Response(html, {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          // カードの再取得を安定させる
          'cache-control': 'public, max-age=300',
          'vary': 'user-agent'
        }
      });
    }
    
    // 人間のブラウザは302でStudioの診断ページへリダイレクト（?share=<slug>を付与）
    const dest = `https://preview.studio.site/live/1Va6D4lMO7/student-id?share=${slug}`;
    return Response.redirect(dest, 302);
    
  } catch (error) {
    console.error('Function error:', error);
    return getDefaultResponse(context);
  }
}

function getDefaultResponse(context) {
  const shareUrl = context.request.url;
  const title = '夢見が丘女子高等学校 学生証';
  const description = '診断から学生証を自動生成';
  const defaultImage = 'https://res.cloudinary.com/di5xqlddy/image/upload/f_auto,q_auto,w_1200,h_630,c_fill,g_auto,fl_force_strip/v1/student-id-generator/preview.png';
  
  // User-Agent判定
  const userAgent = context.request.headers.get('user-agent') || '';
  const isBot = /(twitterbot|facebookexternalhit|slackbot|discordbot|line|linkedinbot|embedly|vkshare|pinterest|crawler|spider|bot|whatsapp|telegram)/i.test(userAgent);
  
  if (isBot) {
    // クローラにはデフォルトOGPを返す
    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  
  <!-- デフォルト OGP メタタグ（クローラ用） -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${shareUrl}">
  <meta property="og:image" content="${defaultImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="学生証ジェネレーター">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${defaultImage}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  
  <!-- その他のメタタグ -->
  <meta name="robots" content="noindex, nofollow">
  <link rel="canonical" href="${shareUrl}">
</head>
<body>
  <div style="display:none;">
    <img src="${defaultImage}" alt="学生証プレビュー" />
  </div>
</body>
</html>`;
    
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=0, s-maxage=600'
      }
    });
  }
  
  // 人間のブラウザはStudioの診断ページへリダイレクト（?share=<slug>を付与）
  const dest = `https://preview.studio.site/live/1Va6D4lMO7/student-id?share=${slug}`;
  return Response.redirect(dest, 302);
}
