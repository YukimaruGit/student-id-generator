export async function onRequest({ params }) {
  try {
    const version = String(params.version || "").trim();
    const raw = String(params.pid || ""); // 例: "as_chronicle/student_card/xxx.jpg"
    if (!version || !raw) {
      return new Response("Bad OGP path", { status: 400 });
    }

    // 末尾の .jpg は保険で剥がす。各セグメントは個別にエンコード
    const withoutExt = raw.replace(/\.jpg$/i, "");
    const safePid = withoutExt.split("/").map(encodeURIComponent).join("/");

    // Strict対応：CloudinaryのURL末尾に拡張子を付けない（=余計な f_jpg を要求しない）
    const target = `https://res.cloudinary.com/di5xqlddy/image/upload/v${encodeURIComponent(
      version
    )}/t_ogp_card/${safePid}`;

    return new Response(null, {
      status: 302,
      headers: {
        Location: target,
        "Cache-Control": "public, max-age=300, s-maxage=86400"
      }
    });
  } catch (e) {
    return new Response("OGP redirect error: " + (e && e.message), { status: 500 });
  }
}
