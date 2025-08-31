// functions/ogp/v/[version]/[[pid]].js
export async function onRequest({ params }) {
  try {
    // 例: /ogp/v/1756562983/as_chronicle/student_card/abc123.jpg
    const version = String(params.version || "").trim();
    const raw     = String(params.pid || "").replace(/\.jpg$/i, "");
    if (!/^\d+$/.test(version) || !raw) {
      return new Response("Bad OGP path", { status: 400 });
    }

    // 各セグメントだけをエンコードして「/」で結合（カンマ禁止）
    const safePid = raw.split("/").map(encodeURIComponent).join("/");

    // Strict対応：Cloudinary側URLの末尾に拡張子は付けない（= 追加 f_jpg を要求しない）
    const target = `https://res.cloudinary.com/di5xqlddy/image/upload/v${version}/t_ogp_card/${safePid}`;

    return new Response(null, {
      status: 302,
      headers: {
        Location: target,
        "Cache-Control": "public, max-age=300, s-maxage=86400",
        "X-Debug-Target-Url": target // 一時的な可視化用（確認が済んだら削除OK）
      }
    });
  } catch (e) {
    return new Response(`OGP redirect error: ${e && e.message}`, { status: 500 });
  }
}
