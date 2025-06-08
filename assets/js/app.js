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

// Cloudinary unsigned preset URL base
const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/di5rxlddy/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'student_card_AS_chronicle';

let photos = [], currentIndex = 0;

// DOMContentLoadedで全体を囲む
window.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded: 初期化開始");

  // キャンバスの初期化
  const canvas = document.getElementById('student-card');
  const ctx = canvas.getContext('2d');
  
  if (!canvas || !ctx) {
    console.error('キャンバスの初期化に失敗しました');
    return;
  }

  // 背景を白で塗りつぶす
  function clearCanvas() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 学生証の描画
  function drawCard() {
    // 背景を白で塗りつぶす
    clearCanvas();

    // アップロード写真
    if (photos.length > 0 && photos[currentIndex]) {
      try {
        ctx.drawImage(new Image(), 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
      } catch (error) {
        console.error('写真の描画に失敗:', error);
      }
    }

    // テキストの描画
    try {
      ctx.font = '24px serif';
      ctx.fillStyle = '#000000';

      const nameKanji = document.getElementById('name-kanji')?.value || '';
      const nameRomaji = document.getElementById('name-romaji')?.value || '';
      const department = document.getElementById('department')?.value || '';
      const club = document.getElementById('club')?.value || '';
      const birthMonth = document.getElementById('birth-month')?.value || '';
      const birthDay = document.getElementById('birth-day')?.value || '';

      if (nameKanji) ctx.fillText(nameKanji, POS.name.x, POS.name.y);
      if (nameRomaji) ctx.fillText(nameRomaji, POS.nameEn.x, POS.nameEn.y);
      if (department) ctx.fillText(department, POS.department.x, POS.department.y);
      if (birthMonth && birthDay) {
        ctx.fillText(`${birthMonth}月${birthDay}日`, POS.birth.x, POS.birth.y);
      }
    } catch (error) {
      console.error('テキストの描画に失敗:', error);
    }
  }

  // 写真の初期化
  let photoImg = new Image();
  photoImg.onload = drawCard;

  // ドロップダウン初期化
  const monthSel = document.getElementById('birth-month');
  const daySel = document.getElementById('birth-day');
  
  if (monthSel && daySel) {
    // 月の選択肢を追加
    monthSel.innerHTML = '<option value="">月</option>' + 
      Array.from({length: 12}, (_, i) => i + 1)
        .map(i => `<option value="${i}">${i}月</option>`)
        .join('');

    // 日の選択肢を追加
    daySel.innerHTML = '<option value="">日</option>' + 
      Array.from({length: 31}, (_, i) => i + 1)
        .map(i => `<option value="${i}">${i}日</option>`)
        .join('');
  }

  // 写真アップロードの処理
  const photoInput = document.getElementById('photoInput');
  const previewPhoto = document.getElementById('previewPhoto');
  
  if (photoInput) {
    photoInput.addEventListener('change', e => {
      photos = Array.from(e.target.files).map(f => URL.createObjectURL(f));
      currentIndex = 0;
      updatePhoto();
    });
  }

  // フォーム入力の監視
  ['name-kanji', 'name-romaji', 'department', 'club', 'birth-month', 'birth-day'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', drawCard);
      element.addEventListener('input', drawCard);
    }
  });

  // 初期描画
  clearCanvas();
  drawCard();

  // 写真切り替え処理
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        updatePhoto();
      }
    });

    nextBtn.addEventListener('click', () => {
      if (currentIndex < photos.length - 1) {
        currentIndex++;
        updatePhoto();
      }
    });
  }

  // 写真更新処理
  function updatePhoto() {
    previewPhoto.src = photos[currentIndex] || 'assets/img/default-photo.png';
    
    // ボタンの表示制御
    if (prevBtn && nextBtn) {
      prevBtn.style.display = currentIndex > 0 ? 'block' : 'none';
      nextBtn.style.display = currentIndex < photos.length - 1 ? 'block' : 'none';
    }
  }

  // 学生証生成処理
  const createBtn = document.getElementById('createBtn');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      const cardPreview = document.querySelector('.card-preview');
      html2canvas(cardPreview, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      }).then(canvas => {
        canvas.toBlob(blob => {
          // プレビューカードを Cloudinary にアップロード
          const form = new FormData();
          form.append('file', blob);
          form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
          
          fetch(CLOUDINARY_UPLOAD_URL, {
            method: 'POST',
            body: form
          })
          .then(res => res.json())
          .then(json => {
            const imageUrl = json.secure_url;
            setupShare(imageUrl);
          })
          .catch(err => {
            console.error('画像アップロードエラー:', err);
            alert('画像のアップロードに失敗しました。もう一度お試しください。');
          });
        });
      });
    });
  }

  // ダウンロード処理
  const downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const cardPreview = document.querySelector('.card-preview');
      html2canvas(cardPreview, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      }).then(canvas => {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'student_card.png';
        a.click();
      });
    });
  }

  // シェア機能セットアップ
  function setupShare(imageUrl) {
    const text = encodeURIComponent('放課後クロニクル 学生証を作成しました！ #放課後クロニクル');
    
    // Xでシェア
    const twitterBtn = document.getElementById('twitterBtn');
    if (twitterBtn) {
      twitterBtn.addEventListener('click', () => {
        const url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(imageUrl)}`;
        window.open(url, '_blank');
      });
    }

    // LINEでシェア
    const lineBtn = document.getElementById('lineBtn');
    if (lineBtn) {
      lineBtn.addEventListener('click', () => {
        const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(imageUrl)}&text=${text}`;
        window.open(url, '_blank');
      });
    }

    // URLでシェア
    const urlBtn = document.getElementById('urlBtn');
    if (urlBtn) {
      urlBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(imageUrl).then(() => {
          alert('共有用URLをクリップボードにコピーしました');
        });
      });
    }
  }

  // 各種テキスト反映
  ['name-kanji', 'name-romaji', 'department', 'club', 'birth-month', 'birth-day'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', drawCard);
      element.addEventListener('input', drawCard);
    }
  });

  console.log("Init: 初期化完了");
}); 