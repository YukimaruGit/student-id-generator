// /functions/ogp/v/[version]/[pid].js
export async function onRequest({ params, request }) {
  const { version, pid } = params;
  
  // Cloudinaryのt_ogp_card変換画像URLにリダイレクト
  const cloudinaryUrl = `https://res.cloudinary.com/di5xqlddy/image/upload/t_ogp_card/as_chronicle/student_card/${pid}.jpg`;
  
  return new Response(null, {
    status: 302,
    headers: {
      "Location": cloudinaryUrl,
      "Cache-Control": "public, max-age=300, s-maxage=86400"
    }
  });
}
