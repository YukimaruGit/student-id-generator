// /functions/ogp/v/[version]/[[pid]].js
export async function onRequest({ params }) {
  // 例: "as_chronicle/student_card/abc123" または "as_chronicle/student_card/abc123.jpg"
  const raw = params.pid || "";
  const pid = raw.replace(/\.jpg$/i, ""); // 末尾.jpgが来ても剥がす
  const cloudinaryUrl =
    `https://res.cloudinary.com/di5xqlddy/image/upload/t_ogp_card/${pid}.jpg`;
  return Response.redirect(cloudinaryUrl, 302);
}
