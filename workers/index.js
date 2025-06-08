import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import sharp from 'sharp';

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      
      // OGP画像生成エンドポイント
      if (url.pathname === '/og') {
        const publicId = url.searchParams.get('publicId');
        if (!publicId) {
          return new Response('Missing publicId parameter', { status: 400 });
        }

        // Cloudinaryから画像を取得
        const imageUrl = `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();

        // テンプレート画像を取得
        const templateAsset = await getAssetFromKV(env.ASSETS, request, {
          mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/student_template.png`, req)
        });
        const templateBuffer = await templateAsset.arrayBuffer();

        // 画像を合成
        const composite = await sharp(templateBuffer)
          .composite([
            {
              input: Buffer.from(imageBuffer),
              top: 50,
              left: 50,
              width: 200,
              height: 250
            }
          ])
          .png()
          .toBuffer();

        // レスポンスを返す
        return new Response(composite, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=31536000'
          }
        });
      }

      // その他のリクエストは404を返す
      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
}; 