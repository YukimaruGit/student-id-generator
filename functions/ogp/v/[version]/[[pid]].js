// functions/ogp/v/[version]/[[pid]].js
export async function onRequest({ params }) {
  const { version } = params;
  // 例: as_chronicle/student_card/abc123.jpg → .jpg は保険で剥がす
  const pid = (params.pid || "").replace(/\.jpg$/i, "");
  // Strict対応: Cloudinary側URLに .jpg を付けない（= 追加 f_jpg を要求しない）
  const url = `https://res.cloudinary.com/di5qlddy/image/upload/v${version}/t_ogp_card/${pid}`;
  return Response.redirect(url, 302);
}
