import cloudinaryConfig from '../cloudinary.config.js';

// html2canvasのインポートを削除（スクリプトタグで読み込む）

// 効果音の準備（一時的にコメントアウト）
/*
const SOUNDS = {
  bell: new Audio('assets/sounds/bell.mp3'),
  chalk: new Audio('assets/sounds/chalk.mp3'),
  flip: new Audio('assets/sounds/flip.mp3')
};
*/

// 一時的な効果音の代替処理
const SOUNDS = {
  bell: { play: () => console.log('Bell sound effect') },
  chalk: { play: () => console.log('Chalk sound effect') },
  flip: { play: () => console.log('Flip sound effect') }
};

// 定数定義
const IMG_BG = "assets/img/student_template.png";
const BOX = { x: 72, y: 198, w: 379, h: 497 };
const POS = {
  name: { x: 600, y: 280, w: 500 },
  nameEn: { x: 600, y: 340, w: 500 },
  department: { x: 600, y: 420 },
  birth: { x: 600, y: 500 }
};

// Cloudinary設定
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;
const CLOUDINARY_UPLOAD_PRESET = cloudinaryConfig.uploadPreset;

let photos = [], idx = 0;

document.addEventListener('DOMContentLoaded', () => {
  const photoInput = document.getElementById('photo-input');
  const previewPhoto = document.getElementById('preview-photo');
  const nameJa = document.getElementById('name-ja');
  const nameEn = document.getElementById('name-en');
  const department = document.getElementById('department');
  const club = document.getElementById('club');
  const dobMonth = document.getElementById('dob-month');
  const dobDay = document.getElementById('dob-day');
  const previewCard = document.querySelector('.preview-card');
  
  // 写真プレビュー処理
  photoInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewPhoto.src = e.target.result;
      };
      reader.readAsDataURL(file);
      
      // Cloudinaryにアップロード
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', cloudinaryConfig.uploadPreset);
        
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData
          }
        );
        
        if (!response.ok) throw new Error('Upload failed');
        
        const data = await response.json();
        window.uploadedImageUrl = data.secure_url;
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  });

  // テキスト入力反映
  const updatePreview = () => {
    document.getElementById('preview-name-ja').textContent = nameJa.value;
    document.getElementById('preview-name-en').textContent = nameEn.value;
    document.getElementById('preview-department').textContent = department.value;
    document.getElementById('preview-club').textContent = club.value;
    document.getElementById('preview-dob-month').textContent = dobMonth.value;
    document.getElementById('preview-dob-day').textContent = dobDay.value;
  };

  [nameJa, nameEn, department, club, dobMonth, dobDay].forEach(input => {
    input.addEventListener('input', updatePreview);
  });

  // 画像ダウンロード
  document.getElementById('download-btn').addEventListener('click', () => {
    html2canvas(previewCard).then(canvas => {
      const link = document.createElement('a');
      link.download = 'student-id.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  });

  // SNSシェア
  document.getElementById('twitter-btn').addEventListener('click', () => {
    const text = '学生証を作成しました！';
    const url = window.uploadedImageUrl || window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
  });

  document.getElementById('line-btn').addEventListener('click', () => {
    const url = window.uploadedImageUrl || window.location.href;
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`);
  });

  document.getElementById('url-btn').addEventListener('click', () => {
    const url = window.uploadedImageUrl || window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('URLをコピーしました！');
    });
  });
}); 