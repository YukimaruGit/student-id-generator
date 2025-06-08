import { cloudinaryConfig } from './cloudinary.config.js';

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
const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/di5rxlddy/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'student_card_AS_chronicle';

let photos = [], idx = 0;

document.addEventListener('DOMContentLoaded', () => {
  // 要素の取得と存在確認
  const elements = {
    photoInput: document.getElementById('photoInput'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    createBtn: document.getElementById('createBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    twitterBtn: document.getElementById('twitterBtn'),
    lineBtn: document.getElementById('lineBtn'),
    urlBtn: document.getElementById('urlBtn'),
    previewPhoto: document.getElementById('previewPhoto'),
    templateFrame: document.querySelector('.template-frame'),
    cardPreview: document.querySelector('.card-preview')
  };

  // 要素の存在確認
  Object.entries(elements).forEach(([key, element]) => {
    if (!element) {
      console.error(`Error: ${key} element not found`);
    }
  });

  // 写真アップロード処理
  elements.photoInput.onchange = async (e) => {
    try {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      // 既存の写真をクリア
      photos = [];
      idx = 0;

      // 各ファイルをCloudinaryにアップロード
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append('file', file);
        form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(CLOUDINARY_UPLOAD_URL, {
          method: 'POST',
          body: form
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const json = await response.json();
        photos.push(json.secure_url);
        updatePhoto();
      }
    } catch (err) {
      console.error('画像アップロードエラー:', err);
      alert('画像のアップロードに失敗しました。もう一度お試しください。');
    }
  };

  // 写真切り替え処理
  elements.prevBtn.onclick = () => {
    if (idx > 0) {
      idx--;
      updatePhoto();
    }
  };

  elements.nextBtn.onclick = () => {
    if (idx < photos.length - 1) {
      idx++;
      updatePhoto();
    }
  };

  // 学生証生成処理
  elements.createBtn.onclick = async () => {
    try {
      if (!elements.cardPreview) {
        throw new Error('Card preview element not found');
      }

      const canvas = await html2canvas(elements.cardPreview, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2,
        logging: true
      });

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const form = new FormData();
      form.append('file', blob);
      form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: form
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const json = await response.json();
      setupShare(json.secure_url);
    } catch (err) {
      console.error('学生証生成エラー:', err);
      alert('学生証の生成に失敗しました。もう一度お試しください。');
    }
  };

  // ダウンロード処理
  elements.downloadBtn.onclick = async () => {
    try {
      if (!elements.cardPreview) {
        throw new Error('Card preview element not found');
      }

      const canvas = await html2canvas(elements.cardPreview, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2,
        logging: true
      });

      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'student_card.png';
      a.click();
    } catch (err) {
      console.error('ダウンロードエラー:', err);
      alert('画像のダウンロードに失敗しました。もう一度お試しください。');
    }
  };

  // 写真更新処理
  function updatePhoto() {
    try {
      if (!elements.previewPhoto || !elements.templateFrame) {
        throw new Error('Preview elements not found');
      }

      if (photos.length > 0) {
        elements.previewPhoto.src = photos[idx];
        
        // テンプレートの写真部分を更新
        const photoStyle = `
          background-image: url('${photos[idx]}');
          background-size: cover;
          background-position: center;
          position: absolute;
          width: 120px;
          height: 150px;
          left: 20px;
          top: 50px;
          border-radius: 4px;
          overflow: hidden;
        `;
        
        let photoElement = elements.templateFrame.querySelector('.photo-overlay');
        if (!photoElement) {
          photoElement = document.createElement('div');
          photoElement.className = 'photo-overlay';
          elements.templateFrame.appendChild(photoElement);
        }
        photoElement.style.cssText = photoStyle;
      } else {
        elements.previewPhoto.src = '';
        const photoElement = elements.templateFrame.querySelector('.photo-overlay');
        if (photoElement) {
          photoElement.remove();
        }
      }
      
      // ボタンの表示制御
      elements.prevBtn.style.display = idx > 0 ? 'block' : 'none';
      elements.nextBtn.style.display = idx < photos.length - 1 ? 'block' : 'none';
    } catch (err) {
      console.error('写真更新エラー:', err);
    }
  }

  // テキスト反映
  ['nameJa', 'nameEn', 'department', 'club', 'dobMonth', 'dobDay'].forEach(id => {
    const element = document.getElementById(id);
    if (!element) {
      console.error(`Error: ${id} element not found`);
      return;
    }

    element.oninput = reflectText;
    
    // 数値入力のホイール操作
    if (id === 'dobMonth' || id === 'dobDay') {
      element.onwheel = e => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        const min = parseInt(element.min);
        const max = parseInt(element.max);
        const newValue = Math.min(max, Math.max(min, (parseInt(element.value) || 0) + delta));
        element.value = newValue;
        reflectText();
      };
    }
  });

  // テキスト反映処理
  function reflectText() {
    try {
      const textElements = {
        nameJa: document.querySelector('.student-name-ja'),
        nameEn: document.querySelector('.student-name-en'),
        info: document.querySelector('.student-info')
      };

      Object.values(textElements).forEach(element => {
        if (!element) throw new Error('Text element not found');
      });

      const values = {
        nameJa: document.getElementById('nameJa')?.value || '',
        nameEn: document.getElementById('nameEn')?.value || '',
        department: document.getElementById('department')?.value || '',
        club: document.getElementById('club')?.value || '',
        month: document.getElementById('dobMonth')?.value || '',
        day: document.getElementById('dobDay')?.value || ''
      };

      textElements.nameJa.textContent = values.nameJa;
      textElements.nameEn.textContent = values.nameEn;
      textElements.info.textContent = `${values.department}・${values.club}・${values.month}月${values.day}日`;
    } catch (err) {
      console.error('テキスト反映エラー:', err);
    }
  }

  // シェア機能セットアップ
  function setupShare(imageUrl) {
    try {
      const txt = encodeURIComponent('放課後クロニクル 学生証を作成しました！ #放課後クロニクル');
      
      elements.twitterBtn.onclick = () => {
        const url = `https://twitter.com/intent/tweet?text=${txt}&url=${encodeURIComponent(imageUrl)}`;
        window.open(url, '_blank');
      };

      elements.lineBtn.onclick = () => {
        const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(imageUrl)}&text=${txt}`;
        window.open(url, '_blank');
      };

      elements.urlBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(imageUrl);
          alert('URLをコピーしました');
        } catch (err) {
          console.error('URLコピーエラー:', err);
          alert('URLのコピーに失敗しました。もう一度お試しください。');
        }
      };
    } catch (err) {
      console.error('シェア機能セットアップエラー:', err);
    }
  }
}); 