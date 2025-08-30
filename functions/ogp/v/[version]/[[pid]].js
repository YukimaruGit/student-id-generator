export async function onRequest({ params }) {
  const raw = params.pid || "";                  // 例: "as_chronicle/student_card/abc123.jpg"
  const pid = raw.replace(/\.jpg$/i, "");        // 末尾.jpgを除去
  const url = `https://res.cloudinary.com/di5xqlddy/image/upload/t_ogp_card/${pid}.jpg`;
  return Response.redirect(url, 302);
}
