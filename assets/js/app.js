// ================================================================================
// ⚠️ 【重要な注意事項】
// ⚠️ このファイルの画像処理（PHOTO_FRAME）と文字位置座標は完璧に調整済みです！
// ⚠️ 今後診断テスト機能を追加する際も、画像・位置関連の設定は絶対に変更しないでください！
// ⚠️ 変更が必要な場合は必ず事前確認を取ってください！
// ================================================================================

// 効果音の準備（一時的にコメントアウト）
const SOUNDS = {
  bell: { play: () => console.log('Bell sound effect') },
  chalk: { play: () => console.log('Chalk sound effect') },
  flip: { play: () => console.log('Flip sound effect') }
};

// Cloudinary設定
const cloudinaryConfig = {
  cloudName: 'di5rxlddy',
  uploadPreset: 'student_card_AS_chronicle'
};

// シェア機能 - ローカル環境でも動作する安全な方法
async function uploadImageToCloudinary(canvas, cloudName, uploadPreset) {
  return new Promise((resolve, reject) => {
    try {
      // Canvasから直接Blobを作成（ローカル環境でも安全）
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('画像の変換に失敗しました。'));
          return;
        }
        
        try {
          const formData = new FormData();
          formData.append('file', blob);
          formData.append('upload_preset', uploadPreset);

          const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error(`Cloudinary upload failed: ${response.status}`);
          }

          const data = await response.json();
          resolve(data.secure_url);
        } catch (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        }
      }, 'image/png', 0.9);
    } catch (error) {
      console.error('Canvas conversion error:', error);
      reject(new Error('画像の変換に失敗しました。'));
    }
  });
}

function generateShareUrl(imageUrl) {
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
  return `${baseUrl}/share.html?img=${encodeURIComponent(imageUrl)}`;
}

function downloadCanvasAsImage(canvas, filename = '学生証.png') {
  try {
    // Blob方式を優先（より安全）
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // フォールバック: toDataURL
        try {
          const link = document.createElement('a');
          link.download = filename;
          link.href = canvas.toDataURL('image/png');
          link.click();
        } catch (e) {
          console.error('Download failed:', e);
          alert('ダウンロードに失敗しました。ブラウザを変更するか、画像を右クリックして保存してください。');
        }
      }
    }, 'image/png', 0.9);
  } catch (error) {
    console.error('Canvas download failed:', error);
    alert('ダウンロードに失敗しました。もう一度お試しください。');
  }
}

function generateTwitterShareUrl(shareUrl, text = '放課後クロニクル 学生証を作成しました！') {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
}

async function copyUrlToClipboard(url) {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (err) {
    console.error('Failed to copy URL:', err);
    return false;
  }
}

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
    urlBtn: document.getElementById('urlBtn'),
    loadingOverlay: document.getElementById('loadingOverlay')
  };

  // DOM要素の存在チェック（必須要素のみ）
  const requiredElements = ['photoInput', 'nameJa', 'nameEn', 'dobMonth', 'dobDay', 'cardCanvas', 'downloadBtn', 'twitterBtn', 'urlBtn', 'loadingOverlay'];
  for (const key of requiredElements) {
    if (!elements[key]) {
      console.error(`要素が見つかりません: ${key}`);
      return;
    }
  }

  // Canvas コンテキストの取得
  const ctx = elements.cardCanvas.getContext('2d');

  // 画像オブジェクトの初期化（ローカル環境対応）
  const templateImage = new Image();
  let uploadedPhoto = null;
  
  // ローカル環境ではcrossOriginを設定せずに読み込み
  function loadTemplateImage() {
    templateImage.src = 'assets/img/student_template.png';
  }

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
    setTimeout(() => {
      window.drawStudentCard();
    }, 100);
  };

  templateImage.onerror = () => {
    console.error('テンプレート画像の読み込みに失敗しました');
    drawEmptyCard();
  };

  // テンプレート画像を読み込み
  loadTemplateImage();

  // 生年月日の入力設定
  function setupDateInputs() {
    const monthSelect = elements.dobMonth;
    const daySelect = elements.dobDay;

    monthSelect.addEventListener('change', () => {
      updateDayOptions(daySelect, monthSelect.value);
      window.drawStudentCard();
    });

    daySelect.addEventListener('change', () => {
      window.drawStudentCard();
    });
  }

  // 日の選択肢を更新
  function updateDayOptions(daySelect, month) {
    const currentDay = daySelect.value;
    const daysInMonth = month ? new Date(2024, month, 0).getDate() : 31;
    
    const options = daySelect.querySelectorAll('option');
    
    options.forEach(option => {
      const value = parseInt(option.value);
      if (isNaN(value) || value === 0) {
        option.style.display = '';
      } else if (value <= daysInMonth) {
        option.style.display = '';
      } else {
        option.style.display = 'none';
      }
    });
    
    if (currentDay && parseInt(currentDay) > daysInMonth) {
      daySelect.value = '';
    }
  }

  // 空の学生証を描画
  function drawEmptyCard() {
    ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    if (templateImage.complete && templateImage.naturalWidth > 0) {
      ctx.drawImage(templateImage, 0, 0, CARD_WIDTH, CARD_HEIGHT);
    }
  }

  // 写真アップロードの処理
  elements.photoInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('ファイルサイズは5MB以下にしてください。');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('画像ファイルを選択してください。');
      }

      showLoading('写真を読み込み中...');

      uploadedPhoto = new Image();
      uploadedPhoto.onload = () => {
        hideLoading();
        window.drawStudentCard();
      };
      uploadedPhoto.onerror = () => {
        throw new Error('画像の読み込みに失敗しました。');
      };

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
  function drawPhotoInFrame(ctx, img, frame) {
    ctx.save();
    
    ctx.beginPath();
    ctx.rect(frame.x, frame.y, frame.width, frame.height);
    ctx.clip();
    
    const frameAspect = frame.width / frame.height;
    const imgAspect = img.width / img.height;
    
    let drawWidth, drawHeight, drawX, drawY;

    if (imgAspect > frameAspect) {
      drawHeight = frame.height;
      drawWidth = frame.height * imgAspect;
      drawX = frame.x - (drawWidth - frame.width) / 2;
      drawY = frame.y;
    } else {
      drawWidth = frame.width;
      drawHeight = frame.width / imgAspect;
      drawX = frame.x;
      drawY = frame.y - (drawHeight - frame.height) / 2;
    }
    
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    
    ctx.restore();
  }

  // 学生証の描画（グローバル関数として公開）
  window.drawStudentCard = function drawStudentCard() {
    ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    
    if (templateImage.complete && templateImage.naturalWidth > 0) {
      ctx.drawImage(templateImage, 0, 0, CARD_WIDTH, CARD_HEIGHT);
    } else {
      console.log('テンプレート画像を再読み込みします');
      setTimeout(() => {
        if (templateImage.complete && templateImage.naturalWidth > 0) {
          window.drawStudentCard();
        }
      }, 500);
      return;
    }

    if (uploadedPhoto) {
      drawPhotoInFrame(ctx, uploadedPhoto, PHOTO_FRAME);
    }

    const params = new URLSearchParams(location.search);
    const departmentLabel = params.get('course') || '';
    let clubLabel = params.get('club') || '';
    
    if (!clubLabel || clubLabel === 'なし' || clubLabel === '') {
      clubLabel = '文芸';
    }

    document.fonts.ready.then(() => {
      // ================================================================================
      // ⚠️ 【超重要・変更厳禁】文字位置は完璧に調整済みです！
      // ⚠️ 今後絶対に座標・フォントサイズ・位置を変更しないでください！
      // ⚠️ 学科・部活動の設定方法が変わっても、この座標は絶対に変更厳禁です！
      // ⚠️ 変更が必要と思われる場合は、必ず一度確認を取ってから行ってください！
      // ================================================================================
      
      function pos(x, y) {
        return [
          Math.round(x / 2291 * 800),
          Math.round(y / 1440 * 500)
        ];
      }

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
        const cleanDepartment = actualDepartment.replace(/科$/, '');
        ctx.fillText(cleanDepartment, deptX, deptY);
      }

      // コース - 完璧な位置に調整済み【絶対変更禁止】
      ctx.font = '22px "Noto Sans JP", sans-serif';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      const [courseX, courseY] = pos(2000, 800);
      if (actualCourse) {
        ctx.fillText(actualCourse, courseX, courseY);
      }

      // 部活 - 完璧な位置に調整済み【絶対変更禁止】
      ctx.font = '22px "Noto Sans JP", sans-serif';
      const [clubX, clubY] = pos(1620, 920);
      if (clubLabel) {
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
  };

  // ダウンロードボタン
  elements.downloadBtn.addEventListener('click', () => {
    if (!validateInputs(true)) {
      alert('氏名と生年月日を入力してください。');
      return;
    }
    try {
      downloadCanvasAsImage(elements.cardCanvas, '学生証.png');
    } catch (error) {
      console.error('ダウンロードエラー:', error);
      alert('画像のダウンロードに失敗しました。もう一度お試しください。');
    }
  });

  // Twitterシェアボタン
  elements.twitterBtn.addEventListener('click', async () => {
    if (!validateInputs(true)) {
      alert('氏名と生年月日を入力してください。');
      return;
    }
    
    try {
      showLoading('画像をアップロード中...');
      
      const imageUrl = await uploadImageToCloudinary(
        elements.cardCanvas, 
        cloudinaryConfig.cloudName, 
        cloudinaryConfig.uploadPreset
      );
      
      const shareUrl = generateShareUrl(imageUrl);
      const twitterUrl = generateTwitterShareUrl(shareUrl);
      window.open(twitterUrl);
      
      hideLoading();
    } catch (error) {
      console.error('Twitterシェアエラー:', error);
      hideLoading();
      alert('画像のアップロードに失敗しました。もう一度お試しください。');
    }
  });

  // URLコピーボタン
  elements.urlBtn.addEventListener('click', async () => {
    if (!validateInputs(true)) {
      alert('氏名と生年月日を入力してください。');
      return;
    }
    
    try {
      showLoading('画像をアップロード中...');
      
      const imageUrl = await uploadImageToCloudinary(
        elements.cardCanvas, 
        cloudinaryConfig.cloudName, 
        cloudinaryConfig.uploadPreset
      );
      
      const shareUrl = generateShareUrl(imageUrl);
      const success = await copyUrlToClipboard(shareUrl);
      
      hideLoading();
      
      if (success) {
        alert('シェア用URLをクリップボードにコピーしました。');
      } else {
        alert('URLのコピーに失敗しました。');
      }
    } catch (error) {
      console.error('URLコピーエラー:', error);
      hideLoading();
      alert('画像のアップロードに失敗しました。もう一度お試しください。');
    }
  });

  // 完全なリアルタイムプレビュー機能
  function setupRealtimePreview() {
    const textElements = [elements.nameJa, elements.nameEn];
    textElements.forEach(element => {
      element.addEventListener('input', () => {
        window.drawStudentCard();
      });
    });
  }

  setupRealtimePreview();
  setupDateInputs();
}
