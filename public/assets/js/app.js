// === Security constants ===
const ALLOWED_EXTS = ['png','jpg','jpeg','webp','heic'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getExt(name=''){ const m = name.toLowerCase().match(/\.([a-z0-9]+)$/); return m? m[1] : ''; }

// 署名検査（簡易マジックバイト）
async function sniffImageType(file){
  const buf = await file.slice(0, 12).arrayBuffer();
  const b = new Uint8Array(buf);
  const isPNG  = b[0]===0x89 && b[1]===0x50 && b[2]===0x4E && b[3]===0x47;
  const isJPG  = b[0]===0xFF && b[1]===0xD8 && b[2]===0xFF;
  const isWEBP = b[0]===0x52 && b[1]===0x49 && b[2]===0x46 && b[3]===0x46 && b[8]===0x57 && b[9]===0x45 && b[10]===0x42 && b[11]===0x50;
  const isHEIC = (b[4]===0x66 && b[5]===0x74 && b[6]===0x79 && b[7]===0x70); // ftyp (HEIC/HEIF系)
  if (isPNG)  return 'png';
  if (isJPG)  return (file.type.includes('heic')?'heic':'jpg'); // 拡張で最終判定
  if (isWEBP) return 'webp';
  if (isHEIC) return 'heic';
  return null;
}

// Cloudinary OGP URLを一元作成（v必須・セグメント毎エンコード）
function buildCldOgUrl({cloudName, public_id, version, eager_url=null}){
  if (eager_url) return eager_url; // 事前生成があれば最優先
  const pidSafe = String(public_id).split('/').map(encodeURIComponent).join('/');
  return `https://res.cloudinary.com/${cloudName}/image/upload/` +
         `f_auto,q_auto,w_1200,h_630,c_fill,g_auto,fl_force_strip/` +
         `v${version}/${pidSafe}.png`;
}

// window.open / 動的 <a> の noopener 徹底
function safeOpen(url, target='_blank'){
  const w = window.open('', target, 'noopener');
  if (w) w.opener = null, w.location.href = url;
}

// 手動コピーモーダル表示
function showManualCopyModal(text) {
  try {
    // シンプルなモーダルを作成
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,.85); 
      display: flex; align-items: center; justify-content: center; 
      z-index: 2147483647; flex-direction: column; padding: 2rem;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: white; padding: 2rem; border-radius: 16px; 
      max-width: 90vw; max-height: 80vh; overflow: auto;
    `;
    
    content.innerHTML = `
      <h3 style="margin: 0 0 1rem 0; color: #333;">URLをコピーしてください</h3>
      <textarea readonly style="width: 100%; height: 100px; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-family: monospace; resize: none;">${text}</textarea>
      <div style="margin-top: 1rem; text-align: center;">
        <button onclick="this.closest('.copy-modal').remove()" style="padding: 0.5rem 1rem; background: #B997D6; color: white; border: none; border-radius: 4px; cursor: pointer;">閉じる</button>
      </div>
    `;
    
    modal.className = 'copy-modal';
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // 背景クリックで閉じる
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    
  } catch (error) {
    console.error('Manual copy modal error:', error);
    // フォールバック：アラートで表示
    alert(`URLをコピーしてください：\n\n${text}`);
  }
}

// 保存用ライトボックス表示
function showSaveOverlay() {
  try {
    const canvas = document.getElementById('cardCanvas');
    if (!canvas) {
      console.error('Canvas not found');
      return;
    }
    
    const overlay = document.getElementById('saveOverlay');
    const preview = document.getElementById('savePreview');
    const closeBtn = document.getElementById('saveOverlayClose');
    
    if (!overlay || !preview || !closeBtn) {
      console.error('Save overlay elements not found');
      return;
    }
    
          // 画像をプレビューに設定（最優先はCloudinaryのOGP画像URL）
      if (window.__ogpImageUrl) {
        preview.src = window.__ogpImageUrl;
      } else {
        // 失敗時フォールバック
        preview.src = canvas.toDataURL('image/png');
      }
    
    // デバイス別の保存案内文言を設定
    const isPc = window.matchMedia('(pointer:fine)').matches && (navigator.maxTouchPoints || 0) === 0;
    const saveHint = overlay.querySelector('.save-hint');
    if (saveHint) {
      const pcHint = saveHint.querySelector('.pc-hint');
      const mobileHint = saveHint.querySelector('.mobile-hint');
      
      if (pcHint && mobileHint) {
        // 既存の構造を利用
        pcHint.style.display = isPc ? 'inline' : 'none';
        mobileHint.style.display = isPc ? 'none' : 'inline';
      } else {
        // フォールバック：従来の方式
        saveHint.textContent = isPc
          ? '下の「新しいタブで開く」→ 右クリックで保存'
          : '画像を長押しして保存してください';
      }
    }
    
    // 上位タブで開くボタン（埋め込みでも確実に開く）
    let openImageLink = overlay.querySelector('#openImageNewTab');
    if (!openImageLink) {
      openImageLink = document.createElement('button');
      openImageLink.id = 'openImageNewTab';
      openImageLink.textContent = isPc ? '新しいタブで開く（右クリックで保存）' : '新しいタブで開く';
      openImageLink.style.cssText = 'margin-top:8px;padding:8px 16px;background:#B997D6;color:#fff;border:none;border-radius:6px;font-size:14px;';
      openImageLink.addEventListener('click', () => {
        const url = window.__ogpImageUrl || preview.src;
        try { window.top.location.href = url; } catch (_) { location.href = url; }
      });
      if (saveHint && saveHint.parentNode) {
        saveHint.parentNode.insertBefore(openImageLink, saveHint.nextSibling);
      }
    }
    
    // ライトボックスを表示
    overlay.style.display = 'flex';
    
    // 閉じるボタンのイベント
    closeBtn.onclick = () => {
      overlay.style.display = 'none';
    };
    
    // 背景クリックでも閉じる
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
      }
    };
    
  } catch (error) {
    console.error('Save overlay error:', error);
    // フォールバック：通常のダウンロード
    try {
      downloadCanvasAsImage(document.getElementById('cardCanvas'), '学生証.png');
    } catch (fallbackError) {
      console.error('Fallback download error:', fallbackError);
    }
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

// Cloudinary設定（一元管理）
window.cloudinaryConfig = window.cloudinaryConfig || {
  cloudName: 'di5xqlddy',
  uploadPreset: 'student_card_AS_chronicle'
};
const cloudinaryConfig = window.cloudinaryConfig;

// 設定の検証
if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
  console.error('❌ Cloudinary設定が不完全です。cloudNameとuploadPresetを確認してください。');
}

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
          // public_id、secure_url、version、eager_urlを含む
          resolve({
            public_id: data.public_id,
            secure_url: data.secure_url,
            version: data.version,
            eager_url: (data.eager && data.eager[0] && data.eager[0].secure_url) || null
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

async function downloadCanvasAsImage(canvas, filename = '学生証.png') {
  const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
  const embedded = (window.top !== window.self);
  const blob = await new Promise(res => canvas.toBlob(res, 'image/png', 0.95));
  if (!blob) { alert('画像の生成に失敗しました'); return false; }

  // ① スマホ優先：ファイル添付の Web Share (iOS/Android)
  if ('canShare' in navigator && 'share' in navigator) {
    try {
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: '学生証', text: '' });
        return true; // 新規タブを開かず保存/共有できる
      }
    } catch(_) { /* 下へフォールバック */ }
  }

  // ② PC(Chromium)：OSの保存ダイアログ
  if (!isIOS && !embedded && 'showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'PNG Image', accept: { 'image/png': ['.png'] } }]
      });
      const stream = await handle.createWritable();
      await stream.write(blob);
      await stream.close();
      return true;
    } catch(_) { /* キャンセル等 → 次へ */ }
  }

  // 3) ライトボックス（同一タブ・新規タブ禁止。iOS/埋め込みで長押し保存できる）
  const url = URL.createObjectURL(blob);
  const ov = document.getElementById('saveOverlay');
  const img = document.getElementById('savePreview');
  const closeBtn = document.getElementById('saveOverlayClose');
  if (ov && img && closeBtn) {
    img.src = url;
    ov.style.display = 'flex';
    const cleaner = () => { URL.revokeObjectURL(url); img.src = ''; ov.style.display = 'none'; };
    const closeOnce = () => { cleaner(); closeBtn.removeEventListener('click', closeOnce); ov.removeEventListener('click', bgCloseOnce); };
    const bgCloseOnce = (e) => { if (e.target === ov) closeOnce(); };
    closeBtn.addEventListener('click', closeOnce, { once: true });
    ov.addEventListener('click', bgCloseOnce, { once: true });
    return true;
  }

  // 4) 最後の最後：アンカー download（デスクトップ向け）
  const fallbackUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = fallbackUrl; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(fallbackUrl), 1500);
  return true;
}



// X共有機能（白画面回避対応）
function openXAppOrIntent(webIntent) {
  const isEmbedded = (window.top !== window.self);
  if (isEmbedded) { window.open(webIntent, '_blank', 'noopener'); return; }
  const ua = navigator.userAgent;
  const isiOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const msg = new URL(webIntent).searchParams.get('text') || '';
  let tried = false;
  const fallback = () => { if (!tried) { tried = true; window.open(webIntent, '_blank', 'noopener'); } };
  // 失敗検知：アプリへ切り替わると visibilitychange が走る
  const onHide = () => { tried = true; document.removeEventListener('visibilitychange', onHide); };
  document.addEventListener('visibilitychange', onHide);
  try {
    if (isiOS) {
      location.href = `x://post?message=${encodeURIComponent(msg)}`;       // iOS17以降
      setTimeout(() => { if (!tried) location.href = `twitter://post?message=${encodeURIComponent(msg)}`; }, 200);
      setTimeout(fallback, 900);
    } else if (isAndroid) {
      // Androidは intent:// が強い
      location.href = `intent://post?message=${encodeURIComponent(msg)}#Intent;package=com.twitter.android;scheme=twitter;end`;
      setTimeout(() => { if (!tried) location.href = `twitter://post?message=${encodeURIComponent(msg)}`; }, 180);
      setTimeout(fallback, 900);
    } else {
      fallback(); // デスクトップ等はWeb Intentへ
    }
  } catch(_) { fallback(); }
}

// コピー処理を一元化
async function copyTextReliable(text) {
  // 1) Clipboard API（ユーザー操作中なら多くの環境でOK）
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {/* 次へ */}

  // 2) contentEditable + execCommand（iOS/埋め込みに強い「同期」コピー）
  try {
    const div = document.createElement('div');
    div.contentEditable = 'true';
    div.style.position = 'fixed';
    div.style.opacity = '0';
    div.textContent = text;
    document.body.appendChild(div);
    const range = document.createRange();
    range.selectNodeContents(div);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    const ok = document.execCommand('copy');
    sel.removeAllRanges();
    document.body.removeChild(div);
    if (ok) return true;
  } catch (_) {/* 次へ */}

  // 3) 共有シート（ここにも「コピー」がある）
  if (navigator.share) {
    try { await navigator.share({ text }); return true; } catch (_) {/* 次へ */}
  }

  // 4) 最終手段：モーダルでURLを表示して手動コピー（遷移しない）
  showManualCopyModal(text);
  return false;
}

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
  const requiredElements = ['photoInput', 'nameJa', 'nameEn', 'dobMonth', 'dobDay', 'cardCanvas', 'downloadBtn', 'twitterBtn', 'urlBtn'];
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
    if (!elements.loadingOverlay) return;
    const p = elements.loadingOverlay.querySelector('p');
    if (p) p.textContent = message;
    elements.loadingOverlay.classList.add('active');
  }

  function hideLoading() {
    if (!elements.loadingOverlay) return;
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

      // ファイル選択時のクライアント検証
      async function validateSelectedFile(file){
        if (!file){ alert('ファイルが選択されていません'); return false; }
        const ext = getExt(file.name);
        if (!ALLOWED_EXTS.includes(ext)) { alert('対応拡張子: ' + ALLOWED_EXTS.join(', ')); return false; }
        if (file.size > MAX_FILE_SIZE){ alert('10MB以内の画像をご利用ください'); return false; }
        const sig = await sniffImageType(file);
        if (!sig || !ALLOWED_EXTS.includes(sig)){ alert('画像ファイルではありません'); return false; }
        // MIMEヒントの改ざん対策：拡張子とシグネチャが極端に乖離なら拒否
        if (ext==='png' && sig!=='png')  { alert('PNG形式の画像を選択してください'); return false; }
        if ((ext==='jpg'||ext==='jpeg') && sig!=='jpg') { alert('JPEG形式の画像を選択してください'); return false; }
        return true;
      }

      if (!(await validateSelectedFile(file))) { 
        elements.photoInput.value = ''; 
        return; 
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
    // 「部」は画像側にあるため表示文字列からは除去、未指定は「帰宅」
    clubLabel = (clubLabel || '').replace(/部$/,'');
    if (!clubLabel || clubLabel === 'なし') clubLabel = '帰宅';

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
        let displayClubName;
        if (clubLabel === '帰宅') {
          displayClubName = 'ー'; // 帰宅部の場合は横棒を表示
        } else {
          displayClubName = clubLabel.replace(/部$/, '');
        }
        ctx.fillText(displayClubName, clubX, clubY);
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
  elements.downloadBtn.addEventListener('click', async () => {
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
      
      hideLoading();
      
      if (imageData.public_id) {
        // 新しい共有方式：画像URL/バージョン付きJSONスラッグ
        const { public_id, version, eager } = imageData;
        const eagerUrl = eager && eager[0] && eager[0].secure_url;
        const shareUrl = window.buildShareUrlWithImage(public_id, version, eagerUrl);
        
        // 画像データを保存（埋め込み時の保存対応用）
        window.__lastImageData = imageData;
        
        // OGP画像URLを保持してオーバーレイで案内（自動ポップアップ禁止）
        const ogpImageUrl = eagerUrl || `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/f_auto,q_auto,w_1200,h_630,c_pad,b_white,fl_force_strip/v${version}/${encodeURIComponent(public_id)}.png`;
        window.__ogpImageUrl = ogpImageUrl;
        
        // 共有リンクを更新
        if (window.updateShareLinksWithImage) {
          window.updateShareLinksWithImage(imageData, '学生証が完成しました！');
        }
        
        // 保存オーバーレイを表示
        showSaveOverlay();
      } else {
        throw new Error('画像のアップロードに失敗しました');
      }
    } catch (error) {
      console.error('ダウンロードエラー:', error);
      hideLoading();
      // エラー時はライトボックス表示でフォールバック
      try {
        showSaveOverlay();
      } catch (fallbackError) {
        console.error('フォールバックエラー:', fallbackError);
        alert('画像の保存に失敗しました。もう一度お試しください。');
      }
    }
  });

  // Twitterシェアボタン
  elements.twitterBtn.addEventListener('click', async () => {
    if (!validateInputs(true)) {
      alert('氏名と生年月日を入力してください。');
      return;
    }
    
          // すでに共有URLがあるなら、再アップロードせずそのまま開く
      if (window.__shareUrl) {
        const baseTweetText = 'あなたの学校生活を診断して学生証を作ろう！\n\n#放課後クロニクル #学生証ジェネレーター';
        const intent = `https://x.com/intent/post?text=${encodeURIComponent(`${window.__shareUrl}\n\n${baseTweetText}`)}`;
        // 常に新しいタブで開く（埋め込みでも安全）
        try { window.top.open(intent, '_blank', 'noopener'); } catch (_) { window.open(intent, '_blank', 'noopener'); }
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
      const course = (document.getElementById('course')?.value || '').trim();
      const club = (document.getElementById('club')?.value || '').trim();
      
      // URLパラメータから診断結果情報を取得
      const params = new URLSearchParams(location.search);
      const department = params.get('department') || '';
      
      // 新しい共有方式：短いURL（/s/{slug}形式）
      let shareUrl;
      
      // ツイート文を作成（共有URLを先頭に配置）
      const baseTweetText = nameJa ? 
        `${nameJa}の学生証が完成しました！🎓\n\nあなたの学校生活を診断して学生証を作ろう！\n\n#放課後クロニクル #学生証ジェネレーター` :
        `放課後クロニクル 学生証が完成しました！🎓\n\nあなたの学校生活を診断して学生証を作ろう！\n\n#放課後クロニクル #学生証ジェネレーター`;
      
      if (window.buildShareUrlWithImage && imageData.public_id) {
        // 新しい共有方式：画像URL/バージョン付きJSONスラッグ
        const { public_id, version, eager } = imageData;
        const eagerUrl = eager && eager[0] && eager[0].secure_url;
        shareUrl = window.buildShareUrlWithImage(public_id, version, eagerUrl);
        
        // 画像データを保存（埋め込み時の保存対応用）
        window.__lastImageData = imageData;
        
        // 共有リンクを更新（buildShareUrlWithImageが利用可能な場合のみ）
        if (window.updateShareLinksWithImage) {
          window.updateShareLinksWithImage(imageData, baseTweetText);
        }
      } else if (window.buildShareUrl && imageData.public_id) {
        // フォールバック：短縮版
        shareUrl = window.buildShareUrl(imageData.public_id);
        
        // 画像データを保存（埋め込み時の保存対応用）
        window.__lastImageData = imageData;
        
        // 共有リンクを更新
        if (window.updateShareLinksWithImage) {
          window.updateShareLinksWithImage(imageData, baseTweetText);
        }
      } else {
        // フォールバック：従来方式（非推奨）
        console.warn('古い共有方式は非推奨です。新しい短いURL方式を使用してください。');
        shareUrl = '新しい短いURL方式が利用できません';
      }
      
      hideLoading();
      
      // Web IntentでX投稿を開く（URL先頭でカード確実化）
      const tweet = `${shareUrl}\n\n${baseTweetText}`;
      const webIntent = `https://x.com/intent/post?text=${encodeURIComponent(tweet)}`;
      // 常に新しいタブで開く（埋め込みでも安全）
      try { window.top.open(webIntent, '_blank', 'noopener'); } catch (_) { window.open(webIntent, '_blank', 'noopener'); }
      
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
    
    // すでに共有URLがあるなら、再アップロードせずそのままコピー
    if (window.__shareUrl) {
      const success = await copyTextReliable(window.__shareUrl);
      if (success) {
        alert('共有URLをコピーしました！');
      }
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
      
      if (window.buildShareUrlWithImage && imageData.public_id) {
        // 新しい共有方式：画像URL/バージョン付きJSONスラッグ
        const { public_id, version, eager } = imageData;
        const eagerUrl = eager && eager[0] && eager[0].secure_url;
        shareUrl = window.buildShareUrlWithImage(public_id, version, eagerUrl);
        
        // 画像データを保存（埋め込み時の保存対応用）
        window.__lastImageData = imageData;
        
        // 共有リンクを更新（buildShareUrlWithImageが利用可能な場合のみ）
        if (window.updateShareLinksWithImage) {
          window.updateShareLinksWithImage(imageData, '学生証を発行しました');
        }
      } else if (window.buildShareUrl && imageData.public_id) {
        // フォールバック：短縮版
        shareUrl = window.buildShareUrl(imageData.public_id);
        
        // 画像データを保存（埋め込み時の保存対応用）
        window.__lastImageData = imageData;
        
        // 共有リンクを更新
        if (window.updateShareLinksWithImage) {
          window.updateShareLinksWithImage(imageData, '学生証を発行しました');
        }
      } else {
        // フォールバック：従来方式（非推奨）
        console.warn('古い共有方式は非推奨です。新しい短いURL方式を使用してください。');
        shareUrl = '新しい短いURL方式が利用できません';
      }
             // 共有URLを文字列化
       const urlToCopy = shareUrl.toString();

       // まずは堅牢コピー（iframeでも成功率高）
       const ok = await copyTextReliable(urlToCopy);  // ← 既存関数を活用
       hideLoading();

       if (ok) {
         console.log('✅ シェア用URLをクリップボードにコピーしました');
       } else {
         // 最終手段：モーダルでURLを表示（遷移しない）
         showManualCopyModal(urlToCopy);
         console.log('✅ コピーできない環境のため、モーダルでURLを表示しました');
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
