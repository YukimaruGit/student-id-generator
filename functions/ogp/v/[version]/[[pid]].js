// /functions/ogp/v/[version]/[[pid]].js
export async function onRequest({ params }) {
  const { version } = params;                 // ← URLの v/<version> を利用
  const raw = params.pid || "";               // 例: as_chronicle/student_card/abc123.jpg
  const pid = raw.replace(/\.jpg$/i, "");     // 末尾 .jpg は念のため剥がす
  const url = `https://res.cloudinary.com/di5xqlddy/image/upload/v${version}/t_ogp_card/${pid}.jpg`;
  return Response.redirect(url, 302);
}
