import { cloudinaryConfig } from '../cloudinary.config.js';
import html2canvas from './vendor/html2canvas.min.js';

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

const templateImg = new Image();
templateImg.src = 'assets/img/student_template.png';

let photoImg = new Image();

// ドロップダウン初期化
const monthSel = document.getElementById('month');
const daySel   = document.getElementById('day');
for(let i=1; i<=12; i++) monthSel.add(new Option(i + '月', i));
for(let i=1; i<=31; i++) daySel.add(new Option(i + '日', i));

// Canvas 描画
const canvas = document.getElementById('card-canvas');
const ctx    = canvas.getContext('2d');

function drawCard() {
  // 背景テンプレート
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

  // アップロード写真
  if(photoImg.src) {
    ctx.drawImage(photoImg,  50,  80, 300, 350);
  }

  // テキスト
  ctx.fillStyle = '#333';
  ctx.textBaseline = 'top';
  ctx.font = '28px serif';
  ctx.fillText('氏名：' + document.getElementById('name').value, 380, 100);
  ctx.fillText('部活：' + document.getElementById('department').value, 380, 150);
  ctx.fillText(
    '生年月日：' +
      monthSel.value + '月 ' +
      daySel.value   + '日',
    380, 200
  );
}

// 画像選択 → プレビュー用 Image にセット
document.getElementById('photo-input').addEventListener('change', e => {
  const file = e.target.files[0];
  if(!file) return;
  const url = URL.createObjectURL(file);
  photoImg.src = url;
  photoImg.onload = drawCard;
});

// テンプレート読み込み後に初回描画
templateImg.onload = drawCard;

// 「学生証を作成」→Cloudinaryアップロード
document.getElementById('create-btn').addEventListener('click', () => {
  html2canvas(document.getElementById('card')).then(canvas => {
    canvas.toBlob(blob => {
      const form = new FormData();
      form.append('file', blob);
      form.append('upload_preset', cloudinaryConfig.preset);
      fetch(cloudinaryConfig.url, { method:'POST', body: form })
        .then(r => r.json())
        .then(data => {
          window.latestImageUrl = data.secure_url;
          alert('アップロード完了: ' + data.secure_url);
        });
    });
  });
});

// 「画像をダウンロード」
document.getElementById('download-btn').addEventListener('click', () => {
  html2canvas(document.getElementById('card')).then(canvas => {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'student_card.png';
    link.click();
  });
});

// 「Xでシェア」「LINEでシェア」
document.getElementById('twitter-btn').addEventListener('click', () => {
  const url = encodeURIComponent(window.latestImageUrl || '');
  const text = encodeURIComponent('放課後クロニクル 学生証を作成しました！');
  const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=放課後クロニクル`;
  window.open(shareUrl, '_blank', 'width=550,height=420');
});
document.getElementById('line-btn').addEventListener('click', () => {
  const url = encodeURIComponent(window.latestImageUrl || '');
  const shareUrl = `https://social-plugins.line.me/lineit/share?url=${url}`;
  window.open(shareUrl, '_blank', 'width=600,height=600');
});

// DOMContentLoadedで全体を囲む
window.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded: 初期化開始");

  // Elements
  const photoInput = document.getElementById("photoInput");
  const photoPreview = document.getElementById("photoPreview");
  const nameInput = document.getElementById("nameInput");
  const nameEnInput = document.getElementById("nameEnInput");
  const departmentSelect = document.getElementById("department");
  const monthSelect = document.getElementById("birthMonth");
  const daySelect = document.getElementById("birthDay");
  const idForm = document.getElementById("idForm");
  const previewArea = document.getElementById("previewArea");
  const studentCanvas = document.getElementById("studentCanvas");
  const downloadBtn = document.getElementById("downloadBtn");
  const copyUrlBtn = document.getElementById("copyUrlBtn");
  const resetBtn = document.getElementById("resetBtn");

  // 生年月日の選択肢を生成
  for (let i = 1; i <= 12; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i}月`;
    monthSelect.appendChild(option);
  }
  for (let i = 1; i <= 31; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i}日`;
    daySelect.appendChild(option);
  }

  // 写真アップロード時のプレビュー
  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        photoPreview.src = e.target.result;
        photoPreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });

  // 背景画像のロード
  const loadBackgroundImage = () => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        console.log("背景画像の読み込み完了");
        resolve(img);
      };
      img.onerror = (err) => {
        console.error("背景画像の読み込みに失敗:", err);
        reject(err);
      };
      img.src = IMG_BG;
    });
  };

  // フォーム送信時
  idForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    if (!photoPreview.src) {
      alert("写真を選択してください");
      return;
    }

    try {
      // 学生証を生成
      studentCanvas.width = 1200;
      studentCanvas.height = 750;
      const ctx = studentCanvas.getContext("2d");

      // 背景画像を読み込んで描画
      const bgImg = await loadBackgroundImage();
      ctx.drawImage(bgImg, 0, 0, studentCanvas.width, studentCanvas.height);

      // 写真を描画
      ctx.save();
      ctx.beginPath();
      ctx.rect(BOX.x, BOX.y, BOX.w, BOX.h);
      ctx.clip();

      const photoImg = new Image();
      photoImg.src = photoPreview.src;
      await new Promise((resolve) => {
        photoImg.onload = resolve;
      });

      const iw = photoImg.naturalWidth;
      const ih = photoImg.naturalHeight;
      const scale = Math.max(BOX.w/iw, BOX.h/ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = BOX.x - (dw - BOX.w)/2;
      const dy = BOX.y - (dh - BOX.h)/2;

      ctx.drawImage(photoImg, 0, 0, iw, ih, dx, dy, dw, dh);
      ctx.restore();

      // テキストを描画
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#333";

      ctx.font = "bold 48px serif";
      ctx.fillText(nameInput.value || '未入力', POS.name.x, POS.name.y, POS.name.w);

      ctx.font = "30px sans-serif";
      ctx.fillText(nameEnInput.value || '未入力', POS.nameEn.x, POS.nameEn.y, POS.nameEn.w);

      ctx.font = "32px sans-serif";
      ctx.fillText(departmentSelect.value, POS.department.x, POS.department.y);
      ctx.fillText(
        `${monthSelect.value}月${daySelect.value}日`,
        POS.birth.x,
        POS.birth.y
      );

      // プレビューを表示
      idForm.style.display = "none";
      previewArea.style.display = "block";

    } catch (error) {
      console.error("学生証生成エラー:", error);
      alert("学生証の生成に失敗しました。もう一度お試しください。");
    }
  });

  // ダウンロードボタン
  downloadBtn.addEventListener("click", () => {
    try {
      const dataURL = studentCanvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataURL;
      a.download = "放課後クロニクル_学生証.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("ダウンロードエラー:", error);
      alert("ダウンロードに失敗しました。もう一度お試しください。");
    }
  });

  // URLコピーボタン
  copyUrlBtn.addEventListener("click", async () => {
    try {
      // Cloudinaryにアップロード
      const blob = await new Promise(resolve => studentCanvas.toBlob(resolve));
      const formData = new FormData();
      formData.append("file", blob);
      formData.append("upload_preset", cloudinaryConfig.preset);
      
      const response = await fetch(cloudinaryConfig.url, {
        method: "POST",
        body: formData
      });
      
      const data = await response.json();
      const imageUrl = data.secure_url;
      
      // URLをクリップボードにコピー
      await navigator.clipboard.writeText(imageUrl);
      alert("画像のURLをコピーしました！");
      
    } catch (error) {
      console.error("URLコピーエラー:", error);
      alert("URLのコピーに失敗しました。もう一度お試しください。");
    }
  });

  // リセットボタン
  resetBtn.addEventListener("click", () => {
    // フォームをリセット
    idForm.reset();
    photoPreview.style.display = "none";
    photoPreview.src = "";
    
    // 表示を切り替え
    previewArea.style.display = "none";
    idForm.style.display = "block";
  });

  console.log("Init: 初期化完了");
}); 