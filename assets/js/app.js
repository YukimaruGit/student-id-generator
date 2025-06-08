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

// DOM読み込み完了を待つ
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  // DOM要素の取得
  const elements = {
    photoInput: document.getElementById('photoInput'),
    photoPreview: document.getElementById('photoPreview'),
    previewContainer: document.getElementById('previewContainer'),
    nameJa: document.getElementById('nameJa'),
    nameEn: document.getElementById('nameEn'),
    department: document.getElementById('department'),
    club: document.getElementById('club'),
    dobMonth: document.getElementById('dobMonth'),
    dobDay: document.getElementById('dobDay'),
    generateBtn: document.getElementById('generateBtn'),
    cardCanvas: document.getElementById('cardCanvas'),
    downloadBtn: document.getElementById('downloadBtn'),
    twitterBtn: document.getElementById('twitterBtn'),
    lineBtn: document.getElementById('lineBtn'),
    urlBtn: document.getElementById('urlBtn'),
    loadingOverlay: document.getElementById('loadingOverlay')
  };

  // DOM要素の存在チェック
  for (const [key, element] of Object.entries(elements)) {
    if (!element) {
      console.error(`要素が見つかりません: ${key}`);
      return;
    }
  }

  // Canvas コンテキストの取得
  const ctx = elements.cardCanvas.getContext('2d');

  // 画像オブジェクトの初期化
  const templateImage = new Image();
  templateImage.src = 'assets/img/student_template.png';
  let uploadedPhoto = null;

  // ローディング表示の制御
  function showLoading(message = '処理中...') {
    elements.loadingOverlay.querySelector('p').textContent = message;
    elements.loadingOverlay.classList.add('active');
  }

  function hideLoading() {
    elements.loadingOverlay.classList.remove('active');
  }

  // テンプレート画像の読み込み完了を待つ
  templateImage.onload = () => {
    console.log('テンプレート画像の読み込みが完了しました');
    drawEmptyCard();
  };

  // 空の学生証を描画
  function drawEmptyCard() {
    ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    ctx.drawImage(templateImage, 0, 0, CARD_WIDTH, CARD_HEIGHT);
  }

  // 写真アップロードの処理
  elements.photoInput.addEventListener('change', async (e) => {
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

      showLoading('写真をアップロード中...');

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
      uploadedPhoto.onload = () => {
        elements.photoPreview.src = data.secure_url;
        elements.photoPreview.classList.add('loaded');
        elements.previewContainer.classList.add('has-image');
        hideLoading();
      };
      uploadedPhoto.onerror = () => {
        throw new Error('画像の読み込みに失敗しました。');
      };
      uploadedPhoto.src = data.secure_url;

    } catch (error) {
      console.error('アップロードエラー:', error);
      alert(error.message);
      elements.photoInput.value = '';
      elements.photoPreview.src = '';
      elements.photoPreview.classList.remove('loaded');
      elements.previewContainer.classList.remove('has-image');
      hideLoading();
    }
  });

  // 学生証生成処理
  elements.generateBtn.addEventListener('click', () => {
    if (!validateInputs()) return;
    showLoading('学生証を生成中...');
    setTimeout(() => {
      drawStudentCard();
      hideLoading();
    }, 500);
  });

  // 入力値のバリデーション
  function validateInputs() {
    if (!uploadedPhoto) {
      alert('顔写真をアップロードしてください。');
      elements.photoInput.focus();
      return false;
    }

    const requiredFields = [
      { element: elements.nameJa, message: '氏名（漢字）を入力してください。' },
      { element: elements.nameEn, message: '氏名（ローマ字）を入力してください。' },
      { element: elements.department, message: '学科を選択してください。' },
      { element: elements.club, message: '部活動を選択してください。' },
      { element: elements.dobMonth, message: '生年月日（月）を入力してください。' },
      { element: elements.dobDay, message: '生年月日（日）を入力してください。' }
    ];

    for (const field of requiredFields) {
      if (!field.element.value) {
        alert(field.message);
        field.element.focus();
        return false;
      }
    }

    const month = parseInt(elements.dobMonth.value);
    const day = parseInt(elements.dobDay.value);

    if (month < 1 || month > 12) {
      alert('月は1～12の範囲で入力してください。');
      elements.dobMonth.focus();
      return false;
    }

    if (day < 1 || day > 31) {
      alert('日は1～31の範囲で入力してください。');
      elements.dobDay.focus();
      return false;
    }

    // 月ごとの日数チェック
    const daysInMonth = new Date(2024, month, 0).getDate();
    if (day > daysInMonth) {
      alert(`${month}月の日付は1～${daysInMonth}の範囲で入力してください。`);
      elements.dobDay.focus();
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
    ctx.fillText(elements.nameJa.value, 280, 60);

    // 氏名（ローマ字）
    ctx.font = '16px "Noto Sans JP"';
    ctx.fillText(elements.nameEn.value, 280, 100);

    // 学科・部活
    ctx.font = '14px "Noto Sans JP"';
    ctx.fillText(
      `${elements.department.value} / ${elements.club.value}`,
      280,
      140
    );

    // 生年月日
    ctx.fillText(
      `${elements.dobMonth.value}月${elements.dobDay.value}日生`,
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
  elements.downloadBtn.addEventListener('click', () => {
    try {
      const link = document.createElement('a');
      link.download = '学生証.png';
      link.href = elements.cardCanvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('ダウンロードエラー:', error);
      alert('画像のダウンロードに失敗しました。');
    }
  });

  // Twitterシェアボタン
  elements.twitterBtn.addEventListener('click', () => {
    const text = encodeURIComponent('放課後クロニクルの学生証を作成しました！');
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
  });

  // LINEシェアボタン
  elements.lineBtn.addEventListener('click', () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://line.me/R/msg/text/?放課後クロニクルの学生証を作成しました！%0D%0A${url}`);
  });

  // URLコピーボタン
  elements.urlBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('URLをクリップボードにコピーしました。');
    } catch (err) {
      console.error('URLコピーエラー:', err);
      alert('URLのコピーに失敗しました。');
    }
  });

  // ドラッグ&ドロップ対応
  elements.previewContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.previewContainer.classList.add('dragover');
  });

  elements.previewContainer.addEventListener('dragleave', () => {
    elements.previewContainer.classList.remove('dragover');
  });

  elements.previewContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.previewContainer.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
      elements.photoInput.files = e.dataTransfer.files;
      elements.photoInput.dispatchEvent(new Event('change'));
    }
  });
} 