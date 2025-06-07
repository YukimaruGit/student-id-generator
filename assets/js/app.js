import { CLOUDINARY_CONFIG } from '../../cloudinary.config.js';

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
  const photoInput  = document.getElementById("photoInput");
  const nameI       = document.getElementById("nameInput");
  const nameEnI     = document.getElementById("nameEnInput");
  const deptI       = document.getElementById("deptInput");
  const clubI       = document.getElementById("clubInput");
  const monthI      = document.getElementById("birthMonth");
  const dayI        = document.getElementById("birthDay");
  const createBtn   = document.getElementById("createBtn");
  const previewArea = document.getElementById("previewArea");
  const canvas      = document.getElementById("studentCanvas");
  const ctx         = canvas.getContext("2d");
  const dlBtn       = document.getElementById("downloadBtn");
  const twBtn       = document.getElementById("twitterShareBtn");
  const lnBtn       = document.getElementById("lineShareBtn");

  // 要素の存在チェック
  if (!monthI || !dayI) {
    console.error("birthMonth/birthDay が見つかりません");
    return;
  }

  // 背景画像の読み込み
  let bgImg = new Image();
  let photoImg = null;

  // 背景画像のロード処理
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

  for(let i=1; i<=12; i++){
    const o = new Option(i, i);
    monthI.appendChild(o);
  }
  for(let i=1; i<=31; i++){
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

  // 顔写真アップロード時
  photoInput.addEventListener("change", e => {
    const f = e.target.files[0]; 
    if(!f) return;
    const img = new Image();
    img.onload = () => {
      photoImg = img;
      previewArea.style.display = "block";
      if (bgImg) drawCard();
    };
    img.src = URL.createObjectURL(f);
  });

  // 学生証作成ボタン
  createBtn.addEventListener("click", () => {
    if(!photoImg) return alert("顔写真をアップしてください");
    if(!bgImg) return alert("背景画像の読み込みを待っています...");
    drawCard();
    window.scrollTo({top:previewArea.offsetTop,behavior:"smooth"});
  });

  // カード描画処理
  function drawCard(){
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

      const name    = nameI.value||"——";
      const nameEn  = nameEnI.value||"——";
      const dept    = deptI.value||"——";
      const club    = clubI.value||"——";
      const month   = monthI.value||"–";
      const day     = dayI.value||"–";

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

  // シェア処理
  async function uploadAndShare(){
    try {
      if (!bgImg || !bgImg.complete) {
        alert("背景画像の読み込みを待っています...");
        return;
      }
      console.log("Share: アップロード開始");
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        }, "image/png");
      });

      // Cloudinary アップロード
      const form = new FormData();
      form.append("file", blob);
      form.append("upload_preset", CLOUDINARY_CONFIG.upload_preset);

      const uploadURL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`;
      console.log("Share: Cloudinaryへのアップロード開始", uploadURL);

      const res = await fetch(uploadURL, { 
        method: "POST", 
        body: form 
      });
      
      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("Share: アップロード完了", data);

      // Intent URL に付与
      const text = encodeURIComponent("放課後クロニクル 学生証を作成しました！ #放課後クロニクル");
      const intent = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(data.secure_url)}`;
      console.log("Share: Intent URL生成", intent);

      window.open(intent, "_blank");
      console.log("Share: シェアウィンドウを開きました");
    } catch (err) {
      console.error("Share: シェア処理失敗", err);
      alert("画像のアップロードに失敗しました。\nエラー: " + err.message);
    }
  }

  // シェアボタンのイベントリスナ
  twBtn.addEventListener("click", () => {
    console.log("▶︎ Twitter Share button clicked");
    uploadAndShare();
  });
  lnBtn.addEventListener("click", () => {
    console.log("▶︎ LINE Share button clicked");
    uploadAndShare();
  });

  console.log("Init: 初期化完了");
}); 