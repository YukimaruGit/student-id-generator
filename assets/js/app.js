

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

  templateImage.onerror = () => {
    console.error('テンプレート画像の読み込みに失敗しました');
    // フォールバックとして空のカードを描画
    drawEmptyCard();
  };

  // 空の学生証を描画
  function drawEmptyCard() {
    ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    
    // 背景色
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    
    // ヘッダー部分
    ctx.fillStyle = '#8e44ad';
    ctx.fillRect(0, 0, CARD_WIDTH, 60);
    
    // 学校名
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px "Noto Serif JP"';
    ctx.textBaseline = 'middle';
    ctx.fillText('夢見が丘女子高等学校', 20, 35);

    // 枠線
    ctx.strokeStyle = '#8e44ad';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    // 写真枠
    ctx.strokeStyle = '#e0e0e0';
    ctx.strokeRect(
      PHOTO_FRAME.x,
      PHOTO_FRAME.y,
      PHOTO_FRAME.width,
      PHOTO_FRAME.height
    );

    // 写真アイコン
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '48px "Font Awesome 6 Free"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\uf007', // user icon
      PHOTO_FRAME.x + PHOTO_FRAME.width / 2,
      PHOTO_FRAME.y + PHOTO_FRAME.height / 2
    );

    // 「学生証」の文字
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 36px "Noto Serif JP"';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    ctx.fillText('学生証', CARD_WIDTH / 2, 80);

    // プレースホルダーテキスト
    ctx.font = '16px "Noto Sans JP"';
    ctx.fillStyle = '#95a5a6';
    ctx.fillText('入力内容がここに表示されます', CARD_WIDTH / 2, CARD_HEIGHT / 2);
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

      showLoading('写真を読み込み中...');

      // 画像をロード
      uploadedPhoto = new Image();
      uploadedPhoto.onload = () => {
        hideLoading();
        if (validateInputs(true)) {
          drawStudentCard();
        }
      };
      uploadedPhoto.onerror = () => {
        throw new Error('画像の読み込みに失敗しました。');
      };

      // FileReaderで画像を読み込む
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadedPhoto.src = e.target.result;
      };
      reader.onerror = () => {
        throw new Error('画像の読み込みに失敗しました。');
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('アップロードエラー:', error);
      alert(error.message);
      elements.photoInput.value = '';
      uploadedPhoto = null;
      hideLoading();
      drawEmptyCard();
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
  function validateInputs(skipPhotoCheck = false) {
    if (!skipPhotoCheck && !uploadedPhoto) {
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

    // 背景色
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    // ヘッダー部分
    ctx.fillStyle = '#8e44ad';
    ctx.fillRect(0, 0, CARD_WIDTH, 60);

    // 学校名（ヘッダー）
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px "Noto Serif JP"';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText('夢見が丘女子高等学校', 20, 35);

    // 枠線
    ctx.strokeStyle = '#8e44ad';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    // 写真を描画
    if (uploadedPhoto) {
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
    } else {
      // 写真枠
      ctx.strokeStyle = '#e0e0e0';
      ctx.strokeRect(
        PHOTO_FRAME.x,
        PHOTO_FRAME.y,
        PHOTO_FRAME.width,
        PHOTO_FRAME.height
      );

      // 写真アイコン
      ctx.fillStyle = '#e0e0e0';
      ctx.font = '48px "Font Awesome 6 Free"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\uf007', // user icon
        PHOTO_FRAME.x + PHOTO_FRAME.width / 2,
        PHOTO_FRAME.y + PHOTO_FRAME.height / 2
      );
    }

    // テキスト描画設定
    ctx.fillStyle = '#2c3e50';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    // 「学生証」の文字
    ctx.font = 'bold 36px "Noto Serif JP"';
    ctx.textAlign = 'center';
    ctx.fillText('学生証', CARD_WIDTH / 2, 80);
    ctx.textAlign = 'left';

    // 学籍番号（ランダム生成）
    ctx.font = '16px monospace';
    ctx.fillText(generateStudentNumber(), CARD_WIDTH - 200, 40);

    // 情報エリアの背景
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(280, 140, CARD_WIDTH - 320, 280);
    ctx.strokeStyle = '#e0e0e0';
    ctx.strokeRect(280, 140, CARD_WIDTH - 320, 280);

    // 情報テキスト
    ctx.fillStyle = '#2c3e50';
    let startY = 160;
    const lineHeight = 50;

    // 氏名（漢字）
    ctx.font = 'bold 24px "Noto Serif JP"';
    ctx.fillText(elements.nameJa.value, 300, startY);
    startY += lineHeight;

    // 氏名（ローマ字）
    ctx.font = '16px "Noto Sans JP"';
    ctx.fillText(elements.nameEn.value, 300, startY);
    startY += lineHeight;

    // 学科・部活
    ctx.fillText(
      `${elements.department.value} / ${elements.club.value}`,
      300,
      startY
    );
    startY += lineHeight;

    // 生年月日
    ctx.fillText(
      `${elements.dobMonth.value}月${elements.dobDay.value}日生`,
      300,
      startY
    );

    // 学校名（フッター）
    ctx.font = 'bold 16px "Noto Serif JP"';
    ctx.fillText('夢見が丘女子高等学校', CARD_WIDTH - 250, CARD_HEIGHT - 40);
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

  // フォーム入力時のリアルタイムプレビュー
  const formElements = [
    elements.nameJa,
    elements.nameEn,
    elements.department,
    elements.club,
    elements.dobMonth,
    elements.dobDay
  ];

  formElements.forEach(element => {
    element.addEventListener('input', () => {
      if (validateInputs(true)) {
        drawStudentCard();
      }
    });
  });
} 