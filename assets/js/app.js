import cloudinaryConfig from './cloudinary.config.js';

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
const IMG_BG = "assets/img/student_template.png";
const BOX = { x: 72, y: 198, w: 379, h: 497 };
const POS = {
  name: { x: 600, y: 280, w: 500 },
  nameEn: { x: 600, y: 340, w: 500 },
  department: { x: 600, y: 420 },
  birth: { x: 600, y: 500 }
};

// Cloudinary設定
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;
const CLOUDINARY_UPLOAD_PRESET = cloudinaryConfig.uploadPreset;

// html2canvasオプション
const CANVAS_OPTIONS = {
  useCORS: true,
  allowTaint: true,
  backgroundColor: null,
  scale: 2,
  logging: false // 本番環境ではログを無効化
};

let photos = [], idx = 0;

document.addEventListener('DOMContentLoaded', () => {
  // 要素の取得と存在確認
  const elements = {
    photoInput: document.getElementById('photoInput'),
    createBtn: document.getElementById('createBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    twitterBtn: document.getElementById('twitterBtn'),
    lineBtn: document.getElementById('lineBtn'),
    urlBtn: document.getElementById('urlBtn'),
    photoFrame: document.querySelector('.photo-frame'),
    cardPreview: document.querySelector('.preview-card'),
    dobMonth: document.getElementById('dobMonth'),
    dobDay: document.getElementById('dobDay')
  };

  // 要素の存在確認
  Object.entries(elements).forEach(([key, element]) => {
    if (!element) {
      console.error(`Error: ${key} element not found`);
    }
  });

  // 生年月日の選択肢を生成
  if (elements.dobMonth && elements.dobDay) {
    // 月の選択肢を追加
    elements.dobMonth.innerHTML = '<option value="">月</option>' + 
      Array.from({length: 12}, (_, i) => i + 1)
        .map(i => `<option value="${i}">${i}</option>`)
        .join('');

    // 日の選択肢を追加
    elements.dobDay.innerHTML = '<option value="">日</option>' + 
      Array.from({length: 31}, (_, i) => i + 1)
        .map(i => `<option value="${i}">${i}</option>`)
        .join('');
  }

  // 写真アップロード処理
  elements.photoInput.onchange = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // 画像ファイルのバリデーション
      if (!file.type.startsWith('image/')) {
        throw new Error('画像ファイルを選択してください');
      }

      // ファイルサイズチェック（5MB以下）
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('ファイルサイズは5MB以下にしてください');
      }

      // 一時的なプレビューを表示
      const url = URL.createObjectURL(file);
      await updatePhotoPreview(url);

      // Cloudinaryにアップロード
      const form = new FormData();
      form.append('file', file);
      form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      
      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: form
      });
      
      if (!response.ok) throw new Error('アップロードに失敗しました');
      
      const json = await response.json();
      window.uploadedImageUrl = json.secure_url;
      
      // プレビューを更新
      await updatePhotoPreview(json.secure_url);
      
      // 一時URLを解放
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('画像アップロードエラー:', err);
      alert(err.message || '画像のアップロードに失敗しました。もう一度お試しください。');
    }
  };

  // 写真プレビューの更新
  async function updatePhotoPreview(imageUrl) {
    try {
      if (!elements.photoFrame) throw new Error('写真フレームが見つかりません');

      // 画像の読み込みを待機
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
        img.src = imageUrl;
        img.alt = 'アップロード写真';
      });

      // プレビューを更新
      elements.photoFrame.replaceChildren(img);
    } catch (err) {
      console.error('プレビュー更新エラー:', err);
      throw err;
    }
  }

  // 学生証生成処理
  elements.createBtn.onclick = async () => {
    try {
      if (!elements.cardPreview) throw new Error('プレビューが見つかりません');
      if (!window.uploadedImageUrl) throw new Error('写真をアップロードしてください');

      const canvas = await html2canvas(elements.cardPreview, CANVAS_OPTIONS);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      
      const form = new FormData();
      form.append('file', blob);
      form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: form
      });

      if (!response.ok) throw new Error('アップロードに失敗しました');

      const json = await response.json();
      setupShare(json.secure_url);
    } catch (err) {
      console.error('学生証生成エラー:', err);
      alert(err.message || '学生証の生成に失敗しました。もう一度お試しください。');
    }
  };

  // ダウンロード処理
  elements.downloadBtn.onclick = async () => {
    try {
      if (!elements.cardPreview) throw new Error('プレビューが見つかりません');
      if (!window.uploadedImageUrl) throw new Error('写真をアップロードしてください');

      const canvas = await html2canvas(elements.cardPreview, CANVAS_OPTIONS);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'student_card.png';
      a.click();
    } catch (err) {
      console.error('ダウンロードエラー:', err);
      alert(err.message || '画像のダウンロードに失敗しました。もう一度お試しください。');
    }
  };

  // テキスト反映
  ['nameJa', 'nameEn', 'department', 'club', 'dobMonth', 'dobDay'].forEach(id => {
    const element = document.getElementById(id);
    if (!element) {
      console.error(`Error: ${id} element not found`);
      return;
    }
    element.addEventListener('input', reflectText);
  });

  // テキスト反映処理
  function reflectText() {
    try {
      const textElements = {
        nameJa: document.querySelector('.student-name-ja'),
        nameEn: document.querySelector('.student-name-en'),
        info: document.querySelector('.student-info')
      };

      Object.values(textElements).forEach(element => {
        if (!element) throw new Error('テキスト要素が見つかりません');
      });

      const values = {
        nameJa: document.getElementById('nameJa')?.value || '',
        nameEn: document.getElementById('nameEn')?.value || '',
        department: document.getElementById('department')?.value || '',
        club: document.getElementById('club')?.value || '',
        month: document.getElementById('dobMonth')?.value || '',
        day: document.getElementById('dobDay')?.value || ''
      };

      textElements.nameJa.textContent = values.nameJa;
      textElements.nameEn.textContent = values.nameEn;
      textElements.info.textContent = `${values.department}・${values.club}・${values.month}月${values.day}日`;
    } catch (err) {
      console.error('テキスト反映エラー:', err);
    }
  }

  // シェア機能セットアップ
  function setupShare(imageUrl) {
    try {
      const text = encodeURIComponent('学生証を作成しました！');
      const url = encodeURIComponent(imageUrl);
      
      elements.twitterBtn.onclick = () => {
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
      };

      elements.lineBtn.onclick = () => {
        window.open(`https://social-plugins.line.me/lineit/share?url=${url}`, '_blank');
      };

      elements.urlBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(imageUrl);
          alert('URLをコピーしました！');
        } catch (err) {
          console.error('URLコピーエラー:', err);
          alert('URLのコピーに失敗しました。もう一度お試しください。');
        }
      };
    } catch (err) {
      console.error('シェア機能セットアップエラー:', err);
    }
  }
}); 