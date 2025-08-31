// functions/ogp/v/[version]/[[pid]].js
export async function onRequest({ params }) {
  try {
    const version = String(params.version || "").trim();
    const raw = String(params.pid || "");
    if (!/^\d+$/.test(version) || !raw) return new Response("Bad OGP path", { status: 400 });

    const parts   = raw.replace(/\.jpg$/i, "").split("/").filter(Boolean);
    const safePid = parts.map(s => encodeURIComponent(s)).join("/"); // ← ここが肝

    const target = `https://res.cloudinary.com/di5xqlddy/image/upload/v${version}/t_ogp_card/${safePid}`;
    return new Response(null, {
      status: 302,
      headers: {
        Location: target,
        "Cache-Control": "public, max-age=300, s-maxage=86400",
        "X-Debug-Target-Url": target // 確認後に消してOK
      }
    });
  } catch (e) {
    return new Response(`OGP redirect error: ${e?.message || e}`, { status: 500 });
  }
}
