// functions/ogp/[[path]].js
export async function onRequest({ request }) {
  const url = new URL(request.url);
  // 期待: /ogp/v1234/path/to/public_id.jpg
  const m = url.pathname.match(/^\/ogp\/v(\d+)\/(.+)\.jpg$/);
  if (!m) return new Response("Not found", { status: 404 });

  const version = m[1];
  const publicId = decodeURIComponent(m[2]);

  const CLOUDINARY_CLOUD_NAME = "di5xqlddy"; // ←あなたの値に置換
  const enc = s => s.split("/").map(encodeURIComponent).join("/");
  const cloudUrl =
    `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/` +
    `c_fill,g_auto,w_1200,h_630,f_auto,q_auto,fl_force_strip/` +
    `v${version}/${enc(publicId)}.jpg`;

  const res = await fetch(cloudUrl, { cf: { cacheTtl: 86400, cacheEverything: true } });
  if (!res.ok) return new Response("Cloudinary fetch failed", { status: 502 });

  return new Response(res.body, {
    headers: {
      "content-type": "image/jpeg",
      "cache-control": "public, max-age=600, s-maxage=86400, stale-while-revalidate=604800"
    }
  });
}
export const onRequestHead = onRequest; // HEADでも200/ヘッダを返す
