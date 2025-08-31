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

// 自ドメインのOGPプロキシURLを一元作成（安定性重視）
function buildCldOgUrl({cloudName, public_id, version, eager_url=null}){
  // 自ドメインのOGPプロキシを最優先（Botが確実にアクセス可能）
  const pidSafe = String(public_id).split('/').map(encodeURIComponent).join('/');
  return `${window.location.origin}/ogp/v/${version}/${pidSafe}.jpg`;
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // スマホサイズでの表示を改善
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const textareaHeight = isMobile ? '120px' : '100px';
    
    content.innerHTML = `
      <h3 style="margin: 0 0 1rem 0; color: #333; font-size: ${isMobile ? '1.2rem' : '1.1rem'};">URLをコピーしてください</h3>
      <textarea readonly style="width: 100%; height: ${textareaHeight}; padding: 0.8rem; border: 2px solid #B997D6; border-radius: 8px; font-family: monospace; font-size: ${isMobile ? '0.9rem' : '0.8rem'}; resize: none; background: #f8f6f0;">${text}</textarea>
      <div style="margin-top: 1.5rem; text-align: center; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <button id="copyBtn" style="padding: 0.8rem 1.5rem; background: #B997D6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: ${isMobile ? '1rem' : '0.9rem'}; font-weight: 600;">コピー</button>
        <button id="closeBtn" style="padding: 0.8rem 1.5rem; background: #a8a8a8; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: ${isMobile ? '1rem' : '0.9rem'};">閉じる</button>
      </div>
      <div style="margin-top: 1rem; text-align: center; font-size: 0.8rem; color: #666;">
        <p style="margin: 0.5rem 0;">📱 スマホの場合：テキストを長押しして「コピー」を選択</p>
        <p style="margin: 0.5rem 0;">💻 PCの場合：テキストを選択してCtrl+C</p>
      </div>
    `;
    
    modal.className = 'copy-modal';
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // コピーボタンの機能
    const copyBtn = content.querySelector('#copyBtn');
    if (copyBtn) {
      copyBtn.onclick = async () => {
        try {
          const success = await copyTextReliable(text);
          if (success) {
            copyBtn.textContent = '✅ コピー完了！';
            copyBtn.style.background = '#4CAF50';
            setTimeout(() => {
              copyBtn.textContent = 'コピー';
              copyBtn.style.background = '#B997D6';
            }, 2000);
          } else {
            copyBtn.textContent = '❌ コピー失敗';
            copyBtn.style.background = '#f44336';
            setTimeout(() => {
              copyBtn.textContent = 'コピー';
              copyBtn.style.background = '#B997D6';
            }, 2000);
          }
        } catch (error) {
          console.error('コピー処理エラー:', error);
        }
      };
    }
    
    // 閉じるボタンの機能
    const closeBtn = content.querySelector('#closeBtn');
    if (closeBtn) {
      closeBtn.onclick = () => modal.remove();
    }
    
    // 背景クリックで閉じる
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    
    // テキストエリアを自動選択（コピーしやすくする）
    const textarea = content.querySelector('textarea');
    if (textarea) {
      setTimeout(() => {
        textarea.focus();
        textarea.select();
      }, 100);
    }
    
  } catch (error) {
    console.error('Manual copy modal error:', error);
    // フォールバック：アラートで表示
    alert(`URLをコピーしてください：\n\n${text}`);
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

// ==== Cloudinary constants ====
const CLOUD_NAME = 'di5xqlddy';
const CDN_BASE   = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;
const FOLDER     = 'as_chronicle/student_card';  // public_id の先頭
const T_OGP      = 't_ogp_card';                 // 1200x628 pad
const T_FULL     = 't_full_card';                // 比率維持の保存/プレビュー用

// 自前ドメイン固定（埋め込み時のMIMEエラー対策）
const ORIGIN = (window.APP_ORIGIN) || 'https://student-id-generator.pages.dev';

// URLビルダー関数
const ogpUrl  = (id, ext='jpg') => `${CDN_BASE}/${T_OGP}/${FOLDER}/${id}.${ext}`;
const fullUrl = (id, ext='png') => `${CDN_BASE}/${T_FULL}/${FOLDER}/${id}.${ext}`;
// 必要ならグローバルでも使えるように
window.ogpUrl = ogpUrl;
window.fullUrl = fullUrl;

// Cloudinary設定（一元管理）
window.cloudinaryConfig = window.cloudinaryConfig || {
  cloudName: CLOUD_NAME,
  uploadPreset: 'student_card_AS_chronicle'
};
const cloudinaryConfig = window.cloudinaryConfig;

// 古いshareToX関数は削除済み（新しいshareStudentId関数に統合）

// ===== Share helpers =====
function b64UrlFromUtf8(jsonStr) {
  const bin = Array.from(new TextEncoder().encode(jsonStr), b => String.fromCharCode(b)).join('');
  return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function buildShareUrlWithImage({ public_id, version, eager_url }) {
  const payload = { p: public_id, v: version, i: eager_url || '' };
  const slug = b64UrlFromUtf8(JSON.stringify(payload));
  // 公開ドメイン固定で共有URLを生成（埋め込み対策）
  const SHARE_ORIGIN = 'https://student-id-generator.pages.dev';
  return `${SHARE_ORIGIN}/s/${slug}`;
}

// 共有URLの作り方を一本化
// 生成時に id を決定（例：kjvfdcgtliwx8kphlua5）
// SNSプレビューは ogpUrl(id) が参照されるよう、共有ページURLに id を含める
// 画面表示は fullUrl(id) を使用
function buildSimpleShareUrl(id) {
  return new URL(`/s/${id}`, location.origin).toString();
}

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
  const dataUrl = canvas.toDataURL('image/png');
  // 直前生成フラグ：戻ってもガードに弾かれない
  sessionStorage.setItem('as_chronicle_last_result', '1');
  try {
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isiOS) {
      // iOS は download 無視 → 新規タブで開いて長押し保存
      window.open(dataUrl, '_blank', 'noopener');
    } else {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = '放課後クロニクル_学生証.png';
      a.click();
    }
  } catch (e) {
    console.error('download failed', e);
  }
}

// t_full_card を使用した保存処理
async function downloadCard(id, filename = 'student-card.png') {
  const url = fullUrl(id, 'png'); // 全表示のPNG
  try {
    const blob = await fetch(url, { cache: 'reload' }).then(r => r.blob());
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  } catch(e) {
    // iOS Safari などダウンロード制限時のフォールバック
    window.open(url, '_blank', 'noopener');
  }
}



// 新しいタブ/外部アプリで開く関数（現在のタブを保持）
function openInNewTab(url) {
  const root = (window.top && window.top !== window) ? window.top : window;
  const a = root.document.createElement('a');
  a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
  root.document.body.appendChild(a); a.click(); a.remove();
}

// Xへ投稿（スマホはアプリ起動、PCはWebで新規タブ）
function shareOnX({text, url}) {
  const ua = navigator.userAgent || '';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);

  const webIntent = `https://twitter.com/intent/tweet?${new URLSearchParams({text, url})}`;

  if (isMobile) {
    // まずアプリを試す → 失敗したらWebへ
    const appUrl = `twitter://post?message=${encodeURIComponent(`${text} ${url}`)}`;
    const fallback = setTimeout(() => window.open(webIntent, '_blank', 'noopener'), 1200);
    window.location.href = appUrl;
    return;
  }
  window.open(webIntent, '_blank', 'noopener'); // PCは新規タブ
}

// deep link（twitter://）や location.href は使わない。常に新規タブ or ネイティブ共有。
// シェアテキストの定型化（改行を含む）
function buildPostText() {
  return [
    'ようこそ、夢見が丘女子高等学校へ！',
    '',
    '▼自分だけの学生証を作ろう！',
    '（https://lime016395.studio.site/student-id）',
    '（画像）', // 共有シートでは画像ファイル自体を添付する想定
    '',
    '#放課後クロニクル #学生証メーカー'
  ].join('\n');
}

// 投稿文の例（要件に合わせて差し替え）
const tweetText = [
  'ようこそ、夢見が丘女子高等学校へ！',
  '　忘れられない放課後を、あなたに。',
  '✎︎＿＿＿＿＿＿＿＿＿＿＿＿＿＿',
  '',
  '▼ #放課後クロニクル のHPで自分だけの学生証を作ろう！'
].join('\n');

// iOS判定と二重実行ガード
const isIOS = /iP(hone|od|ad)/.test(navigator.userAgent);
let sharingNow = false;

// 画像DL→File化
async function fetchAsFile(url, filename = "student_card.jpg") {
  const res = await fetch(url, { cache: "no-store" });
  const blob = await res.blob();
  const type = blob.type || "image/jpeg";
  return new File([blob], filename, { type });
}

// 先読みして File を保持（クリック直下でfetchさせない）
async function prefetchOgpFile(url){
  const res = await fetch(url, { cache: 'no-store' });
  const blob = await res.blob();
  window.__ogpFile = new File([blob], 'student_card.jpg', { type: blob.type || 'image/jpeg' });
}

// OGP共有用URL作成関数
function buildOgpShareUrl(publicId) {
  return `https://student-id-generator.pages.dev/ogp/v/${Date.now()}/as_chronicle/student_card/${publicId}.jpg`;
}

// Cloudinary OGP画像URL作成関数
function cloudinaryOgpImage(publicId) {
  const CLOUD_NAME = 'di5xqlddy';
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/t_ogp_card/as_chronicle/student_card/${publicId}.jpg`;
}

// 画像 + URL を"確実に"シェアする統合関数（現在のタブを保持）
async function shareStudentId(finalImageUrl, shareUrl, baseText='') {
  const text = `${baseText ? baseText + '\n' : ''}${shareUrl}`;

  // A) 画像付き Share Sheet（最優先：Xアプリを直接選べる）
  try {
    if (finalImageUrl && navigator.share && navigator.canShare) {
      const res = await fetch(finalImageUrl, { mode: 'cors', cache: 'no-store' });
      const blob = await res.blob();
      const file = new File([blob], 'student-id.jpg', { type: 'image/jpeg' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text });
        return;
      }
    }
  } catch (_) { /* 次へ */ }

  // B) 画像なし Share Sheet（URLだけでもアプリ選択可）
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return;
    }
  } catch (_) { /* 次へ */ }

  // C) 最後のフォールバック：Web Intent（必ず新規タブ、元ページは残す）
  const webIntent = `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
  openInNewTab(webIntent);
}

// 状態保持機能
function saveResult(data) { 
  sessionStorage.setItem('studentId.lastResult', JSON.stringify(data)); 
}

function loadResult() {
  try { 
    return JSON.parse(sessionStorage.getItem('studentId.lastResult') || 'null'); 
  } catch { 
    return null; 
  }
}

// ★ iOSは"アプリのみ"モード：ネイティブ共有に成功/キャンセルしたら何もしない
async function shareToXAppFirstOnly(imageUrl, text) {
  if (sharingNow) return;
  sharingNow = true;
  try {
    if (isIOS && navigator.share) {
      // 画像ファイル同梱できるなら付ける
      if (navigator.canShare && navigator.canShare({ files: [new File([""], "a.jpg", { type: "image/jpeg" })] })) {
        const file = await fetchAsFile(imageUrl, "student_card.jpg");
        try {
          await navigator.share({ text, files: [file] });
        } catch (err) {
          // ユーザーがキャンセルしても"何もしない"＝ブラウザは開かない
        }
        return; // ← iOSはここで必ず終了（Intent等は一切呼ばない）
      } else {
        try {
          await navigator.share({ text }); // 画像不可端末
        } catch (_) {}
        return; // ← ここでも終了
      }
    }

    // ---- iOS以外：通常フォールバック（必要なら保持）
    const intent = "https://x.com/intent/post?text=" + encodeURIComponent(text);
    window.open(intent, "_blank", "noopener,noreferrer");
  } finally {
    // 少し待ってから解除（ダブルタップ対策）
    setTimeout(() => (sharingNow = false), 800);
  }
}

// グローバル関数として公開
window.shareStudentId = shareStudentId;
window.saveResult = saveResult;
window.loadResult = loadResult;
window.shareToXAppFirstOnly = shareToXAppFirstOnly;

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
  
  // 入力初期化（個別フィールドのクリア）
  const inputFields = ['nameJa', 'nameEn', 'dobMonth', 'dobDay'];
  inputFields.forEach(id => {
    const field = document.getElementById(id);
    if (field) field.value = '';
  });

  // 旧データの掃除（あれば）
  ['student_form','student_profile','last_result','profileCache'].forEach(k => {
    try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch(e){}
  });
});

// 履歴戻り(bfcache)でも常に初期化
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    // 個別フィールドのクリア
    const inputFields = ['nameJa', 'nameEn', 'dobMonth', 'dobDay'];
    inputFields.forEach(id => {
      const field = document.getElementById(id);
      if (field) field.value = '';
    });
  }
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
  
  // デバッグ情報
  console.log('DOM要素の取得状況:', {
    photoInput: !!elements.photoInput,
    nameJa: !!elements.nameJa,
    nameEn: !!elements.nameEn,
    dobMonth: !!elements.dobMonth,
    dobDay: !!elements.dobDay,
    cardCanvas: !!elements.cardCanvas,
    downloadBtn: !!elements.downloadBtn,
    twitterBtn: !!elements.twitterBtn,
    urlBtn: !!elements.urlBtn,
    loadingOverlay: !!elements.loadingOverlay
  });

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

  // Canvas コンテキストの取得（要素の存在確認付き）
  let ctx = null;
  if (elements.cardCanvas) {
    ctx = elements.cardCanvas.getContext('2d');
    console.log('Canvas 2Dコンテキストを取得しました:', ctx);
  } else {
    console.error('cardCanvas要素が見つかりません');
    return; // 早期リターン
  }

  // 画像オブジェクトの初期化（ローカル環境対応）
  const templateImage = new Image();
  let uploadedPhoto = null;
  
  // ローカル環境ではcrossOriginを設定せずに読み込み
  function loadTemplateImage() {
    templateImage.src = ORIGIN + '/assets/img/student_template.png';
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
    console.error('テンプレート画像の読み込みに失敗しました:', templateImage.src);
    // 失敗時も絶対URLでリトライ（保険）
    templateImage.src = ORIGIN + '/assets/img/student_template.png';
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
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    if (templateImage.complete && templateImage.naturalWidth > 0) {
      ctx.drawImage(templateImage, 0, 0, CARD_WIDTH, CARD_HEIGHT);
    }
  }

  // 写真アップロードの処理（セキュリティ強化版）
  elements.photoInput.addEventListener('change', async (e) => {
    await handlePhotoSelected(e);
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
        // 直前生成フラグ（戻ってもガードに弾かれない）
        sessionStorage.setItem('as_chronicle_last_result', '1');

        // 共有 URL を /s/{slug} に統一
        try {
          const shareUrl = buildShareUrlWithImage({
            public_id: imageData.public_id || imageData.publicId,
            version: imageData.version,
            eager_url: (imageData.eager && imageData.eager[0] && imageData.eager[0].secure_url) || imageData.eager_url || imageData.secure_url
          });
          // 画面の共有ボタン等を書き換える（既存の関数があればそれを利用）
          const els = document.querySelectorAll('[data-share-url]');
          els.forEach(el => el.setAttribute('href', shareUrl));
        } catch(e) {
          console.warn('Share URL build failed', e);
        }
        
        // 画像データを保存（埋め込み時の保存対応用）
        window.__lastImageData = imageData;
        
        // 共有用のアップロード結果を保存
        window.__lastUploadResult = {
          public_id: imageData.public_id,
          folder: imageData.public_id.split('/').slice(0, -1).join('/'), // as_chronicle/student_card
          version: imageData.version,
          ...imageData
        };
        
        // 共有URL（OGP付きHTML）
        const pidEnc = imageData.public_id.split('/').map(encodeURIComponent).join('/');
        window.__shareUrl = buildOgpShareUrl(imageData.public_id);
        
        // カード画像（1200x628 パディング済み）
        window.__ogpImageUrl = cloudinaryOgpImage(imageData.public_id);
        
        // 共有ボタンがすぐ使えるよう、画像ファイルを先読みして保持（iOSのshare成功率Up）
        prefetchOgpFile(window.__ogpImageUrl).catch(()=>{});
        
        // 状態を保存（戻っても診断結果が剥がれない）
        if (window.saveResult) {
          const formData = {
            nameJa: elements.nameJa?.value || '',
            nameEn: elements.nameEn?.value || '',
            dobMonth: elements.dobMonth?.value || '',
            dobDay: elements.dobDay?.value || ''
          };
          
          // Cloudinaryのどの形で返ってきても拾えるように統一
          const eagerUrl = 
            imageData.eager?.[0]?.secure_url ||
            imageData.eager_url ||
            imageData.secure_url ||
            null;
          
          window.saveResult({
            public_id,
            version,
            eager_url: eagerUrl,
            imageData,
            formData,
            timestamp: Date.now()
          });
        }
        
        // 画像 URL をそのまま新しいタブで開く（PC=右クリック保存 / スマホ=共有/保存）
        // 同じ /ogp の画像URLを使用（t_ogp_card の named transformation 適用）
        const downloadImageUrl = window.__ogpImageUrl || imageData.secure_url;
        if (downloadImageUrl) {
          window.open(downloadImageUrl, '_blank', 'noopener');
        }
        
        // プレビュー画像を表示（t_full_card で全表示）
        const previewImg = document.getElementById('cardPreview');
        if (previewImg && imageData.public_id) {
          const fullImageUrl = fullUrl(imageData.public_id, 'png');
          previewImg.src = fullImageUrl;
          previewImg.style.display = 'block';
          // Canvasは非表示
          const canvas = document.getElementById('cardCanvas');
          if (canvas) canvas.style.display = 'none';
        }
        
        // 共有リンクを更新
        if (window.updateShareLinksWithImage) {
          window.updateShareLinksWithImage(imageData, '学生証が完成しました！');
        }
      } else {
        throw new Error('画像のアップロードに失敗しました');
      }
    } catch (error) {
      console.error('ダウンロードエラー:', error);
      hideLoading();
      // エラー時はアラートのみ表示
      alert('画像の保存に失敗しました。もう一度お試しください。');
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
        // URLパラメータから学科/部活を取得（部活は"部"を付ける）
        const p = new URLSearchParams(location.search);
        const courseParam = p.get('course') || '普通科';
        const rawClubParam = p.get('club') || '帰宅';
        const clubParam = /部$/.test(rawClubParam) ? rawClubParam : `${rawClubParam}部`;

        const tweet = [
          `${window.__shareUrl}`,
          '',
          '🏫夢見が丘女子高等学校 入学診断',
          `【${courseParam}】の【${clubParam}】になりました！`,
          '診断の最後には、自分だけの学生証ももらえます🎓📸',
          '',
          '君も放課後クロニクルの世界へ――',
          '',
          '#放課後クロニクル #学生証メーカー'
        ].join('\n');

        // 1) まず OS の共有シート（Web Share API）を試す
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile && navigator.share) {
          try {
            await navigator.share({ text: tweet });   // URLは本文先頭に含める運用なので text のみでOK
            return;
          } catch (e) {
            // ユーザーキャンセルや未許可はフォールバック
          }
        }

        // 2) フォールバック: Web Intent（新しいタブで安定）
        shareToX();
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
      
      // ツイート文を作成（指定のテンプレート使用）
      const baseTweetText = nameJa ? 
        `${nameJa}の学生証が完成しました！🎓\n\nあなたの学校生活を診断して学生証を作ろう！\n\n#放課後クロニクル #学生証ジェネレーター` :
        `放課後クロニクル 学生証が完成しました！🎓\n\nあなたの学校生活を診断して学生証を作ろう！\n\n#放課後クロニクル #学生証ジェネレーター`;
      
      if (window.buildShareUrlWithImage && imageData.public_id) {
        // 新しい共有方式：画像URL/バージョン付きJSONスラッグ
        const { public_id, version } = imageData;
        shareUrl = window.buildShareUrlWithImage({
          public_id,
          version
        });
        
        // 画像データを保存（埋め込み時の保存対応用）
        window.__lastImageData = imageData;
        
        // 状態を保存（戻っても診断結果が剥がれない）
        if (window.saveResult) {
          const formData = {
            nameJa: elements.nameJa?.value || '',
            nameEn: elements.nameEn?.value || '',
            dobMonth: elements.dobMonth?.value || '',
            dobDay: elements.dobDay?.value || ''
          };
          
          // Cloudinaryのどの形で返ってきても拾えるように統一
          const eagerUrl = 
            imageData.eager?.[0]?.secure_url ||
            imageData.eager_url ||
            imageData.secure_url ||
            null;
          
          window.saveResult({
            public_id,
            version,
            eager_url: eagerUrl,
            imageData,
            formData,
            timestamp: Date.now()
          });
        }
        
        // プレビュー画像を表示（t_full_card で全表示）
        const previewImg = document.getElementById('cardPreview');
        if (previewImg && imageData.public_id) {
          const fullImageUrl = fullUrl(imageData.public_id, 'png');
          previewImg.src = fullImageUrl;
          previewImg.style.display = 'block';
          // Canvasは非表示
          const canvas = document.getElementById('cardCanvas');
          if (canvas) canvas.style.display = 'none';
        }
        
        // 共有リンクを更新（buildShareUrlWithImageが利用可能な場合のみ）
        if (window.updateShareLinksWithImage) {
          window.updateShareLinksWithImage(imageData, baseTweetText);
        }
      } else {
        // buildShareUrlWithImageが利用できない場合はエラー
        console.error('共有URL生成に必要な関数が利用できません');
        shareUrl = '共有URLの生成に失敗しました';
      }
      
      hideLoading();
      
      // 新しい共有方式：画像付きシェア（最優先）
      if (window.__ogpImageUrl && shareUrl) {
        const text = buildPostText();
        await shareToXAppFirstOnly(window.__ogpImageUrl, text);
        return;
      }

      // フォールバック：従来のテキストシェア
      // URLパラメータから学科/部活を取得（部活は"部"を付ける）
      const searchParams = new URLSearchParams(location.search);
      const courseName = searchParams.get('course') || '普通科';
      const rawClubName = searchParams.get('club') || '帰宅';
      const clubName = /部$/.test(rawClubName) ? rawClubName : `${rawClubName}部`;

      const tweet = [
        `${shareUrl}`,
        '',
        '🏫夢見が丘女子高等学校 入学診断',
        `【${courseName}】の【${clubName}】になりました！`,
        '診断の最後には、自分だけの学生証ももらえます🎓📸',
        '',
        '君も放課後クロニクルの世界へ――',
        '',
        '#放課後クロニクル #学生証メーカー'
      ].join('\n');

      // 1) まず OS の共有シート（Web Share API）を試す
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile && navigator.share) {
        try {
          await navigator.share({ text: tweet });   // URLは本文先頭に含める運用なので text のみでOK
          return;
        } catch (e) {
          // ユーザーキャンセルや未許可はフォールバック
        }
      }

      // 2) フォールバック: Web Intent（新しいタブで安定）
      shareToX();
      
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
        const { public_id, version } = imageData;
        shareUrl = window.buildShareUrlWithImage({
          public_id,
          version
        });
        
        // 画像データを保存（埋め込み時の保存対応用）
        window.__lastImageData = imageData;
        
        // 状態を保存（戻っても診断結果が剥がれない）
        if (window.saveResult) {
          const formData = {
            nameJa: elements.nameJa?.value || '',
            nameEn: elements.nameEn?.value || '',
            dobMonth: elements.dobMonth?.value || '',
            dobDay: elements.dobDay?.value || ''
          };
          
          // Cloudinaryのどの形で返ってきても拾えるように統一
          const eagerUrl = 
            imageData.eager?.[0]?.secure_url ||
            imageData.eager_url ||
            imageData.secure_url ||
            null;
          
          window.saveResult({
            public_id,
            version,
            eager_url: eagerUrl,
            imageData,
            formData,
            timestamp: Date.now()
          });
        }
        
        // プレビュー画像を表示（t_full_card で全表示）
        const previewImg = document.getElementById('cardPreview');
        if (previewImg && imageData.public_id) {
          const fullImageUrl = fullUrl(imageData.public_id, 'png');
          previewImg.src = fullImageUrl;
          previewImg.style.display = 'block';
          // Canvasは非表示
          const canvas = document.getElementById('cardCanvas');
          if (canvas) canvas.style.display = 'none';
        }
        
        // 共有リンクを更新（buildShareUrlWithImageが利用可能な場合のみ）
        if (window.updateShareLinksWithImage) {
          window.updateShareLinksWithImage(imageData, '学生証を発行しました');
        }
      } else {
        // buildShareUrlWithImageが利用できない場合はエラー
        console.error('共有URL生成に必要な関数が利用できません');
        shareUrl = '共有URLの生成に失敗しました';
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





// === 画像Blobを準備（Canvas優先、なければCloudinaryのJPEGをfetch） ===
async function makeShareFile() {
  const canvas = document.getElementById('cardCanvas');
  if (canvas && canvas.toBlob) {
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
    if (blob) return new File([blob], 'student_id.jpg', { type: 'image/jpeg' });
  }
  // Fallback: OGP用の最終画像（JPEG拡張子のURL）をfetch
  const url = window.__ogpImageUrl; // 例: /ogp/v<ver>/<public_id>.jpg
  if (!url) return null;
  const resp = await fetch(url, { mode: 'cors', credentials: 'omit' });
  const blob = await resp.blob();
  return new File([blob], 'student_id.jpg', { type: blob.type || 'image/jpeg' });
}

// === Cloudinary 返却（アップロード結果）から OGP 用 URL を作る ===
function buildOgpImageUrl({ cloudName = "di5xqlddy", folder, public_id }) {
  // Cloudinary 直
  const cloudinaryOgp = `https://res.cloudinary.com/${cloudName}/image/upload/t_ogp_card/${folder}/${public_id}.jpg`;
  // OGP HTML ページ（Discord/X が見に来る用の安定 URL）
  const ogpHtml = `https://student-id-generator.pages.dev/ogp/${folder}/${public_id}.jpg`;
  return { cloudinaryOgp, ogpHtml };
}

// === 共有テキスト（新文面） ===
function buildShareText() {
  return [
    "ようこそ、夢見が丘女子高等学校へ！",
    "忘れられない放課後を、あなたに。",
    "✎︎＿＿＿＿＿＿＿＿＿＿＿＿＿＿",
    "",
    "▼ #放課後クロニクル のHPで自分だけの学生証を作ろう！",
    "https://lime016395.studio.site/student-id"
  ].join("\n");
}

// === X への投稿（PC/スマホで挙動を分岐、スマホはアプリのみ） ===
async function shareToX({ ogpHtml }) {
  const text = buildShareText() + "\n" + ogpHtml;

  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /iphone|ipad|ipod|android/.test(ua);
  const webIntent = "https://x.com/intent/tweet?text=" + encodeURIComponent(text);

  // PC: 常に新規タブ
  if (!isMobile) {
    window.open(webIntent, "_blank", "noopener,noreferrer");
    return;
  }

  // モバイル
  try {
    if (navigator.share) {
      await navigator.share({ text, url: ogpHtml });
      return;
    }
  } catch (_) { /* fallthrough */ }

  // アプリスキーム（1回だけ）→ 失敗時フォールバック
  const scheme = ua.includes("iphone") || ua.includes("ipad")
    ? "twitter://post?message=" + encodeURIComponent(text) // iOS
    : "twitter://post?message=" + encodeURIComponent(text); // Android

  let jumped = false;
  const timer = setTimeout(() => {
    if (!jumped) location.href = webIntent; // 失敗時のみフォールバック
  }, 300);

  try {
    jumped = true;
    location.href = scheme;
  } catch (_) {
    clearTimeout(timer);
    location.href = webIntent;
  }
}

// === 共有エントリポイント ===
async function onShareXClicked(uploadResult) {
  // uploadResult からフォルダ/ public_id を取り出す
  // 例：{ public_id: "abcd1234", folder: "as_chronicle/student_card", ... }
  const { folder, public_id } = uploadResult;
  const { ogpHtml } = buildOgpImageUrl({ folder, public_id });

  await shareToX({ ogpHtml });
}

// === フォームの初期化（前データを残さない） ===
function resetStudentForm() {
  const ids = ["nameJa", "nameEn", "dobMonth", "dobDay"];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

// === 初期化処理 ===
document.addEventListener("DOMContentLoaded", () => {
  try { 
    // このアプリのキーだけクリア
    const keysToClear = ['student_form', 'student_profile', 'last_result', 'profileCache'];
    keysToClear.forEach(key => {
      try { sessionStorage.removeItem(key); } catch(_) {}
    });
  } catch(_) {}
  resetStudentForm();
});

// グローバル関数として公開
window.shareToX = shareToX;
window.onShareXClicked = onShareXClicked;
window.buildOgpImageUrl = buildOgpImageUrl;

// === X 共有（PC=新規タブ、スマホ=アプリ優先）の関数 ===
function openXShare({ text, url }) {
  const ua = navigator.userAgent || '';
  const encoded = encodeURIComponent(text + '\n' + url);
  const webIntent = `https://x.com/intent/tweet?text=${encoded}`;

  // PC は新規タブで Web Intent
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
  if (!isMobile) {
    window.open(webIntent, '_blank', 'noopener');
    return;
  }
  // モバイル：アプリスキーム優先 → フォールバック
  const tryOpen = (scheme) => {
    // iframe や埋め込み内でも最上位で遷移
    const w = (window.top || window);
    w.location.href = scheme;
  };
  // 一部端末：x://post?text=… あるいは twitter://post?message=…
  const appSchemes = [
    `x://post?text=${encoded}`,
    `twitter://post?message=${encoded}`
  ];
  let tried = 0;
  const timer = setInterval(() => {
    if (tried >= appSchemes.length) {
      clearInterval(timer);
      (window.top||window).location.href = webIntent; // 最後は Web Intent
      return;
    }
    tryOpen(appSchemes[tried++]);
  }, 350);
}

// 画面側ボタン紐付け（data-action="share-x" 要素に適用）
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-action="share-x"]');
  if (!t) return;
  e.preventDefault();
  const url = t.getAttribute('data-share') || t.href || location.href;
  const text = [
    'ようこそ、夢見が丘女子高等学校へ！',
    '　忘れられない放課後を、あなたに。',
    '✎︎＿＿＿＿＿＿＿＿＿＿＿＿＿＿',
    '',
    '▼ #放課後クロニクル　のHPで自分だけの学生証を作ろう！'
  ].join('\n');
  openXShare({ text, url });
});

// グローバル関数として公開
window.openXShare = openXShare;
window.handlePhotoSelected = handlePhotoSelected;
window.downloadCanvasAsImage = downloadCanvasAsImage;

// === ジェネレーター専用の初期化関数 ===
// 写真アップロード処理（CORS対応・堅牢化）
async function handlePhotoSelected(e) {
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
      e.target.value = ''; 
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

    if (window.showLoading) window.showLoading('写真を読み込み中...');

    uploadedPhoto = new Image();
    uploadedPhoto.crossOrigin = 'anonymous'; // CORS対応
    
    uploadedPhoto.onload = async () => {
      try {
        // デコード待ち（描画ロジック自体は不変）
        await uploadedPhoto.decode().catch(() => {});
      } catch(e) {
        console.warn('Image decode warning:', e);
      }
      if (window.hideLoading) window.hideLoading();
      if (window.drawStudentCard) window.drawStudentCard();
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
    e.target.value = '';
    uploadedPhoto = null;
    if (window.hideLoading) window.hideLoading();
    if (window.drawEmptyCard) window.drawEmptyCard();
  }
}

function setupCardCanvas() {
  const cvs = document.getElementById('cardCanvas');
  if (!cvs) return null;
  const dpr = window.devicePixelRatio || 1;
  const W = 800, H = 500; // 既存の描画ロジックと完全一致させる
  // 物理解像度のみ上げ、論理座標は 800x500 のまま
  if (cvs.width !== W * dpr || cvs.height !== H * dpr) {
    cvs.width  = W * dpr;
    cvs.height = H * dpr;
    cvs.style.width  = W + 'px';
    cvs.style.height = H + 'px';
    ctx = cvs.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  return cvs;
}

function initGeneratorPage() {
  console.log('initGeneratorPage開始');
  
  const cardCanvas = document.getElementById('cardCanvas');
  if (!cardCanvas) {
    console.error('cardCanvas要素が見つかりません');
    return; // 他ページ無視
  }
  
  console.log('cardCanvas要素を発見:', cardCanvas);
  setupCardCanvas();

  const idsChange = ['dobMonth','dobDay'];
  const idsInput  = ['nameJa','nameEn'];
  idsInput.forEach(id => document.getElementById(id)?.addEventListener('input', () => {
    if (typeof window.drawStudentCard === 'function') window.drawStudentCard();
  }));
  idsChange.forEach(id => document.getElementById(id)?.addEventListener('change', () => {
    if (typeof window.drawStudentCard === 'function') window.drawStudentCard();
  }));
  document.getElementById('photoInput')?.addEventListener('change', async (e) => {
    // 既存の画像読込ハンドラ（座標・サイズはいじらない）
    await handlePhotoSelected(e); // 既存関数名に合わせる。なければ既存実装を呼ぶ
    if (typeof window.drawStudentCard === 'function') window.drawStudentCard();
  });

  // 復元データがあれば反映後に描画
  try {
    const last = window.loadResult?.();
    if (last) {
      // 既存の保存形式に合わせてフィールドへ復元のみ（座標は触らない）
      if (last.formData) {
        const {nameJa, nameEn, dobMonth, dobDay} = last.formData;
        if (nameJa)  document.getElementById('nameJa').value  = nameJa;
        if (nameEn)  document.getElementById('nameEn').value  = nameEn;
        if (dobMonth)document.getElementById('dobMonth').value= dobMonth;
        if (dobDay)  document.getElementById('dobDay').value  = dobDay;
      }
    }
  } catch(_) {}

  // drawStudentCard関数が定義されているか確認してから実行
  if (typeof window.drawStudentCard === 'function') {
    window.drawStudentCard();
  } else {
    // 関数がまだ定義されていない場合は遅延実行
    setTimeout(() => {
      if (typeof window.drawStudentCard === 'function') {
        window.drawStudentCard();
      } else {
        console.error('drawStudentCard関数が見つかりません');
      }
    }, 100);
  }
}

document.addEventListener('DOMContentLoaded', initGeneratorPage);

