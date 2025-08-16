// Cloudinary画像アップロード機能
export async function uploadImageToCloudinary(canvas, cloudName, uploadPreset) {
  return new Promise((resolve, reject) => {
    // Canvasをblobに変換
    canvas.toBlob(async (blob) => {
      try {
        const formData = new FormData();
        formData.append('file', blob);
        formData.append('upload_preset', uploadPreset);
        formData.append('cloud_name', cloudName);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Cloudinary upload failed: ${response.status}`);
        }

        const data = await response.json();
        resolve(data.secure_url);
      } catch (error) {
        console.error('Cloudinary upload error:', error);
        reject(error);
      }
    }, 'image/png', 0.9);
  });
}

// シェアURL生成
export function generateShareUrl(imageUrl) {
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
  return `${baseUrl}/share.html?img=${encodeURIComponent(imageUrl)}`;
}

// ローカルにcanvasを画像として保存
export function downloadCanvasAsImage(canvas, filename = '学生証.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// Xシェア用URL生成
export function generateTwitterShareUrl(shareUrl, text = '放課後クロニクル 学生証を作成しました！') {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
}

// URLをクリップボードにコピー
export async function copyUrlToClipboard(url) {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (err) {
    console.error('Failed to copy URL:', err);
    return false;
  }
}
