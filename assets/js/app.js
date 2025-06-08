import { cloudinaryConfig } from "./cloudinary.config.js";

const IMG_BG = "assets/img/student_template.png";
const BOX = {x:72,y:198,w:379,h:497};
const POS = {
  name: {x:735,y:256,w:408},
  nameEn: {x:735,y:321,w:412},
  dept: {x:740,y:395,w:170},
  club: {x:750,y:466,w:287},
  month:{x:794,y:529,w:62},
  day:  {x:905,y:531,w:48}
};

// DOMContentLoadedで全体を囲む
window.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded: 初期化開始");

  // Elements
  const photoInput = document.getElementById("photoInput");
  const photoPreview = document.getElementById("photoPreview");
  const prevBtn = document.getElementById("prevPhotoBtn");
  const nextBtn = document.getElementById("nextPhotoBtn");
  const nameI = document.getElementById("nameInput");
  const nameEnI = document.getElementById("nameEnInput");
  const deptI = document.getElementById("deptInput");
  const clubI = document.getElementById("clubInput");
  const monthI = document.getElementById("birthMonth");
  const dayI = document.getElementById("birthDay");
  const createBtn = document.getElementById("createBtn");
  const previewArea = document.getElementById("previewArea");
  const canvas = document.getElementById("studentCanvas");
  const ctx = canvas.getContext("2d");
  const dlBtn = document.getElementById("downloadBtn");
  const twBtn = document.getElementById("twitterShareBtn");
  const lnBtn = document.getElementById("lineShareBtn");
  const copyBtn = document.getElementById("copyUrlBtn");

  // 状態管理
  let currentPhotoIndex = 0;
  let uploadedPhotos = [];
  let bgImg = new Image();
  let photoImg = null;
  let lastShareUrl = null;

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

  // 背景画像を読み込む
  loadBackgroundImage()
    .then(img => {
      bgImg = img;
      if (photoImg) drawCard();
    })
    .catch(err => {
      console.error("背景画像の読み込みに失敗しました:", err);
    });

  // 生年月日ドロップダウンの初期化
  monthI.innerHTML = `<option value="">月</option>`;
  dayI.innerHTML = `<option value="">日</option>`;

  for(let i=1; i<=12; i++) {
    const o = new Option(i, i);
    monthI.appendChild(o);
  }
  for(let i=1; i<=31; i++) {
    const o = new Option(i, i);
    dayI.appendChild(o);
  }

  // ホイール操作で上下可能に
  [monthI, dayI].forEach(sel => {
    sel.addEventListener("wheel", e => {
      e.preventDefault();
      const max = sel.options.length - 1;
      let idx = sel.selectedIndex + (e.deltaY < 0 ? -1 : 1);
      sel.selectedIndex = Math.min(max, Math.max(1, idx));
    });
  });

  // 写真プレビューの切り替え
  const updatePhotoPreview = () => {
    if (uploadedPhotos.length === 0) {
      photoPreview.style.display = "none";
      prevBtn.style.display = "none";
      nextBtn.style.display = "none";
      return;
    }

    photoPreview.style.display = "block";
    photoImg = uploadedPhotos[currentPhotoIndex];
    photoPreview.src = photoImg.src;

    // 矢印ボタンの表示制御
    prevBtn.style.display = currentPhotoIndex > 0 ? "block" : "none";
    nextBtn.style.display = currentPhotoIndex < uploadedPhotos.length - 1 ? "block" : "none";

    drawCard();
  };

  // 前の写真へ
  prevBtn.addEventListener("click", () => {
    if (currentPhotoIndex > 0) {
      currentPhotoIndex--;
      updatePhotoPreview();
    }
  });

  // 次の写真へ
  nextBtn.addEventListener("click", () => {
    if (currentPhotoIndex < uploadedPhotos.length - 1) {
      currentPhotoIndex++;
      updatePhotoPreview();
    }
  });

  // 顔写真アップロード時
  photoInput.addEventListener("change", e => {
    const files = e.target.files;
    if (!files.length) return;

    // 既存の画像をクリア
    uploadedPhotos = [];
    currentPhotoIndex = 0;

    Array.from(files).forEach(file => {
      const img = new Image();
      img.onload = () => {
        uploadedPhotos.push(img);
        if (uploadedPhotos.length === 1) {
          currentPhotoIndex = 0;
          photoImg = img;
        }
        updatePhotoPreview();
        previewArea.style.display = "block";
      };
      img.src = URL.createObjectURL(file);
    });
  });

  // カード描画処理
  function drawCard() {
    try {
      if (!bgImg || !bgImg.complete) {
        console.log("背景画像がまだ読み込まれていません");
        return;
      }

      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(bgImg,0,0,canvas.width,canvas.height);

      if (photoImg) {
        // 四角クリップを開始
        ctx.save();
        ctx.beginPath();
        ctx.rect(BOX.x, BOX.y, BOX.w, BOX.h);
        ctx.clip();

        // Cover スケール計算
        const iw = photoImg.naturalWidth, ih = photoImg.naturalHeight;
        const scale = Math.max(BOX.w/iw, BOX.h/ih);
        const dw = iw * scale, dh = ih * scale;
        const dx = BOX.x - (dw - BOX.w)/2;
        const dy = BOX.y - (dh - BOX.h)/2;

        // 画像を描画
        ctx.drawImage(photoImg, 0,0, iw,ih, dx,dy, dw,dh);

        // クリップ解除
        ctx.restore();
      }

      const name = nameI.value||"——";
      const nameEn = nameEnI.value||"——";
      const dept = deptI.value||"——";
      const club = clubI.value||"——";
      const month = monthI.value||"–";
      const day = dayI.value||"–";

      ctx.textAlign = "left"; 
      ctx.textBaseline = "top";
      ctx.fillStyle = "#333";

      ctx.font = "bold 48px serif";
      ctx.fillText(name,POS.name.x,POS.name.y,POS.name.w);

      ctx.font = "30px sans-serif";
      ctx.fillText(nameEn,POS.nameEn.x,POS.nameEn.y,POS.nameEn.w);

      ctx.font = "32px sans-serif";
      ctx.fillText(dept,POS.dept.x,POS.dept.y,POS.dept.w);
      ctx.fillText(club,POS.club.x,POS.club.y,POS.club.w);

      ctx.fillText(month,POS.month.x,POS.month.y,POS.month.w);
      ctx.fillText(day,POS.day.x,POS.day.y,POS.day.w);

      console.log("Draw: カード描画完了");
    } catch (err) {
      console.error("Draw: 描画エラー", err);
    }
  }

  // 学生証作成ボタン
  createBtn.addEventListener("click", () => {
    if(!photoImg) return alert("顔写真をアップしてください");
    if(!bgImg) return alert("背景画像の読み込みを待っています...");
    drawCard();
    window.scrollTo({top:previewArea.offsetTop,behavior:"smooth"});
  });

  // ダウンロード処理
  dlBtn.addEventListener("click", () => {
    try {
      if (!bgImg || !bgImg.complete) {
        alert("背景画像の読み込みを待っています...");
        return;
      }
      const dataURL = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataURL;
      a.download = "放課後クロニクル_学生証.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      console.log("Download: ダウンロード開始");
    } catch (err) {
      console.error("Download: ダウンロード失敗", err);
      alert("画像のダウンロードに失敗しました。\nエラー: " + err.message);
    }
  });

  // シェア機能
  async function uploadAndShare(platform) {
    try {
      // キャンバスをBlobに変換
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      
      // FormDataの作成
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);
      
      // Cloudinaryにアップロード
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      if (!response.ok) throw new Error('アップロードに失敗しました');
      
      const data = await response.json();
      const secure_url = data.secure_url;
      
      // シェアページのURL生成
      const sharePageUrl = `https://after-school-share.as-chronicle.workers.dev/?img=${encodeURIComponent(secure_url)}`;
      lastShareUrl = sharePageUrl;
      
      // プラットフォーム別のシェアURL生成
      const text = '放課後クロニクル 学生証を作成しました！\n#放課後クロニクル';
      let shareUrl;
      
      switch (platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(sharePageUrl)}`;
          break;
        case 'line':
          shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(sharePageUrl)}`;
          break;
        default:
          throw new Error('未対応のプラットフォームです');
      }
      
      // プラットフォームに応じた処理
      window.open(shareUrl, '_blank');
      
    } catch (error) {
      console.error('シェアに失敗しました:', error);
      alert('シェアに失敗しました。もう一度お試しください。');
    }
  }

  // URLコピー機能
  async function copyShareUrl() {
    try {
      if (!lastShareUrl) {
        // 画像がまだアップロードされていない場合は、アップロードを実行
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const formData = new FormData();
        formData.append('file', blob);
        formData.append('upload_preset', cloudinaryConfig.uploadPreset);
        
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData
          }
        );
        
        if (!response.ok) throw new Error('アップロードに失敗しました');
        
        const data = await response.json();
        const secure_url = data.secure_url;
        lastShareUrl = `https://after-school-share.as-chronicle.workers.dev/?img=${encodeURIComponent(secure_url)}`;
      }

      await navigator.clipboard.writeText(lastShareUrl);
      alert('URLをクリップボードにコピーしました！');
    } catch (error) {
      console.error('URLのコピーに失敗しました:', error);
      alert('URLのコピーに失敗しました。もう一度お試しください。');
    }
  }

  // シェアボタンのイベントリスナー
  twBtn.addEventListener('click', () => uploadAndShare('twitter'));
  lnBtn.addEventListener('click', () => uploadAndShare('line'));
  copyBtn.addEventListener('click', copyShareUrl);

  console.log("Init: 初期化完了");
}); 