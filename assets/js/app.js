// ================================================================================
// ⚠️ 【重要な注意事項】
// ⚠️ このファイルの画像処理（PHOTO_FRAME）と文字位置座標は完璧に調整済みです！
// ⚠️ 今後診断テスト機能を追加する際も、画像・位置関連の設定は絶対に変更しないでください！
// ⚠️ 変更が必要な場合は必ず事前確認を取ってください！
// ================================================================================

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
// ================================================================================
// ⚠️ 【超重要・変更厳禁】写真フレームの座標とサイズは完璧に調整済みです！
// ⚠️ 今後絶対に変更しないでください！変更が必要な場合は必ず事前確認を取ってください！
// ⚠️ この設定により画像のアスペクト比保持とクリッピングが完璧に動作しています！
// ================================================================================
const PHOTO_FRAME = {
  x: 42,   // 完璧に調整済み【変更厳禁】
  y: 125,   // 完璧に調整済み【変更厳禁】
  width: 255,  // 完璧に調整済み【変更厳禁】
  height: 324  // 完璧に調整済み【変更厳禁】
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
    dobMonth: document.getElementById('dobMonth'),
    dobDay: document.getElementById('dobDay'),
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
    drawStudentCard(); // 初期表示でもプレビューを表示
  };

  templateImage.onerror = () => {
    console.error('テンプレート画像の読み込みに失敗しました');
    drawEmptyCard();
  };

  // 生年月日の入力設定
  function setupDateInputs() {
    // 既存の月・日selectを使用（HTMLで定義済み）
    const monthSelect = elements.dobMonth;
    const daySelect = elements.dobDay;

    // 月の変更時に日の選択肢を更新
    monthSelect.addEventListener('change', () => {
      updateDayOptions(daySelect, monthSelect.value);
      drawStudentCard(); // 常にリアルタイム更新
    });

    // 日の変更時にプレビューを更新
    daySelect.addEventListener('change', () => {
      drawStudentCard(); // 常にリアルタイム更新
    });
  }

  // 日の選択肢を更新
  function updateDayOptions(daySelect, month) {
    const currentDay = daySelect.value;
    const daysInMonth = month ? new Date(2024, month, 0).getDate() : 31;
    
    // すべてのoptionを取得
    const options = daySelect.querySelectorAll('option');
    
    // 各optionの表示/非表示を設定
    options.forEach(option => {
      const value = parseInt(option.value);
      if (isNaN(value) || value === 0) {
        // プレースホルダー（""の場合）は常に表示
        option.style.display = '';
      } else if (value <= daysInMonth) {
        // 月の日数以内は表示
        option.style.display = '';
      } else {
        // 月の日数を超える場合は非表示
        option.style.display = 'none';
      }
    });
    
    // 現在選択されている日が月の日数を超える場合はリセット
    if (currentDay && parseInt(currentDay) > daysInMonth) {
      daySelect.value = '';
    }
  }

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

      showLoading('写真を読み込み中...');

      // 画像をロード
      uploadedPhoto = new Image();
      uploadedPhoto.onload = () => {
        hideLoading();
        drawStudentCard();
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



  // 入力値のバリデーション
  function validateInputs(skipPhotoCheck = false) {
    if (!skipPhotoCheck && !uploadedPhoto) {
      return false;
    }

    const requiredFields = [
      elements.nameJa,
      elements.nameEn,
      elements.dobMonth,
      elements.dobDay
    ];

    return requiredFields.every(field => field.value);
  }

  // ================================================================================
  // ⚠️ 【超重要・変更厳禁】画像処理ロジックは完璧に調整済みです！
  // ⚠️ アスペクト比保持とクリッピングが完璧に動作しています！
  // ⚠️ 今後絶対に変更しないでください！変更が必要な場合は必ず事前確認を取ってください！
  // ================================================================================
  // 画像をPHOTO_FRAMEエリアに収めてトリミング（アスペクト比保持）
  function drawPhotoInFrame(ctx, img, frame) {
    ctx.save();
    
    // クリッピング領域を設定（水色の長方形の範囲）
    ctx.beginPath();
    ctx.rect(frame.x, frame.y, frame.width, frame.height);
    ctx.clip();
    
    // 画像のアスペクト比と枠のアスペクト比を計算
    const frameAspect = frame.width / frame.height;
    const imgAspect = img.width / img.height;
    
    let drawWidth, drawHeight, drawX, drawY;

    if (imgAspect > frameAspect) {
      // 画像が横長の場合：高さを枠に合わせて拡大し、横幅をはみ出させる
      drawHeight = frame.height;
      drawWidth = frame.height * imgAspect;
      drawX = frame.x - (drawWidth - frame.width) / 2; // 中央配置
      drawY = frame.y;
    } else {
      // 画像が縦長の場合：幅を枠に合わせて拡大し、縦幅をはみ出させる
      drawWidth = frame.width;
      drawHeight = frame.width / imgAspect;
      drawX = frame.x;
      drawY = frame.y - (drawHeight - frame.height) / 2; // 中央配置
    }
    
    // 画像を拡大してクリッピング領域内に描画
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    
    ctx.restore();
  }

  // 学籍番号生成（ランダム10桁）
  function generateStudentNumber() {
    return Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
  }

  // 学生証の描画
  function drawStudentCard() {
    ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    
    // テンプレート画像を描画
    ctx.drawImage(templateImage, 0, 0, CARD_WIDTH, CARD_HEIGHT);

    // アップロードされた写真を描画（水色長方形内に収める）
    if (uploadedPhoto) {
      drawPhotoInFrame(ctx, uploadedPhoto, PHOTO_FRAME);
    }

    // 値の整形（診断結果連携またはデフォルト値）
    const params = new URLSearchParams(location.search);
    const departmentLabel = params.get('course') || '';  // 診断結果からコース名を取得
    let clubLabel = params.get('club') || '';             // 診断結果から部活動を取得
    
    // 部活動が「なし」や空の場合は文芸部をデフォルトに
    if (!clubLabel || clubLabel === 'なし' || clubLabel === '') {
      clubLabel = '文芸';
    }

    // Webフォント読み込み確認後に描画
    document.fonts.ready.then(() => {
      // 座標変換関数（2291×1440 → 800×500用）
      function pos(x, y) {
        return [
          Math.round(x / 2291 * 800),
          Math.round(y / 1440 * 500)
        ];
      }

      // ================================================================================
      // ⚠️ 【超重要・変更厳禁】文字位置は完璧に調整済みです！
      // ⚠️ 今後絶対に座標・フォントサイズ・位置を変更しないでください！
      // ⚠️ 学科・部活動の設定方法が変わっても、この座標は絶対に変更厳禁です！
      // ⚠️ 変更が必要と思われる場合は、必ず一度確認を取ってから行ってください！
      // ================================================================================
      
      // テキストスタイルの基本設定
      ctx.textAlign = 'left';

      // 氏名（漢字） - 完璧な位置に調整済み【絶対変更禁止】
      ctx.font = '34px "Noto Serif JP", serif';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'left';
      const [nameX, nameY] = pos(1400, 540);
      if (elements.nameJa.value) {
        ctx.fillText(elements.nameJa.value, nameX, nameY);
      }

      // 氏名（ローマ字） - 完璧な位置に調整済み【絶対変更禁止】
      ctx.font = '16px "Noto Sans JP", sans-serif';
      ctx.fillStyle = '#666';
      const [nameEnX, nameEnY] = pos(1400, 620);
      if (elements.nameEn.value) {
        ctx.fillText(elements.nameEn.value, nameEnX, nameEnY);
      }

      // 学科とコースを分けて生成
      let actualDepartment = '';
      let actualCourse = '';
      
      if (departmentLabel) {
        switch(departmentLabel) {
          case '特進':
          case '特進コース':
            actualDepartment = '普通科';
            actualCourse = '特進コース';
            break;
          case '英語':
          case '英語コース':
            actualDepartment = '普通科';
            actualCourse = '英語コース';
            break;
          case '音楽':
          case '音楽コース':
            actualDepartment = '芸術科';
            actualCourse = '音楽コース';
            break;
          case '美術':
          case '美術コース':
            actualDepartment = '芸術科';
            actualCourse = '美術コース';
            break;
          default:
            // コース名が入っている場合は分離
            if (departmentLabel.endsWith('コース')) {
              const baseName = departmentLabel.replace('コース', '');
              if (baseName === '特進' || baseName === '英語') {
                actualDepartment = '普通科';
              } else if (baseName === '音楽' || baseName === '美術') {
                actualDepartment = '芸術科';
              } else {
                actualDepartment = '普通科';
              }
              actualCourse = departmentLabel;
            } else {
              actualDepartment = departmentLabel;
              actualCourse = departmentLabel + 'コース';
            }
        }
      }

      // 学科 - 完璧な位置に調整済み【絶対変更禁止】
      ctx.font = '22px "Noto Sans JP", sans-serif';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      const [deptX, deptY] = pos(1520, 800);
      if (actualDepartment) {
        // 学科から「科」の文字を削除
        const cleanDepartment = actualDepartment.replace(/科$/, '');
        ctx.fillText(cleanDepartment, deptX, deptY);
      }

      // コース - 完璧な位置に調整済み【絶対変更禁止】
      ctx.font = '22px "Noto Sans JP", sans-serif';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      const [courseX, courseY] = pos(2000, 800); // 完璧に調整済み【変更厳禁】
      if (actualCourse) {
        ctx.fillText(actualCourse, courseX, courseY);
      }

      // 部活 - 完璧な位置に調整済み【絶対変更禁止】
      ctx.font = '22px "Noto Sans JP", sans-serif';
      const [clubX, clubY] = pos(1620, 920);
      if (clubLabel) {
        // 部活動名から「部」の文字を削除
        const cleanClubName = clubLabel.replace(/部$/, '');
        ctx.fillText(cleanClubName, clubX, clubY);
      }

      // 生年月日 - 完璧な位置に調整済み【絶対変更禁止】
      ctx.font = '22px "Noto Sans JP", sans-serif';
      ctx.fillStyle = '#000';
      const month = elements.dobMonth.value;
      const day = elements.dobDay.value;
      
      if (month) {
        const [monthX, monthY] = pos(1570, 1050);
        ctx.fillText(month, monthX, monthY);
      }
      if (day) {
        const [dayX, dayY] = pos(1720, 1050);
        ctx.fillText(day, dayX, dayY);
      }
    });
  }

  // ダウンロードボタン
  elements.downloadBtn.addEventListener('click', () => {
    if (!validateInputs()) {
      alert('必要な情報をすべて入力してください。');
      return;
    }
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
    if (!validateInputs()) {
      alert('必要な情報をすべて入力してください。');
      return;
    }
    const text = encodeURIComponent('放課後クロニクルの学生証を作成しました！');
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
  });

  // LINEシェアボタン
  elements.lineBtn.addEventListener('click', () => {
    if (!validateInputs()) {
      alert('必要な情報をすべて入力してください。');
      return;
    }
    const url = encodeURIComponent(window.location.href);
    window.open(`https://line.me/R/msg/text/?放課後クロニクルの学生証を作成しました！%0D%0A${url}`);
  });

  // URLコピーボタン
  elements.urlBtn.addEventListener('click', async () => {
    if (!validateInputs()) {
      alert('必要な情報をすべて入力してください。');
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('URLをクリップボードにコピーしました。');
    } catch (err) {
      console.error('URLコピーエラー:', err);
      alert('URLのコピーに失敗しました。');
    }
  });

  // 完全なリアルタイムプレビュー機能
  function setupRealtimePreview() {
    // テキスト入力フィールドのリアルタイム更新
    const textElements = [elements.nameJa, elements.nameEn];
    textElements.forEach(element => {
      element.addEventListener('input', () => {
        drawStudentCard(); // 入力中にリアルタイム更新
      });
    });

    // 生年月日は既にsetupDateInputs()で設定済み
  }

  // リアルタイムプレビューを初期化
  setupRealtimePreview();

  // 生年月日の入力設定を初期化
  setupDateInputs();
} 