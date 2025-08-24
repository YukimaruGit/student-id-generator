// セキュリティ強化用ライブラリ
(function() {
  'use strict';

  // セキュリティ設定
  const SecurityConfig = {
    // CSP設定
    enableCSP: true,
    // XSS保護
    enableXSSProtection: true,
    // Git情報隠蔽
    hideGitInfo: true,
    // コンソールログ制限
    limitConsoleAccess: true,
    // デバッグ情報隠蔽
    hideDebugInfo: true,
    // コピー防止
    preventCopy: true
  };

  // CSPRNG nonce生成
  function generateNonce() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // XSS対策: HTMLエスケープ関数
  function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 安全なinnerHTML設定（DOMPurify利用）
  function safeSetInnerHTML(element, htmlString) {
    if (!element) return;
    
    // DOMPurifyが利用可能な場合は使用、そうでなければ基本的なサニタイゼーション
    if (window.DOMPurify) {
      element.innerHTML = DOMPurify.sanitize(htmlString, {RETURN_TRUSTED_TYPE: false});
    } else {
      // 基本的なサニタイゼーション（フォールバック）
      const sanitized = htmlString
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // script除去
        .replace(/javascript:/gi, '') // javascript: プロトコル除去
        .replace(/on\w+\s*=/gi, ''); // イベントハンドラ除去
      
      element.innerHTML = sanitized;
    }
  }

  // URLパラメータの安全な取得
  function getSafeUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    const value = params.get(name);
    if (!value) return null;
    
    // 基本的なバリデーション
    if (value.length > 1000) return null; // 長すぎる値は拒否
    if (/<script|javascript:|data:|vbscript:/i.test(value)) return null; // 危険なスキーム拒否
    
    return escapeHtml(value);
  }

  // Git情報隠蔽（ログ出力側でマスク、プロパティ上書きは削除）
  function hideGitInfo() {
    if (!SecurityConfig.hideGitInfo) return;

    // コンソールメッセージの改変（出力側でのみ）
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error
    };

    function filterMessage(message) {
      if (typeof message === 'string') {
        return message
          .replace(/github\.io/gi, 'app-host')
          .replace(/github\.com/gi, 'code-host')
          .replace(/githubusercontent/gi, 'static-host')
          .replace(/yukimaru/gi, 'dev-team')
          .replace(/\.git/gi, '.repo');
      }
      return message;
    }

    ['log', 'info', 'warn', 'error'].forEach(method => {
      console[method] = function(...args) {
        const filteredArgs = args.map(filterMessage);
        originalConsole[method].apply(console, filteredArgs);
      };
    });
  }

  // コピー防止機能（デザイン・ギミックに影響なし）
  function setupCopyProtection() {
    if (!SecurityConfig.preventCopy) return;

    // 既存のstyleタグに直接追加する方法を採用（nonceの競合を回避）
    const existingStyleTag = document.querySelector('style');
    if (existingStyleTag) {
      // 既存のstyleタグにコピー防止CSSを追加
      const copyProtectionCSS = `
      
      /* === コピー防止用スタイル（セキュリティ機能） === */
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
      }
      
      /* 全要素の選択を完全に無効化 */
      *::selection {
        background: transparent !important;
        color: inherit !important;
      }
      
      *::-moz-selection {
        background: transparent !important;
        color: inherit !important;
      }
      
             /* 画像のドラッグ&ドロップを完全に無効化 */
       img {
         -webkit-user-drag: none !important;
         -khtml-user-drag: none !important;
         -moz-user-drag: none !important;
         -o-user-drag: none !important;
         user-drag: none !important;
         pointer-events: none !important;
       }
       
       /* 画像の右クリックメニューを無効化 */
       img {
         -webkit-context-menu: none !important;
         -moz-context-menu: none !important;
         context-menu: none !important;
       }
       
       /* プレビュー/保存用画像は操作可能に保持 */
       #savePreview,
       #idPreview img,
       #cardCanvas {
         pointer-events: auto !important;
         -webkit-user-select: none !important;
         -moz-user-select: none !important;
         -ms-user-select: none !important;
         user-select: none !important;
       }
      
      /* 入力フィールドのみ選択可能に保持（必要最小限） */
      input[type="text"], input[type="password"], input[type="email"], 
      input[type="search"], input[type="url"], textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
        pointer-events: auto !important;
      }
      
      /* ボタンやリンクは操作可能に保持 */
      button, a, [role="button"] {
        pointer-events: auto !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        user-select: none !important;
      }
      /* === コピー防止用スタイル終了 === */
      `;
      
      existingStyleTag.textContent += copyProtectionCSS;
    } else {
      // フォールバック：既存のstyleタグがない場合は新規作成
      const copyProtectionStyle = document.createElement('style');
      copyProtectionStyle.textContent = `
      /* コピー防止用スタイル - 既存デザインに影響なし */
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      
      /* 全要素の選択を完全に無効化 */
      *::selection {
        background: transparent !important;
      }
      
      *::-moz-selection {
        background: transparent !important;
      }
      
      /* 入力フィールドのみ選択可能に保持（必要最小限） */
      input[type="text"], input[type="password"], input[type="email"], 
      input[type="search"], input[type="url"], textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      `;
      
      if (document.head) {
        document.head.appendChild(copyProtectionStyle);
      }
    }

    // テキスト選択の強制解除
    const clearSelection = function() {
      if (window.getSelection) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          selection.removeAllRanges();
        }
      }
      if (document.selection && document.selection.empty) {
        document.selection.empty();
      }
    };

    // フォーム要素判定（安全化）
    const isForm = (el) => {
      if (!el) return false;
      const node = el.nodeType === 1 ? el : el.parentElement; // TextNodeなど対応
      return !!(node && node.closest('input, textarea, select, [contenteditable="true"]'));
    };
    
    // 強化されたイベント防止（フォームは素通し）
    const preventEvent = function(e) {
      if (isForm(e.target)) return true; // フォーム由来は即 return
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      return false;
    };

    // JavaScriptによるコピーイベント防止
    document.addEventListener('copy', preventEvent, true);
    document.addEventListener('cut', preventEvent, true);
    document.addEventListener('paste', preventEvent, true);

    // 右クリックメニュー制限（コンテキストメニュー防止）
    document.addEventListener('contextmenu', preventEvent, true);

    // キーボードショートカット防止（強化版、フォーム要素は除外）
    document.addEventListener('keydown', function(e) {
      // フォーム要素の場合は通す
      if (isForm(e.target)) return;
      
      // Ctrl+C, Ctrl+X, Ctrl+A, Ctrl+V, Ctrl+Z, Ctrl+Y, Ctrl+S を防止
      if (e.ctrlKey && (e.key === 'c' || e.key === 'x' || e.key === 'a' || 
                        e.key === 'v' || e.key === 'z' || e.key === 'y' || e.key === 's')) {
        preventEvent(e);
        return false;
      }
      
      // Ctrl+Shift+I (開発者ツール), Ctrl+Shift+J (コンソール), Ctrl+U (ソース表示)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) {
        preventEvent(e);
        return false;
      }
      
      if (e.ctrlKey && e.key === 'u') {
        preventEvent(e);
        return false;
      }
      
      // F12キー防止
      if (e.key === 'F12') {
        preventEvent(e);
        return false;
      }
      
      // PrintScreenキー防止
      if (e.key === 'PrintScreen' || e.key === 'PrtScn') {
        preventEvent(e);
        return false;
      }
      
      // その他の開発者ツール関連キー
      if (e.key === 'F5' || e.key === 'F11') {
        preventEvent(e);
        return false;
      }
      
      // スクリーンショット関連のキーボードショートカット
      if (e.ctrlKey && e.shiftKey && e.key === '3') { // Mac
        preventEvent(e);
        return false;
      }
      
      if (e.ctrlKey && e.shiftKey && e.key === '4') { // Mac
        preventEvent(e);
        return false;
      }
    }, true);

    // マウスイベント防止
    document.addEventListener('mousedown', function(e) {
      // 右クリック、中クリック防止
      if (e.button === 1 || e.button === 2) {
        preventEvent(e);
      }
      
      // テキスト選択開始を強制的に防止
      clearSelection();
    }, true);

    document.addEventListener('mouseup', function(e) {
      // 右クリック、中クリック防止
      if (e.button === 1 || e.button === 2) {
        preventEvent(e);
      }
      
      // マウスアップ時にも選択をクリア
      clearSelection();
    }, true);

    // マウス移動中にも選択をクリア
    document.addEventListener('mousemove', function(e) {
      if (e.buttons === 1) { // 左ボタンが押されている場合
        clearSelection();
      }
    }, true);

    // ドラッグ&ドロップ防止
    document.addEventListener('dragstart', preventEvent, true);
    document.addEventListener('drag', preventEvent, true);
    document.addEventListener('dragend', preventEvent, true);

    // 選択関連イベント防止（強化版）
    document.addEventListener('selectstart', preventEvent, true);
    document.addEventListener('select', preventEvent, true);
    document.addEventListener('selectionchange', preventEvent, true);
    document.addEventListener('selectstart', preventEvent, true);
    
    // テキスト選択の開始を完全に防止
    document.addEventListener('mousedown', function(e) {
      // テキスト選択を防ぐため、ダブルクリックを防止
      if (e.detail > 1) {
        preventEvent(e);
        return false;
      }
    }, true);
    
    // テキスト選択の範囲拡張を防止
    document.addEventListener('mouseup', function(e) {
      if (window.getSelection && window.getSelection().rangeCount > 0) {
        window.getSelection().removeAllRanges();
      }
    }, true);

    // 定期的に選択を解除
    setInterval(clearSelection, 100);

    // フォーカス時にも選択を解除（フォーム要素は除外）
    document.addEventListener('focus', function(e) {
      if (!isForm(e.target)) clearSelection();
    }, true);
    document.addEventListener('blur', function(e) {
      if (!isForm(e.target)) clearSelection();
    }, true);

    // 印刷防止
    window.addEventListener('beforeprint', function(e) {
      preventEvent(e);
      alert('印刷は禁止されています。');
    });

    // 画像の保存防止（強化版）
    document.addEventListener('dragstart', function(e) {
      if (e.target.tagName === 'IMG') {
        preventEvent(e);
      }
    }, true);

    // 画像の右クリック保存を完全に防止
    document.addEventListener('contextmenu', function(e) {
      if (e.target.tagName === 'IMG') {
        preventEvent(e);
        return false;
      }
    }, true);

    // 画像のキーボードショートカット保存を防止
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.key === 's') {
        preventEvent(e);
        return false;
      }
    }, true);

    // 画像のコピーを完全に防止
    document.addEventListener('copy', function(e) {
      if (e.target.tagName === 'IMG' || window.getSelection().toString().includes('IMG')) {
        preventEvent(e);
        return false;
      }
    }, true);

    // 画像の切り取りを防止
    document.addEventListener('cut', function(e) {
      if (e.target.tagName === 'IMG') {
        preventEvent(e);
        return false;
      }
    }, true);

    // 画像のペーストを防止
    document.addEventListener('paste', function(e) {
      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          if (e.clipboardData.items[i].type.indexOf('image') !== -1) {
            preventEvent(e);
            return false;
          }
        }
      }
    }, true);

    // 画像要素への直接的な保護を追加
    const protectImages = function() {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        // 画像の右クリックを完全に無効化
        img.addEventListener('contextmenu', function(e) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }, true);
        
        // 画像のドラッグ開始を防止
        img.addEventListener('dragstart', function(e) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }, true);
        
        // 画像の選択開始を防止
        img.addEventListener('selectstart', function(e) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }, true);
        
        // 画像のコピーを防止
        img.addEventListener('copy', function(e) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }, true);
        
        // 画像の切り取りを防止
        img.addEventListener('cut', function(e) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }, true);
      });
    };
    
    // 初期保護を実行
    protectImages();
    
    // 動的に追加される画像も保護
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1 && node.tagName === 'IMG') {
              protectImages();
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('🛡️ コピー防止機能が有効化されました');
  }

  // CSP設定（nonce方式）- 既存設定との競合回避のため無効化
  function setupCSP() {
    if (!SecurityConfig.enableCSP) return;

    // nonce生成
    const nonce = generateNonce();
    
    // 既存のインラインscript/styleにnonceを付与
    document.querySelectorAll('script:not([src]), style').forEach(el => {
      el.setAttribute('nonce', nonce);
    });

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = [
      "default-src 'self'",
      `script-src 'self' https: 'nonce-${nonce}' 'strict-dynamic'`,
      `style-src 'self' https: 'nonce-${nonce}'`,
      "img-src 'self' data: https:",
      "font-src 'self' https:",
      "connect-src 'self'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "upgrade-insecure-requests",
      "block-all-mixed-content"
    ].join('; ');
    
    if (document.head) {
      document.head.prepend(meta);
    }
  }

  // Studio埋め込み互換CSP設定（既存設定と結合）
  function setupStudioCompatibleCSP() {
    if (!SecurityConfig.enableCSP) return;

    // 既存のCSP metaタグを確認
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    if (existingCSP) {
      // 既存設定と結合（Studio互換性を優先）
      const existingContent = existingCSP.content;
      const newContent = existingContent
        .replace(/frame-ancestors[^;]*/g, '') // 既存のframe-ancestorsを削除
        .replace(/;+/g, ';') // 重複セミコロンを整理
        .replace(/^;|;$/g, ''); // 先頭・末尾のセミコロンを削除
      
      // Studio埋め込み互換のframe-ancestorsを追加
      const studioCompatibleCSP = [
        newContent,
        "frame-ancestors https://*.studio.site https://preview.studio.site 'self'"
      ].join('; ');
      
      existingCSP.content = studioCompatibleCSP;
      console.log('🔄 既存CSP設定と結合完了（Studio埋め込み互換）');
    } else {
      // 新規作成（Studio互換）
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = [
        "default-src 'self' https:",
        "img-src 'self' data: blob: https: https://res.cloudinary.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "script-src 'self' 'unsafe-inline'",
        "connect-src 'self' https://api.cloudinary.com https://res.cloudinary.com https://x.com https://twitter.com data: blob:",
        "font-src 'self' https://fonts.gstatic.com data:",
        "frame-ancestors 'self' *",
        "base-uri 'self'",
        "upgrade-insecure-requests"
      ].join('; ');
      
      if (document.head) {
        document.head.prepend(meta);
        console.log('🆕 Studio互換CSP設定を新規作成');
      }
    }
  }

  // セキュリティヘッダー設定 - Studio埋め込み互換性のため無効化
  function setupSecurityHeaders() {
    // Studio埋め込み互換性のため、X-Frame-Options: DENYは設定しない
    // 既存のiframe埋め込みを阻害しないよう配慮
    
    // X-Content-Type-Options（安全な設定のみ）
    const noSniff = document.createElement('meta');
    noSniff.httpEquiv = 'X-Content-Type-Options';
    noSniff.content = 'nosniff';
    
    // Referrer Policy（安全な設定のみ）
    const referrerPolicy = document.createElement('meta');
    referrerPolicy.name = 'referrer';
    referrerPolicy.content = 'strict-origin-when-cross-origin';

    if (document.head) {
      document.head.appendChild(noSniff);
      document.head.appendChild(referrerPolicy);
      console.log('🔄 セキュリティヘッダー設定完了（Studio埋め込み互換）');
    }
  }

  // 開発者ツールの検出と制限（開発時のみ）
  function limitDevToolsAccess() {
    if (!SecurityConfig.limitConsoleAccess) return;
    
    // 開発環境でのみ有効
    if (window.__APP_ENV__ === 'development') {
      let devtools = {
        open: false,
        orientation: null
      };

      const threshold = 160;

      setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
          if (!devtools.open) {
            devtools.open = true;
            console.clear();
            console.log('%c🔒 セキュリティ保護が有効です', 'color: #ff6b6b; font-size: 16px; font-weight: bold;');
            console.log('%c⚠️ このコンソールを使用した悪意のある操作は禁止されています', 'color: #ffa500; font-size: 12px;');
          }
        } else {
          devtools.open = false;
        }
      }, 500);
    }
  }

  // URLの安全性チェック（厳密化）
  function validateCurrentUrl() {
    try {
      const url = new URL(window.location.href);
      const params = new URLSearchParams(url.search);
      
      // パラメータ値にjavascript:等が現れた場合のみリダイレクト
      for (const [key, value] of params.entries()) {
        if (value.toLowerCase().startsWith('javascript:') || 
            value.toLowerCase().startsWith('data:') ||
            value.toLowerCase().startsWith('vbscript:')) {
          console.warn('🚨 危険なURLパラメータが検出されました');
          // 同一パス＋クリーンなクエリへリダイレクト
          const cleanUrl = new URL(url.pathname, url.origin);
          window.location.href = cleanUrl.toString();
          return;
        }
      }
    } catch (error) {
      console.warn('URL検証エラー:', error);
    }
  }

  // エラーハンドリングの強化
  function setupErrorHandling() {
    window.addEventListener('error', function(event) {
      // Git関連情報をエラーメッセージから除去（ログ出力側でマスク）
      if (SecurityConfig.hideGitInfo && event.message) {
        const maskedMessage = event.message
          .replace(/github\.io/gi, 'app-host')
          .replace(/github\.com/gi, 'code-host')
          .replace(/yukimaru/gi, 'dev-team');
        
        // ログ出力のみ変更、イベント自体は変更しない
        console.error('マスクされたエラー:', maskedMessage);
      }
      
      // 本番環境では詳細なエラー情報を隠蔽
      if (SecurityConfig.hideDebugInfo && !window.location.hostname.includes('localhost')) {
        console.error('アプリケーションエラーが発生しました');
        event.preventDefault();
      }
    });

    // Promise rejection の処理
    window.addEventListener('unhandledrejection', function(event) {
      if (SecurityConfig.hideDebugInfo && !window.location.hostname.includes('localhost')) {
        console.error('ネットワークエラーが発生しました');
        event.preventDefault();
      }
    });
  }

  // 公開API（必要なAPIのみ公開、Object.freezeで固定）
  const publicAPI = {
    escapeHtml: escapeHtml,
    safeSetInnerHTML: safeSetInnerHTML,
    getSafeUrlParam: getSafeUrlParam,
    
    // 設定変更
    configure: function(config) {
      Object.assign(SecurityConfig, config);
    },
    
    // コピー防止の有効/無効切り替え
    toggleCopyProtection: function(enable) {
      SecurityConfig.preventCopy = enable;
      if (enable) {
        setupCopyProtection();
      }
    }
  };

  // APIを固定化
  Object.freeze(publicAPI);
  window.Security = publicAPI;

  // 初期化
  function initSecurity() {
    console.log('🔒 セキュリティシステム初期化中...');
    
    // コピー防止を最優先で設定（CSP前に実行）
    setupCopyProtection();
    
    // Studio埋め込み互換性のため、既存CSP設定は無効化
    // setupCSP(); // 既存設定との競合回避のため無効化
    setupStudioCompatibleCSP(); // 新規Studio互換CSP設定
    
    // Studio互換セキュリティヘッダー設定を有効化
    setupSecurityHeaders(); // Studio埋め込み互換版
    
    hideGitInfo();
    limitDevToolsAccess();
    validateCurrentUrl();
    setupErrorHandling();
    
    console.log('✅ セキュリティシステム初期化完了（Studio埋め込み互換）');
  }

  // DOM読み込み完了後に初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSecurity);
  } else {
    initSecurity();
  }
})(); 