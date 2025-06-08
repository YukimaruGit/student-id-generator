import { cloudinaryConfig } from "./cloudinary.config.js";

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
const BOX = {x:72,y:198,w:379,h:497};
const POS = {
  name: {x:735,y:256,w:408},
  nameEn: {x:735,y:321,w:412},
  course: {x:740,y:395,w:170},
  club: {x:750,y:466,w:287},
  month:{x:794,y:529,w:62},
  day:  {x:905,y:531,w:48}
};

// DOMContentLoadedで全体を囲む
window.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded: 初期化開始");

  // Elements
  const photoInput = document.getElementById("photoInput");
  const nameInput = document.getElementById("nameInput");
  const nameEnInput = document.getElementById("nameEnInput");
  const courseInput = document.getElementById("courseInput");
  const clubInput = document.getElementById("clubInput");
  const monthInput = document.getElementById("birthMonth");
  const dayInput = document.getElementById("birthDay");
  const idForm = document.getElementById("idForm");
  const formArea = document.getElementById("formArea");
  const previewArea = document.getElementById("previewArea");
  const resetBtn = document.getElementById("resetBtn");

  // 状態管理
  let photoImg = null;

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

  // 生年月日ドロップダウンの初期化
  monthInput.innerHTML = `<option value="">月</option>`;
  dayInput.innerHTML = `<option value="">日</option>`;

  for(let i=1; i<=12; i++) {
    const o = new Option(i, i);
    monthInput.appendChild(o);
  }
  for(let i=1; i<=31; i++) {
    const o = new Option(i, i);
    dayInput.appendChild(o);
  }

  // 顔写真アップロード時
  photoInput.addEventListener("change", e => {
    const files = e.target.files;
    if (!files.length) return;

    const file = files[0];
    const img = new Image();
    img.onload = () => {
      photoImg = img;
      const preview = document.getElementById("photoPreview");
      preview.src = img.src;
      preview.style.display = "block";
    };
    img.src = URL.createObjectURL(file);
  });

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

      // デバッグログ
      console.log('【DEBUG】学生証生成 →', {
        name: nameInput.value || '未入力',
        nameEn: nameEnInput.value || '未入力',
        course: courseInput.value || '未設定',
        club: clubInput.value || '未設定',
        month: monthInput.value || '未設定',
        day: dayInput.value || '未設定'
      });

      ctx.font = "bold 48px serif";
      ctx.fillText(nameInput.value || '未入力', POS.name.x, POS.name.y, POS.name.w);

      ctx.font = "30px sans-serif";
      ctx.fillText(nameEnInput.value || '未入力', POS.nameEn.x, POS.nameEn.y, POS.nameEn.w);

      ctx.font = "32px sans-serif";
      ctx.fillText(courseInput.value || '未設定', POS.course.x, POS.course.y, POS.course.w);
      ctx.fillText(clubInput.value || '未設定', POS.club.x, POS.club.y, POS.club.w);
      ctx.fillText(monthInput.value || '–', POS.month.x, POS.month.y, POS.month.w);
      ctx.fillText(dayInput.value || '–', POS.day.x, POS.day.y, POS.day.w);

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