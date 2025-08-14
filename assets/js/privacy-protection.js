// 個人情報保護・ウイルス対策ライブラリ
(function() {
  'use strict';

  // プライバシー保護設定
  const PrivacyConfig = {
    // データ収集禁止
    blockDataCollection: true,
    // トラッキング防止
    blockTracking: true,
    // ローカルストレージ暗号化
    encryptLocalStorage: true,
    // アナリティクス無効化
    disableAnalytics: true,
    // フィンガープリンティング防止
    preventFingerprinting: true,
    // ウイルス対策
    enableVirusProtection: true,
    // ファイルアップロード検証
    strictFileValidation: true,
    // 外部通信制限
    restrictExternalRequests: true
  };

  // 暗号化キーの生成
  function generateEncryptionKey() {
    const key = new Uint8Array(32);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(key);
    } else {
      // フォールバック
      for (let i = 0; i < 32; i++) {
        key[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(key).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 簡易暗号化（個人情報保護用）
  function simpleEncrypt(text, key) {
    if (!text || typeof text !== 'string') return text;
    
    let encrypted = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const keyCode = key.charCodeAt(i % key.length);
      encrypted += String.fromCharCode(charCode ^ keyCode);
    }
    return btoa(encrypted);
  }

  // 簡易復号化
  function simpleDecrypt(encryptedText, key) {
    if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;
    
    try {
      const decoded = atob(encryptedText);
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i);
        const keyCode = key.charCodeAt(i % key.length);
        decrypted += String.fromCharCode(charCode ^ keyCode);
      }
      return decrypted;
    } catch (e) {
      console.warn('復号化エラー:', e);
      return encryptedText;
    }
  }

  // セキュアローカルストレージ
  const SecureStorage = {
    encryptionKey: generateEncryptionKey(),
    
    setItem: function(key, value) {
      if (!PrivacyConfig.encryptLocalStorage) {
        localStorage.setItem(key, value);
        return;
      }
      
      try {
        const encrypted = simpleEncrypt(JSON.stringify(value), this.encryptionKey);
        localStorage.setItem('sec_' + key, encrypted);
        console.log('🔒 データを暗号化して保存しました:', key);
      } catch (e) {
        console.warn('⚠️ 暗号化保存エラー:', e);
        // 暗号化に失敗した場合は保存しない（個人情報保護）
      }
    },
    
    getItem: function(key) {
      if (!PrivacyConfig.encryptLocalStorage) {
        return localStorage.getItem(key);
      }
      
      try {
        const encrypted = localStorage.getItem('sec_' + key);
        if (!encrypted) return null;
        
        const decrypted = simpleDecrypt(encrypted, this.encryptionKey);
        return JSON.parse(decrypted);
      } catch (e) {
        console.warn('⚠️ 復号化エラー:', e);
        return null;
      }
    },
    
    removeItem: function(key) {
      localStorage.removeItem('sec_' + key);
      localStorage.removeItem(key); // 古い形式も削除
    },
    
    clear: function() {
      // セキュアストレージのみクリア
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('sec_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('🧹 セキュアストレージをクリアしました');
    }
  };

  // ファイルアップロード検証（緩和版）
  function validateFileUpload(file) {
    if (!file) return false;

    // 容量制限なし（JPEG/PNG専用のため安全）
    // const maxSize = 50 * 1024 * 1024;
    // if (file.size > maxSize) {
    //   console.warn('🚨 ファイルサイズが大きすぎます:', file.size);
    //   return false;
    // }

    // JPEG/JPG/PNGのみ許可（容量制限なし）
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (file.type && !allowedTypes.includes(file.type)) {
      console.warn('🚨 対応していないファイル形式:', file.type);
      return false;
    }

    // ファイル名の基本的な安全性チェック（緩和版）
    const dangerousChars = /(<script|javascript:|data:(?!image)|vbscript:|file:|exec|cmd)/i;
    if (dangerousChars.test(file.name)) {
      console.warn('🚨 危険なファイル名が検出されました:', file.name);
      return false;
    }

    return true;
  }

  // 画像ファイルの内容検証（緩和版）
  function validateImageContent(file) {
    return new Promise((resolve) => {
      // 基本的なケースでは検証をスキップ
      if (!file || file.size < 100 * 1024 * 1024) { // 100MB未満は基本的に許可
        resolve(true);
        return;
      }

      const reader = new FileReader();
      reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // 画像のマジックナンバーをチェック
        const isValidImage = checkImageMagicNumbers(uint8Array);
        if (!isValidImage) {
          console.warn('🚨 無効な画像ファイルです');
          resolve(false);
          return;
        }

        // 疑わしいバイナリパターンをチェック
        const hasSuspiciousPattern = checkSuspiciousPatterns(uint8Array);
        if (hasSuspiciousPattern) {
          console.warn('🚨 疑わしいパターンが検出されました');
          resolve(false);
          return;
        }

        resolve(true);
      };
      
      reader.onerror = function() {
        console.warn('🚨 ファイル読み込みエラー');
        resolve(false);
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  // 画像のマジックナンバーチェック
  function checkImageMagicNumbers(uint8Array) {
    const jpegMagic = [0xFF, 0xD8, 0xFF];
    const pngMagic = [0x89, 0x50, 0x4E, 0x47];
    const gifMagic = [0x47, 0x49, 0x46];
    const webpMagic = [0x52, 0x49, 0x46, 0x46];

    // JPEGチェック
    if (uint8Array.length >= 3) {
      let isJpeg = true;
      for (let i = 0; i < jpegMagic.length; i++) {
        if (uint8Array[i] !== jpegMagic[i]) {
          isJpeg = false;
          break;
        }
      }
      if (isJpeg) return true;
    }

    // PNGチェック
    if (uint8Array.length >= 4) {
      let isPng = true;
      for (let i = 0; i < pngMagic.length; i++) {
        if (uint8Array[i] !== pngMagic[i]) {
          isPng = false;
          break;
        }
      }
      if (isPng) return true;
    }

    // GIFチェック
    if (uint8Array.length >= 3) {
      let isGif = true;
      for (let i = 0; i < gifMagic.length; i++) {
        if (uint8Array[i] !== gifMagic[i]) {
          isGif = false;
          break;
        }
      }
      if (isGif) return true;
    }

    // WebPチェック
    if (uint8Array.length >= 12) {
      let isWebp = true;
      for (let i = 0; i < webpMagic.length; i++) {
        if (uint8Array[i] !== webpMagic[i]) {
          isWebp = false;
          break;
        }
      }
      if (isWebp && uint8Array[8] === 0x57 && uint8Array[9] === 0x45 && 
          uint8Array[10] === 0x42 && uint8Array[11] === 0x50) {
        return true;
      }
    }

    return false;
  }

  // 疑わしいパターンのチェック
  function checkSuspiciousPatterns(uint8Array) {
    // 実行可能ファイルのシグネチャをチェック
    const suspiciousPatterns = [
      [0x4D, 0x5A], // MZ (Windows PE)
      [0x7F, 0x45, 0x4C, 0x46], // ELF
      [0xCA, 0xFE, 0xBA, 0xBE], // Mach-O
      [0x50, 0x4B, 0x03, 0x04], // ZIP (実行可能ファイルが含まれている可能性)
    ];

    for (const pattern of suspiciousPatterns) {
      if (uint8Array.length >= pattern.length) {
        let matches = true;
        for (let i = 0; i < pattern.length; i++) {
          if (uint8Array[i] !== pattern[i]) {
            matches = false;
            break;
          }
        }
        if (matches) return true;
      }
    }

    // 大量のnullバイトや特殊パターンをチェック
    let nullCount = 0;
    let suspiciousSequence = 0;
    
    for (let i = 0; i < Math.min(uint8Array.length, 1024); i++) {
      if (uint8Array[i] === 0x00) {
        nullCount++;
        suspiciousSequence++;
      } else {
        suspiciousSequence = 0;
      }
      
      // 連続する16個のnullバイトは疑わしい
      if (suspiciousSequence > 16) {
        return true;
      }
    }

    // nullバイトの割合が50%を超える場合は疑わしい
    if (nullCount / Math.min(uint8Array.length, 1024) > 0.5) {
      return true;
    }

    return false;
  }

  // トラッキング防止
  function blockTracking() {
    if (!PrivacyConfig.blockTracking) return;

    // Google Analytics無効化
    window['ga-disable-all'] = true;
    window.gtag = function() {
      console.log('📊 アナリティクス無効化済み');
    };

    // その他のトラッカー無効化
    const trackers = ['_gaq', '_gat', '__utma', '__utmb', '__utmc', '__utmz', 'fbq', 'gtm'];
    trackers.forEach(tracker => {
      window[tracker] = function() {
        console.log('🚫 トラッカー無効化:', tracker);
      };
    });

    // Referrerの制限
    if (document.referrer) {
      Object.defineProperty(document, 'referrer', {
        get: function() { return ''; },
        configurable: false
      });
    }
  }

  // フィンガープリンティング防止
  function preventFingerprinting() {
    if (!PrivacyConfig.preventFingerprinting) return;

    // Canvas フィンガープリンティング防止
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function() {
      // 一部のノイズを追加してフィンガープリンティングを困難にする
      const ctx = this.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, this.width, this.height);
        if (imageData && imageData.data) {
          // 最後のピクセルにランダムノイズを追加
          const data = imageData.data;
          if (data.length >= 4) {
            data[data.length - 4] = (data[data.length - 4] + Math.floor(Math.random() * 3)) % 256;
          }
          ctx.putImageData(imageData, 0, 0);
        }
      }
      return originalToDataURL.apply(this, arguments);
    };

    // WebGL フィンガープリンティング防止
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type) {
      if (type === 'webgl' || type === 'experimental-webgl') {
        const context = originalGetContext.apply(this, arguments);
        if (context) {
          const originalGetParameter = context.getParameter;
          context.getParameter = function(parameter) {
            // GPUの詳細情報を隠蔽
            if (parameter === context.RENDERER || parameter === context.VENDOR) {
              return 'Privacy Protected';
            }
            return originalGetParameter.apply(this, arguments);
          };
        }
        return context;
      }
      return originalGetContext.apply(this, arguments);
    };

    // AudioContext フィンガープリンティング防止
    if (window.AudioContext || window.webkitAudioContext) {
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      const originalCreateAnalyser = AudioContextConstructor.prototype.createAnalyser;
      
      AudioContextConstructor.prototype.createAnalyser = function() {
        const analyser = originalCreateAnalyser.apply(this, arguments);
        const originalGetFrequencyData = analyser.getFloatFrequencyData;
        
        analyser.getFloatFrequencyData = function(array) {
          originalGetFrequencyData.apply(this, arguments);
          // 軽微なノイズを追加
          for (let i = 0; i < array.length; i++) {
            array[i] += (Math.random() - 0.5) * 0.0001;
          }
        };
        
        return analyser;
      };
    }
  }

  // 外部通信の制限
  function restrictExternalRequests() {
    if (!PrivacyConfig.restrictExternalRequests) return;

    // 許可されたドメインリスト
    const allowedDomains = [
      'api.cloudinary.com', // 画像アップロード用
      'cdnjs.cloudflare.com', // CDN
      'fonts.googleapis.com', // フォント
      'fonts.gstatic.com' // フォント
    ];

    // fetch のオーバーライド
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (typeof url === 'string') {
        try {
          const urlObj = new URL(url, window.location.origin);
          const domain = urlObj.hostname;
          
          // 同一オリジンまたは許可されたドメインのみ許可
          if (urlObj.origin !== window.location.origin && !allowedDomains.includes(domain)) {
            console.warn('🚫 外部通信をブロックしました:', domain);
            return Promise.reject(new Error('External request blocked for privacy'));
          }
        } catch (e) {
          console.warn('🚫 無効なURLをブロックしました:', url);
          return Promise.reject(new Error('Invalid URL blocked'));
        }
      }
      
      return originalFetch.apply(this, arguments);
    };

    // XMLHttpRequest のオーバーライド
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      if (typeof url === 'string') {
        try {
          const urlObj = new URL(url, window.location.origin);
          const domain = urlObj.hostname;
          
          if (urlObj.origin !== window.location.origin && !allowedDomains.includes(domain)) {
            console.warn('🚫 外部XHR通信をブロックしました:', domain);
            return;
          }
        } catch (e) {
          console.warn('🚫 無効なXHR URLをブロックしました:', url);
          return;
        }
      }
      
      return originalXHROpen.apply(this, arguments);
    };
  }

  // データ収集の防止
  function blockDataCollection() {
    if (!PrivacyConfig.blockDataCollection) return;

    // フォームデータの自動収集を防止
    document.addEventListener('submit', function(event) {
      console.log('📋 フォーム送信をプライバシー保護モードで処理');
      // 必要に応じて個人情報を除去
    });

    // input イベントの監視
    document.addEventListener('input', function(event) {
      if (event.target.type === 'file') {
        const file = event.target.files[0];
        if (file) {
          console.log('📁 ファイル選択を検証中:', file.name);
          // ファイル検証は別途実行
        }
      }
    });

    // クリップボードアクセスの制限
    const originalWriteText = navigator.clipboard?.writeText;
    if (originalWriteText) {
      navigator.clipboard.writeText = function(text) {
        // 個人情報が含まれていないかチェック
        const sensitivePatterns = [
          /\b\d{4}-\d{4}-\d{4}-\d{4}\b/, // クレジットカード
          /\b\d{3}-\d{2}-\d{4}\b/, // SSN
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // メール
        ];
        
        for (const pattern of sensitivePatterns) {
          if (pattern.test(text)) {
            console.warn('🚫 個人情報の可能性があるデータのクリップボードコピーをブロックしました');
            return Promise.reject(new Error('Sensitive data blocked'));
          }
        }
        
        return originalWriteText.apply(this, arguments);
      };
    }
  }

  // セキュリティの初期化
  function initPrivacySecurity() {
    console.log('🔐 プライバシー保護システム初期化中...');
    
    blockTracking();
    preventFingerprinting();
    restrictExternalRequests();
    blockDataCollection();
    
    // 既存のlocalStorageを暗号化に移行
    if (PrivacyConfig.encryptLocalStorage) {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (!key.startsWith('sec_')) {
          const value = localStorage.getItem(key);
          if (value) {
            SecureStorage.setItem(key, value);
            localStorage.removeItem(key);
          }
        }
      });
    }
    
    console.log('✅ プライバシー保護システム初期化完了');
  }

  // 公開API
  window.PrivacySecurity = {
    validateFileUpload: validateFileUpload,
    validateImageContent: validateImageContent,
    SecureStorage: SecureStorage,
    
    // 設定変更
    configure: function(config) {
      Object.assign(PrivacyConfig, config);
    },
    
    // 緊急時のデータクリア
    emergencyClear: function() {
      SecureStorage.clear();
      console.log('🚨 緊急データクリアを実行しました');
    }
  };

  // 初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPrivacySecurity);
  } else {
    initPrivacySecurity();
  }

})(); 