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
  cloudName: 'di5xqlddy',
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
          // public_idとsecure_urlの両方を返す
          resolve({
            public_id: data.public_id,
            secure_url: data.secure_url
          });
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

function generateShareUrl(imageUrl, studentInfo = {}) {
  // ドメインマスキングを使用してGit情報を隠蔽
  if (window.DomainMasking) {
    const params = {
      i: imageUrl
    };
    if (studentInfo.name) params.n = studentInfo.name;
    
    // 古い共有方式（非推奨）
    // const originalUrl = new URL('s.html', window.location.origin).toString();
    // return window.DomainMasking.generateShortUrl(originalUrl, params);
    
    // 新しい短いURL方式を推奨
    console.warn('古い共有方式は非推奨です。新しい短いURL方式を使用してください。');
    return '新しい短いURL方式が利用できません';
  }
  
  // フォールバック: 従来の方式（非推奨 - 新しい短いURL方式を使用）
  // const shareUrl = new URL('s.html', window.location.origin);
  // shareUrl.searchParams.set('i', imageUrl); // 短縮パラメータ
  // if (studentInfo.name) shareUrl.searchParams.set('n', studentInfo.name); // 短縮パラメータ
  // return shareUrl.toString();
  
  // 新しい短いURL方式を推奨
  console.warn('古い共有方式は非推奨です。新しい短いURL方式を使用してください。');
  return '新しい短いURL方式が利用できません';
}

function downloadCanvasAsImage(canvas, filename = '学生証.png') {
  try {
    const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
    const pre = window.open('about:blank'); // 先に開く（ポップアップブロック回避）

    canvas.toBlob(blob => {
      if (!blob) { if (pre) pre.close(); alert('画像の生成に失敗しました'); return; }

      const url = URL.createObjectURL(blob);
      if (isIOS) {
        // iOSは新規タブで表示して「画像を保存」
        if (pre) pre.location.href = url;
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        return;
      }
      // 通常ブラウザ：ダウンロード属性
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      if (pre) pre.close();
    }, 'image/png', 0.95);
    return true;
  } catch (e) { console.warn(e); return false; }
}

function generateTwitterShareUrl(shareUrl, text = '放課後クロニクル 学生証を作成しました！') {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
}

async function copyUrlToClipboard(text){
  // 1) 標準API（トップレベル & HTTPS）
  try {
    const topLevel = (window.top === window.self);
    if (navigator.clipboard && window.isSecureContext && topLevel) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch(_) {}

  // 2) execCommand フォールバック
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-99999px';
    ta.style.top = '-99999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (ok) return true;
  } catch(_) {}

  // 最終手段は呼び出し側で実施（ここでは静かに失敗を返す）
  return false;
}

// iOS対応: 堅牢なコピー機能（clipboard → execCommand の二段構え）
async function copyTextReliable(text) {
  // 1) Clipboard API（iframeでも試す）
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch(e){ /* 続行 */ }

  // 2) execCommandフォールバック（ユーザー操作直後なら多くの端末で成功）
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    if (ok) return true;
  } catch(e){ /* 続行 */ }

  // 3) 最終手段：新規タブで自動コピー（埋め込み・iOS対策）
  const u = new URL('copy.html', location.origin);
  u.searchParams.set('u', text);
  window.open(u.toString(), '_blank', 'noopener'); // ここでタブを開く
  return false;
}

// Xアプリ起動（アプリ優先→ダメなら Web intent）
window.openXAppOrIntent = function openXAppOrIntent(webIntent) {
  try {
    const embedded = (window.top !== window.self);
    if (embedded) {
      // iframe内は最初からWeb Intentへ（白画面回避）
      window.open(webIntent, '_blank', 'noopener');
      return true;
    }
    // アプリスキームを新しいタブで試行（ユーザー操作直後の同期クリック扱い）
    const msg = new URL(webIntent).searchParams.get('text') || '';
    const scheme = `twitter://post?message=${encodeURIComponent(msg)}`;
    const a = document.createElement('a');
    a.href = scheme;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    let done = false;
    a.click();
    setTimeout(() => {
      if (!done) window.open(webIntent, '_blank', 'noopener');
    }, 800);
    setTimeout(() => { done = true; }, 1200);
    a.remove();
    return true;
  } catch (e) { console.warn(e); return false; }
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
  // DOM要素の取得（セキュリティ強化版）
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

  // NGワードリスト（包括的）
  const ngWords = [
    // 暴力的表現
    '死ね', 'しね', 'シネ', '殺す', 'ころす', 'コロス', '殺せ', 'ころせ',
    '首吊り', '自殺', 'じさつ', 'ジサツ', '自害', '死体', 'したい',
    
    // 下品な表現
    'ちんこ', 'チンコ', 'ちんぽ', 'チンポ', 'ちん○', 'チン○',
    'まんこ', 'マンコ', 'まん○', 'マン○',
    'うんこ', 'ウンコ', 'うんち', 'ウンチ', 'うん○', 'ウン○',
    'セックス', 'せっくす', 'エッチ', 'えっち', 'やりまん', 'ヤリマン',
    
    // 差別用語
    'きちがい', 'キチガイ', '気違い', 'きち○', 'キチ○',
    'つんぼ', 'ツンボ', 'つん○', 'ツン○',
    'めくら', 'メクラ', 'めく○', 'メク○',
    'おし', 'オシ', 'お○', 'オ○',
    'かたわ', 'カタワ', 'かた○', 'カタ○',
    'びっこ', 'ビッコ', 'びっ○', 'ビッ○',
    'いざり', 'イザリ', 'いざ○', 'イザ○',
    
    // 侮辱表現
    'ばか', 'バカ', '馬鹿', 'ば○', 'バ○',
    'あほ', 'アホ', '阿呆', 'あ○', 'ア○',
    'くそ', 'クソ', '糞', 'く○', 'ク○',
    'ぶす', 'ブス', 'ぶ○', 'ブ○',
    'でぶ', 'デブ', 'で○', 'デ○',
    'はげ', 'ハゲ', 'は○', 'ハ○',
    'ちび', 'チビ', 'ち○', 'チ○',
    
    // 犯罪関連
    'レイプ', 'れいぷ', 'レイ○', 'れい○',
    '強姦', 'ごうかん', 'ゴウカン', '強○', 'ごう○',
    '痴漢', 'ちかん', 'チカン', '痴○', 'ち○',
    '盗撮', 'とうさつ', 'トウサツ', '盗○', 'とう○',
    
    // その他不適切表現
    'うざい', 'ウザイ', 'うざ○', 'ウザ○',
    'きもい', 'キモイ', 'きも○', 'キモ○',
    'しつこい', 'シツコイ', 'しつこ○', 'シツコ○',
    'やばい', 'ヤバイ', 'やば○', 'ヤバ○'
  ];

  // 入力値の安全性検証（NGワード追加）
  function validateInput(value) {
    if (!value || typeof value !== 'string') return '';
    
    // NGワードチェック
    const lowerValue = value.toLowerCase();
    const hasNgWord = ngWords.some(ngWord => {
      return lowerValue.includes(ngWord.toLowerCase()) || 
             value.includes(ngWord);
    });
    
    if (hasNgWord) {
      console.warn('🚫 不適切な言葉が含まれています');
      // NGワードを「*」で置換
      let sanitized = value;
      ngWords.forEach(ngWord => {
        const regex = new RegExp(ngWord, 'gi');
        sanitized = sanitized.replace(regex, '*'.repeat(ngWord.length));
      });
      return sanitized;
    }
    
    // 危険なスクリプトタグやHTMLタグを除去
    const sanitized = value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '') // HTMLタグ除去
      .replace(/javascript:/gi, '') // javascript: プロトコル除去
      .replace(/on\w+\s*=/gi, '') // イベントハンドラ除去
      .replace(/data:(?!image\/)/gi, '') // data:URIの制限（画像以外）
      .replace(/vbscript:/gi, '') // VBScript除去
      .trim();
    
    // 長すぎる入力値を制限
    if (sanitized.length > 500) {
      return sanitized.substring(0, 500);
    }
    
    return sanitized;
  }

  // 入力フィールドの検証設定
  function setupInputValidation() {
    [elements.nameJa, elements.nameEn].forEach(element => {
      if (element) {
        element.addEventListener('input', function(e) {
          const originalValue = e.target.value;
          let sanitizedValue = validateInput(originalValue);
          
          // 英字フィールドの場合はスペースを許容するサニタイズ
          if (element.id === 'nameEn') {
            sanitizedValue = originalValue
              .replace(/[^A-Za-z .-]/g, '') // 英字・スペース・. と - のみ許可
              .replace(/\s{2,}/g, ' '); // 連続空白は1つに
          }
          
          if (originalValue !== sanitizedValue) {
            e.target.value = sanitizedValue;
            console.log('🧹 入力値をサニタイズしました');
          }
        });
        
        element.addEventListener('paste', function(e) {
          setTimeout(() => {
            const originalValue = e.target.value;
            const sanitizedValue = validateInput(originalValue);
            
            if (originalValue !== sanitizedValue) {
              e.target.value = sanitizedValue;
              console.log('🧹 ペーストされた値をサニタイズしました');
            }
          }, 0);
        });
      }
    });
  }

  // DOM要素の存在チェック（必須要素のみ）
  const requiredElements = ['photoInput', 'nameJa', 'nameEn', 'dobMonth', 'dobDay', 'cardCanvas', 'downloadBtn', 'twitterBtn', 'urlBtn', 'loadingOverlay'];
  for (const key of requiredElements) {
    if (!elements[key]) {
      console.error(`要素が見つかりません: ${key}`);
      return;
    }
  }

  // セキュリティ機能の初期化
  setupInputValidation();

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

  // 写真アップロードの処理（セキュリティ強化版）
  elements.photoInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // セキュリティ検証を最初に実行
      if (window.PrivacySecurity && !window.PrivacySecurity.validateFileUpload(file)) {
        throw new Error('このファイルは安全性の理由でアップロードできません。\nJPEG、PNG、GIF、WebP形式の画像ファイルのみアップロード可能です。');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('ファイルサイズは5MB以下にしてください。');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('画像ファイルを選択してください。');
      }

      // 画像内容の詳細検証
      if (window.PrivacySecurity) {
        const isValidImage = await window.PrivacySecurity.validateImageContent(file);
        if (!isValidImage) {
          throw new Error('このファイルは有効な画像ファイルではないか、セキュリティ上の問題があります。');
        }
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
      // 埋め込み環境ではCloudinary画像を新規タブ表示（iOS長押し保存対応）
      if (window.top !== window.self && window.__lastImageData && window.__lastImageData.public_id) {
        const og = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/` +
                   `f_auto,q_auto,w_1200,h_630,c_fill,fl_force_strip/` +
                   `${encodeURIComponent(window.__lastImageData.public_id)}.png`;
        window.open(og, '_blank', 'noopener');
        return;
      }
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
      showLoading('学生証をシェア用に準備中...');
      
      // 学生証画像をCloudinaryにアップロード
      const imageData = await uploadImageToCloudinary(
        elements.cardCanvas, 
        cloudinaryConfig.cloudName, 
        cloudinaryConfig.uploadPreset
      );
      
      // 学生情報を取得
      const nameJa = elements.nameJa.value.trim();
      const course = elements.department ? elements.department.value : '';
      const club = elements.department ? elements.department.value : '';
      
      // URLパラメータから診断結果情報を取得
      const params = new URLSearchParams(location.search);
      const department = params.get('department') || '';
      
      // 新しい共有方式：短いURL（/s/{slug}形式）
      let shareUrl;
      
      // ツイート文を作成（先に定義）
      const tweetText = nameJa ? 
        `${nameJa}の学生証が完成しました！🎓\n\n放課後クロニクル 診断ゲームで自分だけの学校生活を見つけよう✨\n\n#放課後クロニクル #学生証ジェネレーター` :
        `放課後クロニクル 学生証が完成しました！🎓\n\n診断ゲームで自分だけの学校生活を見つけよう✨\n\n#放課後クロニクル #学生証ジェネレーター`;
      
             if (window.buildShareUrl && imageData.public_id) {
         // 新しい共有方式
         shareUrl = window.buildShareUrl(imageData.public_id);
         
         // 画像データを保存（埋め込み時の保存対応用）
         window.__lastImageData = imageData;
         
         // 共有リンクを更新（X intent、URLコピー欄等）
         if (window.updateShareLinks) {
           window.updateShareLinks(imageData.public_id, tweetText);
         }
       } else {
        // フォールバック：従来方式（非推奨）
        // shareUrl = new URL('s.html', window.location.origin);
        // shareUrl.searchParams.set('i', imageData.secure_url || imageData);
        // if (nameJa) shareUrl.searchParams.set('n', nameJa);
        
        // 新しい短いURL方式を推奨
        console.warn('古い共有方式は非推奨です。新しい短いURL方式を使用してください。');
        shareUrl = '新しい短いURL方式が利用できません';
      }
      
      // ツイート文を作成（重複削除）
      // const tweetText = nameJa ? 
      //   `${nameJa}の学生証が完成しました！🎓\n\n放課後クロニクル 診断ゲームで自分だけの学校生活を見つけよう✨\n\n#放課後クロニクル #学生証ジェネレーター` :
      //   `放課後クロニクル 学生証が完成しました！🎓\n\n診断ゲームで自分だけの学校生活を見つけよう✨\n\n#放課後クロニクル #学生証ジェネレーター`;
      
      hideLoading();
      
             // Xアプリで開く（スマホの場合はアプリ起動、PCの場合はWeb intent）
       const webIntent = `https://x.com/intent/post?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl.toString())}`;
       openXAppOrIntent(webIntent);
      
      // 成功時のフィードバック（ポップアップなし）
      console.log('✅ X投稿処理が完了しました');
      
    } catch (error) {
      console.error('Twitterシェアエラー:', error);
      hideLoading();
      
      // Cloudinaryエラーの場合、自動的に画像をダウンロード
      if (error.message.includes('401') || error.message.includes('Cloudinary upload failed')) {
        console.log('画像アップロード失敗 - 自動ダウンロードを実行');
        try {
          const link = document.createElement('a');
          link.download = '学生証.png';
          link.href = elements.cardCanvas.toDataURL('image/png');
          link.click();
          console.log('✅ 画像が自動ダウンロードされました');
        } catch (downloadError) {
          console.error('ダウンロードエラー:', downloadError);
        }
      } else {
        console.error('画像アップロードエラー:', error.message);
      }
    }
  });



  // URLコピーボタン
  elements.urlBtn.addEventListener('click', async () => {
    if (!validateInputs(true)) {
      alert('氏名と生年月日を入力してください。');
      return;
    }
    
    try {
      showLoading('学生証をシェア用に準備中...');
      
      const imageData = await uploadImageToCloudinary(
        elements.cardCanvas, 
        cloudinaryConfig.cloudName, 
        cloudinaryConfig.uploadPreset
      );
      
      // 学生情報を取得（短縮URL対応）
      const nameJa = elements.nameJa.value.trim();
      
      // 新しい共有方式：短いURL（/s/{slug}形式）
      let shareUrl;
             if (window.buildShareUrl && imageData.public_id) {
         // 新しい共有方式
         shareUrl = window.buildShareUrl(imageData.public_id);
         
         // 画像データを保存（埋め込み時の保存対応用）
         window.__lastImageData = imageData;
         
         // 共有リンクを更新（X intent、URLコピー欄等）
         if (window.updateShareLinks) {
           window.updateShareLinks(imageData.public_id, '学生証を発行しました');
         }
       } else {
        // フォールバック：従来方式（非推奨）
        const studentInfo = { name: nameJa };
        shareUrl = generateShareUrl(imageData.secure_url || imageData, studentInfo);
      }
      const success = await copyUrlToClipboard(shareUrl);
      
      hideLoading();
      
      if (success) {
        console.log('✅ シェア用URLをクリップボードにコピーしました');
      } else {
        // フォールバック: コピー専用ページを新規タブで開く
        window.open(`/copy.html?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener');
        console.log('✅ コピー専用ページを開きました');
      }
    } catch (error) {
      console.error('URLコピーエラー:', error);
      hideLoading();
      
      // Cloudinaryエラーの場合、代替手段を提示
      if (error.message.includes('401') || error.message.includes('Cloudinary upload failed')) {
        const confirmDownload = confirm(
          '画像のアップロードに失敗しました。\n\n' +
          '代わりに画像をダウンロードしますか？\n' +
          'ダウンロードした画像を使ってSNSでシェアできます。'
        );
        
        if (confirmDownload) {
          // ローカル保存を実行
          try {
            const link = document.createElement('a');
            link.download = '放課後クロニクル_学生証.png';
            link.href = elements.cardCanvas.toDataURL('image/png');
            link.click();
            
            alert('📥 画像がダウンロードされました。\n\nSNSの投稿時に添付してください。');
          } catch (downloadError) {
            console.error('ダウンロードエラー:', downloadError);
            alert('ダウンロードにも失敗しました。しばらくしてからもう一度お試しください。');
          }
        }
      } else {
        alert('⚠️ 画像のアップロードに失敗しました。\n\nネット接続を確認してもう一度お試しください。');
      }
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
