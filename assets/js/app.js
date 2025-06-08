import { cloudinaryConfig } from '../../cloudinary.config.js';

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
const CARD_WIDTH = 800;
const CARD_HEIGHT = 500;
const PHOTO_FRAME = {
  x: 50,
  y: 80,
  width: 200,
  height: 240
};

// DOM要素の取得
const photoInput = document.getElementById('photoInput');
const photoPreview = document.getElementById('photoPreview');
const nameJaInput = document.getElementById('nameJa');
const nameEnInput = document.getElementById('nameEn');
const departmentSelect = document.getElementById('department');
const clubSelect = document.getElementById('club');
const dobMonthInput = document.getElementById('dobMonth');
const dobDayInput = document.getElementById('dobDay');
const generateBtn = document.getElementById('generateBtn');
const cardCanvas = document.getElementById('cardCanvas');
const downloadBtn = document.getElementById('downloadBtn');
const twitterBtn = document.getElementById('twitterBtn');
const lineBtn = document.getElementById('lineBtn');
const urlBtn = document.getElementById('urlBtn');

// Canvas コンテキストの取得
const ctx = cardCanvas.getContext('2d');

// 画像オブジェクトの初期化
const templateImage = new Image();
templateImage.src = 'assets/img/student_template.png';
let uploadedPhoto = null;

// 写真アップロードの処理
photoInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('ファイルサイズは5MB以下にしてください。');
    }

    // 画像タイプチェック
    if (!file.type.startsWith('image/')) {
      throw new Error('画像ファイルを選択してください。');
    }

    // Cloudinaryにアップロード
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

    if (!response.ok) {
      throw new Error('画像のアップロードに失敗しました。');
    }

    const data = await response.json();
    
    // プレビュー表示
    uploadedPhoto = new Image();
    uploadedPhoto.src = data.secure_url;
    photoPreview.src = data.secure_url;
    photoPreview.style.display = 'block';

  } catch (error) {
    alert(error.message);
    photoInput.value = '';
    photoPreview.src = '';
    photoPreview.style.display = 'none';
  }
});

// 学生証生成処理
generateBtn.addEventListener('click', () => {
  if (!validateInputs()) return;
  drawStudentCard();
});

// 入力値のバリデーション
function validateInputs() {
  const requiredFields = [
    { value: nameJaInput.value, message: '氏名（漢字）を入力してください。' },
    { value: nameEnInput.value, message: '氏名（ローマ字）を入力してください。' },
    { value: departmentSelect.value, message: '学科を選択してください。' },
    { value: clubSelect.value, message: '部活動を選択してください。' },
    { value: dobMonthInput.value, message: '生年月日（月）を入力してください。' },
    { value: dobDayInput.value, message: '生年月日（日）を入力してください。' },
    { value: uploadedPhoto, message: '顔写真をアップロードしてください。' }
  ];

  for (const field of requiredFields) {
    if (!field.value) {
      alert(field.message);
      return false;
    }
  }

  const month = parseInt(dobMonthInput.value);
  const day = parseInt(dobDayInput.value);

  if (month < 1 || month > 12) {
    alert('月は1～12の範囲で入力してください。');
    return false;
  }

  if (day < 1 || day > 31) {
    alert('日は1～31の範囲で入力してください。');
    return false;
  }

  return true;
}

// 学生証の描画
function drawStudentCard() {
  // キャンバスをクリア
  ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // テンプレート画像を描画
  ctx.drawImage(templateImage, 0, 0, CARD_WIDTH, CARD_HEIGHT);

  // 写真を描画（アスペクト比を保持）
  const photoRatio = uploadedPhoto.width / uploadedPhoto.height;
  let drawWidth = PHOTO_FRAME.width;
  let drawHeight = PHOTO_FRAME.height;
  
  if (photoRatio > 1) {
    drawWidth = PHOTO_FRAME.height * photoRatio;
    ctx.drawImage(
      uploadedPhoto,
      PHOTO_FRAME.x - (drawWidth - PHOTO_FRAME.width) / 2,
      PHOTO_FRAME.y,
      drawWidth,
      PHOTO_FRAME.height
    );
  } else {
    drawHeight = PHOTO_FRAME.width / photoRatio;
    ctx.drawImage(
      uploadedPhoto,
      PHOTO_FRAME.x,
      PHOTO_FRAME.y - (drawHeight - PHOTO_FRAME.height) / 2,
      PHOTO_FRAME.width,
      drawHeight
    );
  }

  // テキスト描画設定
  ctx.fillStyle = '#2c3e50';
  ctx.textBaseline = 'top';

  // 学籍番号（ランダム生成）
  ctx.font = '14px monospace';
  ctx.fillText(generateStudentNumber(), CARD_WIDTH - 150, 20);

  // 氏名（漢字）
  ctx.font = 'bold 24px "Noto Serif JP"';
  ctx.fillText(nameJaInput.value, 280, 60);

  // 氏名（ローマ字）
  ctx.font = '16px "Noto Sans JP"';
  ctx.fillText(nameEnInput.value, 280, 100);

  // 学科・部活
  ctx.font = '14px "Noto Sans JP"';
  ctx.fillText(
    `${departmentSelect.value} / ${clubSelect.value}`,
    280,
    140
  );

  // 生年月日
  ctx.fillText(
    `${dobMonthInput.value}月${dobDayInput.value}日生`,
    280,
    170
  );

  // 学校名
  ctx.font = 'bold 16px "Noto Serif JP"';
  ctx.fillText('夢見が丘女子高等学校', CARD_WIDTH - 200, CARD_HEIGHT - 40);
}

// 学籍番号生成（ランダム10桁）
function generateStudentNumber() {
  return Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
}

// ダウンロードボタン
downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = '学生証.png';
  link.href = cardCanvas.toDataURL('image/png');
  link.click();
});

// Twitterシェアボタン
twitterBtn.addEventListener('click', () => {
  const text = encodeURIComponent('放課後クロニクルの学生証を作成しました！');
  const url = encodeURIComponent(window.location.href);
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
});

// LINEシェアボタン
lineBtn.addEventListener('click', () => {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://line.me/R/msg/text/?放課後クロニクルの学生証を作成しました！%0D%0A${url}`);
});

// URLコピーボタン
urlBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    alert('URLをクリップボードにコピーしました。');
  } catch (err) {
    alert('URLのコピーに失敗しました。');
  }
}); 