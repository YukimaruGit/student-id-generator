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

const IMG_BG = "assets/img/student_template.png";
const BOX = { x: 72, y: 198, w: 379, h: 497 };
const POS = {
  name: { x: 600, y: 280, w: 500 },
  nameEn: { x: 600, y: 340, w: 500 },
  course: { x: 600, y: 420 },
  club: { x: 600, y: 500 },
  month: { x: 600, y: 580 },
  day: { x: 720, y: 580 }
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
  const nameInput = document.getElementById("nameInput");
  const nameEnInput = document.getElementById("nameEnInput");
  const monthInput = document.getElementById("birthMonth");
  const dayInput = document.getElementById("birthDay");
  const idForm = document.getElementById("idForm");
  const formArea = document.getElementById("formArea");
  const previewArea = document.getElementById("previewArea");
  const resetBtn = document.getElementById("resetBtn");

  // 状態管理
  let courseResult = "";  // 診断結果の学科
  let clubResult = "";    // 診断結果の部活動

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
    
    if (!photoImg) {
      alert("写真を選択してください");
      return;
    }

    try {
      // 学生証を生成
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 750;
      const ctx = canvas.getContext("2d");

      // 背景画像を読み込んで描画
      const bgImg = await loadBackgroundImage();
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

      // 写真を描画
      ctx.save();
      ctx.beginPath();
      ctx.rect(BOX.x, BOX.y, BOX.w, BOX.h);
      ctx.clip();

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
      ctx.fillText(courseResult, POS.course.x, POS.course.y);
      ctx.fillText(clubResult, POS.club.x, POS.club.y);
      ctx.fillText(monthInput.value || '–', POS.month.x, POS.month.y);
      ctx.fillText(dayInput.value || '–', POS.day.x, POS.day.y);

      // プレビューを表示
      const previewCanvas = document.getElementById("studentCanvas");
      previewCanvas.width = canvas.width;
      previewCanvas.height = canvas.height;
      previewCanvas.getContext("2d").drawImage(canvas, 0, 0);

      formArea.style.display = "none";
      previewArea.style.display = "block";

    } catch (error) {
      console.error("学生証生成エラー:", error);
      alert("学生証の生成に失敗しました。もう一度お試しください。");
    }
  });

  // リセットボタン
  resetBtn.addEventListener("click", () => {
    // フォームをリセット
    idForm.reset();
    photoImg = null;
    document.getElementById("photoPreview").style.display = "none";
    courseResult = "";
    clubResult = "";

    // 画面を非表示
    formArea.style.display = "none";
    previewArea.style.display = "none";

    // 開始画面を表示
    const startContainer = document.getElementById("startContainer");
    if (startContainer) {
      startContainer.style.display = "block";
    }
  });

  // ダウンロードボタン
  document.getElementById("downloadBtn").addEventListener("click", () => {
    const canvas = document.getElementById("studentCanvas");
    if (!canvas) return;

    try {
      const dataURL = canvas.toDataURL("image/png");
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

  // Twitterシェアボタン
  document.getElementById("twitterShareBtn").addEventListener("click", () => {
    const canvas = document.getElementById("studentCanvas");
    if (!canvas) return;

    canvas.toBlob(blob => {
      const formData = new FormData();
      formData.append("file", blob);
      formData.append("upload_preset", "student_id_preset");

      fetch("https://api.cloudinary.com/v1_1/your-cloud-name/image/upload", {
        method: "POST",
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        const text = "放課後クロニクル 学生証を作成しました！\n#放課後クロニクル";
        const url = data.secure_url;
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        window.open(shareUrl, "_blank");
      })
      .catch(error => {
        console.error("シェアエラー:", error);
        alert("シェアに失敗しました。もう一度お試しください。");
      });
    }, "image/png");
  });

  // LINEシェアボタン
  document.getElementById("lineShareBtn").addEventListener("click", () => {
    const canvas = document.getElementById("studentCanvas");
    if (!canvas) return;

    canvas.toBlob(blob => {
      const formData = new FormData();
      formData.append("file", blob);
      formData.append("upload_preset", "student_id_preset");

      fetch("https://api.cloudinary.com/v1_1/your-cloud-name/image/upload", {
        method: "POST",
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        const text = "放課後クロニクル 学生証を作成しました！";
        const url = data.secure_url;
        const shareUrl = `https://line.me/R/share?text=${encodeURIComponent(text)}\n${encodeURIComponent(url)}`;
        window.open(shareUrl, "_blank");
      })
      .catch(error => {
        console.error("シェアエラー:", error);
        alert("シェアに失敗しました。もう一度お試しください。");
      });
    }, "image/png");
  });

  // URLコピーボタン
  document.getElementById("copyUrlBtn").addEventListener("click", () => {
    const canvas = document.getElementById("studentCanvas");
    if (!canvas) return;

    canvas.toBlob(blob => {
      const formData = new FormData();
      formData.append("file", blob);
      formData.append("upload_preset", "student_id_preset");

      fetch("https://api.cloudinary.com/v1_1/your-cloud-name/image/upload", {
        method: "POST",
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        const url = data.secure_url;
        navigator.clipboard.writeText(url)
          .then(() => alert("URLをクリップボードにコピーしました！"))
          .catch(() => alert("URLのコピーに失敗しました。"));
      })
      .catch(error => {
        console.error("アップロードエラー:", error);
        alert("URLの生成に失敗しました。もう一度お試しください。");
      });
    }, "image/png");
  });

  console.log("Init: 初期化完了");
}); 