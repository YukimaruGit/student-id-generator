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

// DOMContentLoadedで全体を囲む
window.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded: 初期化開始");

  const canvas = document.getElementById('student-card');
  const ctx = canvas.getContext('2d');

  // 背景を白で塗りつぶす
  function clearCanvas() {
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawCard() {
    if (!ctx) return;
    
    // 背景を白で塗りつぶす
    clearCanvas();

    // アップロード写真
    if (photoImg.src && photoImg.src !== 'assets/img/default-photo.png') {
      ctx.drawImage(photoImg, BOX.x, BOX.y, BOX.w, BOX.h);
    }

    // テキストの描画
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
  }

  let photoImg = new Image();

  // ドロップダウン初期化
  const monthSel = document.getElementById('birth-month');
  const daySel = document.getElementById('birth-day');
  
  if (monthSel && daySel) {
    for(let i=1; i<=12; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i + '月';
      monthSel.appendChild(option);
    }
    for(let i=1; i<=31; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i + '日';
      daySel.appendChild(option);
    }
  }

  // 画像選択 → プレビュー用 Image にセット
  const photoInput = document.getElementById('photo-input');
  const previewPhoto = document.getElementById('preview-photo');
  
  if (photoInput) {
    photoInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        photoImg.src = e.target.result;
        if (previewPhoto) {
          previewPhoto.src = e.target.result;
          previewPhoto.style.display = 'block';
        }
        photoImg.onload = drawCard;
      };
      reader.readAsDataURL(file);
    });
  }

  // 初回描画
  clearCanvas();

  // Cloudinaryへのアップロード
  async function uploadToCloudinary(imageData) {
    const formData = new FormData();
    formData.append('file', imageData);
    formData.append('upload_preset', 'student_card_AS_chronicle');
    formData.append('filename_override', 'student-card.png');

    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/di5rxlddy/image/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinaryアップロードエラー:', error);
      alert('画像のアップロードに失敗しました。');
      return null;
    }
  }

  // 「学生証を作成」→Cloudinaryアップロード
  const createBtn = document.getElementById('create-btn');
  if (createBtn) {
    createBtn.addEventListener('click', async () => {
      try {
        const canvas = document.getElementById('student-card');
        if (!canvas) throw new Error('キャンバスが見つかりません');
        
        const blob = await new Promise(resolve => canvas.toBlob(resolve));
        const url = await uploadToCloudinary(blob);
        
        if (url) {
          window.latestImageUrl = url;
          // URLをコピー
          await navigator.clipboard.writeText(url);
          alert('画像をアップロードし、URLをコピーしました！');
        }
      } catch (error) {
        console.error('学生証作成エラー:', error);
        alert('学生証の作成に失敗しました。');
      }
    });
  }

  // 「画像をダウンロード」
  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      try {
        const canvas = document.getElementById('student-card');
        if (!canvas) throw new Error('キャンバスが見つかりません');
        
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'student_card.png';
        link.click();
      } catch (error) {
        console.error('ダウンロードエラー:', error);
        alert('画像のダウンロードに失敗しました。');
      }
    });
  }

  // 「Xでシェア」「LINEでシェア」「URLでシェア」
  const twitterBtn = document.getElementById('twitter-btn');
  const lineBtn = document.getElementById('line-btn');
  const urlBtn = document.getElementById('url-btn');
  
  if (twitterBtn) {
    twitterBtn.addEventListener('click', () => {
      if (!window.latestImageUrl) {
        alert('先に「学生証を作成」ボタンを押して画像をアップロードしてください。');
        return;
      }
      const url = encodeURIComponent(window.latestImageUrl);
      const text = encodeURIComponent('放課後クロニクル 学生証を作成しました！');
      const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=放課後クロニクル`;
      window.open(shareUrl, '_blank', 'width=550,height=420');
    });
  }
  
  if (lineBtn) {
    lineBtn.addEventListener('click', () => {
      if (!window.latestImageUrl) {
        alert('先に「学生証を作成」ボタンを押して画像をアップロードしてください。');
        return;
      }
      const url = encodeURIComponent(window.latestImageUrl);
      const shareUrl = `https://social-plugins.line.me/lineit/share?url=${url}`;
      window.open(shareUrl, '_blank', 'width=600,height=600');
    });
  }

  if (urlBtn) {
    urlBtn.addEventListener('click', async () => {
      if (!window.latestImageUrl) {
        alert('先に「学生証を作成」ボタンを押して画像をアップロードしてください。');
        return;
      }
      try {
        await navigator.clipboard.writeText(window.latestImageUrl);
        alert('画像のURLをコピーしました！');
      } catch (error) {
        console.error('URLコピーエラー:', error);
        alert('URLのコピーに失敗しました。もう一度お試しください。');
      }
    });
  }

  // 入力フィールドの変更を監視
  ['name-kanji', 'name-romaji', 'department', 'club', 'birth-month', 'birth-day'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', drawCard);
      element.addEventListener('input', drawCard);
    }
  });

  console.log("Init: 初期化完了");
}); 