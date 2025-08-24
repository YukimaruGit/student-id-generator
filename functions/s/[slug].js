// /functions/s/[slug].js
export async function onRequest(context) {
  try {
    const { slug } = context.params;
    
    // Base64URL → JSON で復号（後方互換対応）
    let payload;
    try {
      // Base64URL → Base64 → JSON
      const base64 = slug.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
      const jsonStr = decodeURIComponent(atob(padded));
      payload = JSON.parse(jsonStr);
    } catch (e) {
      // 旧形式: public_id のみを Base64URL しているケース
      try {
        const base64 = slug.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
        const publicId = decodeURIComponent(atob(padded));
        payload = { p: publicId, v: 1 };
      } catch (_) {
        return getDefaultResponse(context);
      }
    }
    
    // 画像URLを構築
    let imageUrl;
    if (payload.i?.startsWith('http')) {
      imageUrl = payload.i;
    } else if (payload.p) {
      const cloudName = 'di5xqlddy';
      const publicId = payload.p;
      const version = payload.v || 1;
      imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_1200,h_630,c_pad,b_white,fl_force_strip/v${version}/${encodeURIComponent(publicId)}.png`;
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
        const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  
  <!-- OGP メタタグ（クローラ用） -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${shareUrl}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="学生証ジェネレーター">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${imageUrl}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  
  <!-- その他のメタタグ -->
  <meta name="robots" content="noindex, nofollow">
  <link rel="canonical" href="${shareUrl}">
</head>
<body>
  <div style="display:none;">
    <img src="${imageUrl}" alt="学生証プレビュー" />
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
    
    // 人間のブラウザは302でジェネレータページへリダイレクト
    const redirectUrl = new URL('/generator.html', context.request.url);
    redirectUrl.searchParams.set('share', slug);
    
    return Response.redirect(redirectUrl.toString(), 302);
    
  } catch (error) {
    console.error('Function error:', error);
    return getDefaultResponse(context);
  }
}

function getDefaultResponse(context) {
  const shareUrl = context.request.url;
  const title = '夢見が丘女子高等学校 学生証';
  const description = '診断から学生証を自動生成';
  const defaultImage = 'https://res.cloudinary.com/di5xqlddy/image/upload/f_auto,q_auto,w_1200,h_630,c_pad,b_white,fl_force_strip/v1/student-id-generator/preview.png';
  
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
  
  // 人間のブラウザはジェネレータページへリダイレクト
  const redirectUrl = new URL('/generator.html', context.request.url);
  return Response.redirect(redirectUrl.toString(), 302);
}
