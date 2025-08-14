// ドメインマスキング・Git情報完全隠蔽ライブラリ
(function() {
  'use strict';

  // ドメインマスキング設定
  const DomainMaskingConfig = {
    // 代替ドメイン設定
    alternativeDomains: [
      'student-id.app',
      's-id.app', 
      'school-card.net',
      'gakusei-id.com',
      'card-gen.app'
    ],
    // 現在のインデックス
    currentDomainIndex: 0,
    // GitHub情報隠蔽
    hideGitInfo: true,
    // URLパラメータ暗号化
    encryptParams: true
  };

  // 簡易Base64エンコード（URL安全版）
  function safeBase64Encode(str) {
    try {
      return btoa(encodeURIComponent(str))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    } catch (e) {
      return str;
    }
  }

  // 簡易Base64デコード（URL安全版）
  function safeBase64Decode(str) {
    try {
      str = str.replace(/-/g, '+').replace(/_/g, '/');
      // パディング追加
      while (str.length % 4) {
        str += '=';
      }
      return decodeURIComponent(atob(str));
    } catch (e) {
      return str;
    }
  }

  // URLパラメータの暗号化
  function encryptParams(params) {
    if (!DomainMaskingConfig.encryptParams) return params;
    
    const encrypted = {};
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        // パラメータ値を暗号化
        encrypted[key] = safeBase64Encode(value);
      }
    }
    return encrypted;
  }

  // URLパラメータの復号化
  function decryptParams(params) {
    if (!DomainMaskingConfig.encryptParams) return params;
    
    const decrypted = {};
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        // パラメータ値を復号化
        decrypted[key] = safeBase64Decode(value);
      }
    }
    return decrypted;
  }

  // 代替ドメインの生成
  function generateAlternativeDomain() {
    const domains = DomainMaskingConfig.alternativeDomains;
    const randomIndex = Math.floor(Math.random() * domains.length);
    return domains[randomIndex];
  }

  // 短縮URLの生成
  function generateShortUrl(originalUrl, params = {}) {
    try {
      // GitHub情報を含むURLの場合、マスキングを実行
      if (originalUrl.includes('github') || originalUrl.includes('yukimaru')) {
        console.log('🎭 GitHub情報をマスキング中...');
        
        // パラメータを暗号化
        const encryptedParams = encryptParams(params);
        
        // 代替ドメインを使用
        const altDomain = generateAlternativeDomain();
        
        // 短縮URLを構築
        const shortUrl = new URL(`https://${altDomain}/s`);
        
        // 暗号化されたパラメータを追加
        Object.entries(encryptedParams).forEach(([key, value]) => {
          if (value) shortUrl.searchParams.set(key, value);
        });
        
        return shortUrl.toString();
      }
      
      // GitHub情報が含まれていない場合はそのまま返す
      return originalUrl;
      
    } catch (e) {
      console.warn('URL短縮エラー:', e);
      return originalUrl;
    }
  }

  // 現在のページURLからGit情報を隠蔽
  function maskCurrentPageUrl() {
    if (!DomainMaskingConfig.hideGitInfo) return;

    const currentUrl = window.location.href;
    
    // GitHub関連の情報が含まれている場合
    if (currentUrl.includes('github') || currentUrl.includes('yukimaru')) {
      // URLバーの表示を変更（可能な範囲で）
      try {
        const maskedUrl = currentUrl
          .replace(/github\.io/gi, 'app-host.io')
          .replace(/github\.com/gi, 'code-host.com')
          .replace(/yukimaru/gi, 'dev-team');
        
        // history.replaceState を使用してURLを変更（実際には変わらないが、表示上の効果）
        if (window.history && window.history.replaceState) {
          const cleanPath = window.location.pathname.replace(/.*\/([^\/]+\.html)$/, '/$1');
          window.history.replaceState(null, document.title, cleanPath);
        }
      } catch (e) {
        console.warn('URL変更エラー:', e);
      }
    }
  }

  // リンク要素のGit情報隠蔽
  function maskLinksOnPage() {
    const links = document.querySelectorAll('a[href*="github"], a[href*="yukimaru"]');
    
    links.forEach(link => {
      const originalHref = link.href;
      const maskedHref = originalHref
        .replace(/github\.io/gi, 'app-host.io')
        .replace(/github\.com/gi, 'code-host.com')
        .replace(/yukimaru/gi, 'dev-team');
      
      // 元のURLを data 属性に保存
      link.setAttribute('data-original-href', originalHref);
      link.href = maskedHref;
      
      console.log('🎭 リンクをマスキング:', originalHref, '->', maskedHref);
    });
  }

  // 開発者ツールでのGit情報隠蔽
  function maskDevToolsInfo() {
    // console.log の Git情報フィルタリング
    const originalLog = console.log;
    console.log = function(...args) {
      const filteredArgs = args.map(arg => {
        if (typeof arg === 'string') {
          return arg
            .replace(/github\.io/gi, 'app-host.io')
            .replace(/github\.com/gi, 'code-host.com')
            .replace(/yukimaru/gi, 'dev-team')
            .replace(/student-id-generator/gi, 'card-app');
        }
        return arg;
      });
      return originalLog.apply(this, filteredArgs);
    };

    // fetch リクエストの隠蔽
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      // リクエストURLにGit情報が含まれている場合は隠蔽
      if (typeof url === 'string' && (url.includes('github') || url.includes('yukimaru'))) {
        console.log('🔗 外部リクエスト実行中...');
      }
      return originalFetch.apply(this, arguments);
    };
  }

  // メタタグのGit情報隠蔽
  function maskMetaTags() {
    const metaTags = document.querySelectorAll('meta[property*="og:"], meta[name*="twitter:"]');
    
    metaTags.forEach(meta => {
      const content = meta.getAttribute('content');
      if (content && (content.includes('github') || content.includes('yukimaru'))) {
        const maskedContent = content
          .replace(/github\.io/gi, 'app-host.io')
          .replace(/yukimaru/gi, 'dev-team')
          .replace(/student-id-generator/gi, 'card-app');
        
        meta.setAttribute('content', maskedContent);
        console.log('🎭 メタタグをマスキング:', content, '->', maskedContent);
      }
    });
  }

  // ソースコード内のコメントからGit情報除去
  function maskSourceComments() {
    // スクリプトタグのコメント処理
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.textContent) {
        const maskedContent = script.textContent
          .replace(/github\.io/gi, 'app-host.io')
          .replace(/yukimaru/gi, 'dev-team')
          .replace(/student-id-generator/gi, 'card-app');
        
        if (maskedContent !== script.textContent) {
          script.textContent = maskedContent;
        }
      }
    });
  }

  // 公開API
  window.DomainMasking = {
    generateShortUrl: generateShortUrl,
    encryptParams: encryptParams,
    decryptParams: decryptParams,
    generateAlternativeDomain: generateAlternativeDomain,
    
    // 設定変更
    configure: function(config) {
      Object.assign(DomainMaskingConfig, config);
    },
    
    // 手動でマスキング実行
    maskAll: function() {
      maskCurrentPageUrl();
      maskLinksOnPage();
      maskMetaTags();
      maskSourceComments();
      console.log('🎭 全てのGit情報をマスキングしました');
    }
  };

  // 自動初期化
  function initDomainMasking() {
    console.log('🎭 ドメインマスキングシステム初期化中...');
    
    maskDevToolsInfo();
    
    // DOMContentLoaded後に実行
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          maskCurrentPageUrl();
          maskLinksOnPage();
          maskMetaTags();
          maskSourceComments();
        }, 100);
      });
    } else {
      setTimeout(() => {
        maskCurrentPageUrl();
        maskLinksOnPage();
        maskMetaTags();
        maskSourceComments();
      }, 100);
    }
    
    console.log('✅ ドメインマスキングシステム初期化完了');
  }

  // 即座に初期化
  initDomainMasking();

})(); 