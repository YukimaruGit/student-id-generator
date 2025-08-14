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
    hideDebugInfo: true
  };

  // XSS対策: HTMLエスケープ関数
  function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 安全なinnerHTML設定
  function safeSetInnerHTML(element, htmlString) {
    if (!element) return;
    
    // 基本的なサニタイゼーション
    const sanitized = htmlString
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // script除去
      .replace(/javascript:/gi, '') // javascript: プロトコル除去
      .replace(/on\w+\s*=/gi, ''); // イベントハンドラ除去
    
    element.innerHTML = sanitized;
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

  // Git情報隠蔽
  function hideGitInfo() {
    if (!SecurityConfig.hideGitInfo) return;

    // コンソールメッセージの改変
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

    // UserAgent情報の隠蔽
    if (navigator.userAgent && SecurityConfig.hideDebugInfo) {
      Object.defineProperty(navigator, 'userAgent', {
        get: function() { return 'SecureApp/1.0'; },
        configurable: false
      });
    }
  }

  // CSP設定
  function setupCSP() {
    if (!SecurityConfig.enableCSP) return;

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
      "connect-src 'self' https://api.cloudinary.com",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'"
    ].join('; ');
    
    if (document.head) {
      document.head.appendChild(meta);
    }
  }

  // セキュリティヘッダー設定
  function setupSecurityHeaders() {
    // X-Content-Type-Options
    const noSniff = document.createElement('meta');
    noSniff.httpEquiv = 'X-Content-Type-Options';
    noSniff.content = 'nosniff';
    
    // X-Frame-Options
    const frameOptions = document.createElement('meta');
    frameOptions.httpEquiv = 'X-Frame-Options';
    frameOptions.content = 'DENY';
    
    // Referrer Policy
    const referrerPolicy = document.createElement('meta');
    referrerPolicy.name = 'referrer';
    referrerPolicy.content = 'strict-origin-when-cross-origin';

    if (document.head) {
      document.head.appendChild(noSniff);
      document.head.appendChild(frameOptions);
      document.head.appendChild(referrerPolicy);
    }
  }

  // 開発者ツールの検出と制限
  function limitDevToolsAccess() {
    if (!SecurityConfig.limitConsoleAccess) return;

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

  // URLの安全性チェック
  function validateCurrentUrl() {
    const currentUrl = window.location.href;
    
    // 危険なパラメータのチェック
    const dangerousParams = ['eval', 'script', 'javascript', 'vbscript', 'data'];
    dangerousParams.forEach(param => {
      if (currentUrl.toLowerCase().includes(param + ':')) {
        console.warn('🚨 危険なURLパラメータが検出されました');
        window.location.href = window.location.pathname; // クエリ文字列をクリア
      }
    });
  }

  // ドメイン情報の隠蔽
  function hideDomainInfo() {
    // location.origin の改変
    if (SecurityConfig.hideGitInfo) {
      const originalOrigin = window.location.origin;
      
      Object.defineProperty(window.location, 'hostname', {
        get: function() { 
          return originalOrigin.includes('github') ? 'secure-app.local' : window.location.hostname;
        },
        configurable: false
      });
    }
  }

  // エラーハンドリングの強化
  function setupErrorHandling() {
    window.addEventListener('error', function(event) {
      // Git関連情報をエラーメッセージから除去
      if (SecurityConfig.hideGitInfo && event.message) {
        event.message = event.message
          .replace(/github\.io/gi, 'app-host')
          .replace(/github\.com/gi, 'code-host')
          .replace(/yukimaru/gi, 'dev-team');
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

  // 公開API
  window.Security = {
    escapeHtml: escapeHtml,
    safeSetInnerHTML: safeSetInnerHTML,
    getSafeUrlParam: getSafeUrlParam,
    
    // 設定変更
    configure: function(config) {
      Object.assign(SecurityConfig, config);
    }
  };

  // 初期化
  function initSecurity() {
    console.log('🔒 セキュリティシステム初期化中...');
    
    setupCSP();
    setupSecurityHeaders();
    hideGitInfo();
    limitDevToolsAccess();
    validateCurrentUrl();
    hideDomainInfo();
    setupErrorHandling();
    
    console.log('✅ セキュリティシステム初期化完了');
  }

  // DOM読み込み完了後に初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSecurity);
  } else {
    initSecurity();
  }
})(); 