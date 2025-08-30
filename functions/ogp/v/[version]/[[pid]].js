// /functions/ogp/v/[version]/[[pid]].js
export async function onRequest({ params }) {
  const { version, pid } = params;
  
  // .jpg サフィックスを除去
  const publicId = pid.replace(/\.jpg$/, '');
  
  // Cloudinaryのt_ogp_card変換URLを構築
  const cloudinaryUrl = `https://res.cloudinary.com/di5xqlddy/image/upload/t_ogp_card/${publicId}.jpg`;
  
  // 302リダイレクトでCloudinary画像に転送
  return Response.redirect(cloudinaryUrl, 302);
}
