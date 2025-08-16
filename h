[1mdiff --git a/public/assets/js/comprehensive-security.js b/public/assets/js/comprehensive-security.js[m
[1mindex 067fe88..1013202 100644[m
[1m--- a/public/assets/js/comprehensive-security.js[m
[1m+++ b/public/assets/js/comprehensive-security.js[m
[36m@@ -2,6 +2,9 @@[m
 (function() {[m
   'use strict';[m
 [m
[32m+[m[32m  // 埋め込みモードフラグ（embed-mode.jsで設定される）[m
[32m+[m[32m  const __ALLOW_EMBED__ = window.__ALLOW_EMBED__ || false;[m
[32m+[m
   // 高度なセキュリティ設定[m
   const AdvancedSecurityConfig = {[m
     // WebAssembly制限[m
[36m@@ -14,8 +17,8 @@[m
     preventPrototypePollution: true,[m
     // DOM Clobbering対策[m
     preventDomClobbering: true,[m
[31m-    // ClickJacking対策[m
[31m-    preventClickJacking: true,[m
[32m+[m[32m    // ClickJacking対策（埋め込み時は無効化）[m
[32m+[m[32m    preventClickJacking: !__ALLOW_EMBED__,[m
     // Side-Channel攻撃対策[m
     preventSideChannelAttacks: true,[m
     // CPU脆弱性対策[m
[36m@@ -205,13 +208,23 @@[m
   function preventClickJacking() {[m
     if (!AdvancedSecurityConfig.preventClickJacking) return;[m
 [m
[32m+[m[32m    // 埋め込みモード時はフレームバストを無効化[m
[32m+[m[32m    if (__ALLOW_EMBED__) {[m
[32m+[m[32m      console.log('🎬 埋め込みモード: ClickJacking対策をスキップ');[m
[32m+[m[32m      return;[m
[32m+[m[32m    }[m
[32m+[m
     // フレーム内で実行されているかチェック[m
     if (window.self !== window.top) {[m
       console.warn('🚫 フレーム内での実行を検出');[m
       [m
       // フレームから脱出を試行[m
       try {[m
[31m-        window.top.location = window.self.location;[m
[32m+[m[32m        if (!__ALLOW_EMBED__) {[m
[32m+[m[32m          window.top.location = window.self.location;[m
[32m+[m[32m        } else {[m
[32m+[m[32m          location.assign(window.self.location);[m
[32m+[m[32m        }[m
       } catch (e) {[m
         // 脱出に失敗した場合、ページを隠蔽[m
         document.body.style.display = 'none';[m
[1mdiff --git a/public/assets/js/embed-mode.js b/public/assets/js/embed-mode.js[m
[1mnew file mode 100644[m
[1mindex 0000000..af3ab04[m
[1m--- /dev/null[m
[1m+++ b/public/assets/js/embed-mode.js[m
[36m@@ -0,0 +1,222 @@[m
[32m+[m[32m// Studio埋め込み用 埋め込みモード制御スクリプト[m
[32m+[m[32m(function() {[m
[32m+[m[32m  'use strict';[m
[32m+[m
[32m+[m[32m  // 埋め込みモード検出[m
[32m+[m[32m  function detectEmbedMode() {[m
[32m+[m[32m    // URLパラメータで埋め込みモードを明示的に指定[m
[32m+[m[32m    const urlParams = new URLSearchParams(window.location.search);[m
[32m+[m[32m    const explicitEmbed = urlParams.get('embed') === '1';[m
[32m+[m[41m    [m
[32m+[m[32m    // リファラーでStudio環境を検出[m
[32m+[m[32m    const referrer = document.referrer;[m
[32m+[m[32m    const isStudioReferrer = referrer && ([m
[32m+[m[32m      referrer.includes('studio.site') ||[m[41m [m
[32m+[m[32m      referrer.includes('preview.studio.site')[m
[32m+[m[32m    );[m
[32m+[m[41m    [m
[32m+[m[32m    // 親ウィンドウの存在確認（埋め込みモード時は常にfalse）[m
[32m+[m[32m    const isInIframe = !__ALLOW_EMBED__ && window.self !== window.top;[m
[32m+[m[41m    [m
[32m+[m[32m    // 埋め込みモードの判定[m
[32m+[m[32m    const isEmbedMode = explicitEmbed || isStudioReferrer || isInIframe;[m
[32m+[m[41m    [m
[32m+[m[32m    console.log('🔍 埋め込みモード検出結果:', {[m
[32m+[m[32m      explicitEmbed,[m
[32m+[m[32m      isStudioReferrer,[m
[32m+[m[32m      isInIframe,[m
[32m+[m[32m      isEmbedMode,[m
[32m+[m[32m      referrer[m
[32m+[m[32m    });[m
[32m+[m[41m    [m
[32m+[m[32m    return isEmbedMode;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  // 埋め込みモード用の設定[m
[32m+[m[32m  function configureEmbedMode() {[m
[32m+[m[32m    const isEmbedMode = detectEmbedMode();[m
[32m+[m[41m    [m
[32m+[m[32m    if (isEmbedMode) {[m
[32m+[m[32m      console.log('🎬 埋め込みモードを有効化');[m
[32m+[m[41m      [m
[32m+[m[32m      // グローバルフラグを設定[m
[32m+[m[32m      window.__ALLOW_EMBED__ = true;[m
[32m+[m[41m      [m
[32m+[m[32m      // セキュリティ設定を調整[m
[32m+[m[32m      if (window.AdvancedSecurity) {[m
[32m+[m[32m        window.AdvancedSecurity.configure({[m
[32m+[m[32m          preventClickJacking: false // 埋め込み時はClickJacking対策を無効化[m
[32m+[m[32m        });[m
[32m+[m[32m      }[m
[32m+[m[41m      [m
[32m+[m[32m      // フレームバストを無効化[m
[32m+[m[32m      disableFrameBusting();[m
[32m+[m[41m      [m
[32m+[m[32m      // 内部ナビゲーションをiframe内に制限[m
[32m+[m[32m      configureInternalNavigation();[m
[32m+[m[41m      [m
[32m+[m[32m      // 外部リンクを新しいタブで開く[m
[32m+[m[32m      configureExternalLinks();[m
[32m+[m[41m      [m
[32m+[m[32m      // 埋め込みモード用のスタイル調整[m
[32m+[m[32m      adjustEmbedStyles();[m
[32m+[m[41m      [m
[32m+[m[32m    } else {[m
[32m+[m[32m      console.log('🌐 通常モード（埋め込みモード無効）');[m
[32m+[m[32m      window.__ALLOW_EMBED__ = false;[m
[32m+[m[32m    }[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  // フレームバストを無効化[m
[32m+[m[32m  function disableFrameBusting() {[m
[32m+[m[32m    // window.self !== window.top のチェックを無効化[m
[32m+[m[32m    const originalSelf = window.self;[m
[32m+[m[32m    const originalTop = window.top;[m
[32m+[m[41m    [m
[32m+[m[32m    // 安全な方法でフレームバストを無効化[m
[32m+[m[32m    Object.defineProperty(window, 'self', {[m
[32m+[m[32m      get: function() {[m
[32m+[m[32m        return originalSelf;[m
[32m+[m[32m      },[m
[32m+[m[32m      configurable: false[m
[32m+[m[32m    });[m
[32m+[m[41m    [m
[32m+[m[32m    Object.defineProperty(window, 'top', {[m
[32m+[m[32m      get: function() {[m
[32m+[m[32m        return originalTop;[m
[32m+[m[32m      },[m
[32m+[m[32m      configurable: false[m
[32m+[m[32m    });[m
[32m+[m[41m    [m
[32m+[m[32m    console.log('🚫 フレームバストを無効化しました');[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  // 内部ナビゲーションをiframe内に制限[m
[32m+[m[32m  function configureInternalNavigation() {[m
[32m+[m[32m    // リンククリックイベントを監視[m
[32m+[m[32m    document.addEventListener('click', function(event) {[m
[32m+[m[32m      const target = event.target.closest('a');[m
[32m+[m[32m      if (!target) return;[m
[32m+[m[41m      [m
[32m+[m[32m      const href = target.getAttribute('href');[m
[32m+[m[32m      if (!href) return;[m
[32m+[m[41m      [m
[32m+[m[32m      // 内部リンクかどうかを判定[m
[32m+[m[32m      const isInternalLink = isInternalNavigation(href);[m
[32m+[m[41m      [m
[32m+[m[32m      if (isInternalLink) {[m
[32m+[m[32m        // 内部リンクはiframe内で遷移[m
[32m+[m[32m        event.preventDefault();[m
[32m+[m[41m        [m
[32m+[m[32m        // embedパラメータを追加[m
[32m+[m[32m        const url = new URL(href, window.location.href);[m
[32m+[m[32m        if (!url.searchParams.has('embed')) {[m
[32m+[m[32m          url.searchParams.set('embed', '1');[m
[32m+[m[32m        }[m
[32m+[m[41m        [m
[32m+[m[32m        // 現在のフレーム内で遷移[m
[32m+[m[32m        window.location.assign(url.toString());[m
[32m+[m[41m        [m
[32m+[m[32m        console.log('🔗 内部リンクをiframe内で遷移:', url.toString());[m
[32m+[m[32m      } else {[m
[32m+[m[32m        // 外部リンクは新しいタブで開く[m
[32m+[m[32m        event.preventDefault();[m
[32m+[m[32m        target.setAttribute('target', '_blank');[m
[32m+[m[32m        target.setAttribute('rel', 'noopener noreferrer');[m
[32m+[m[41m        [m
[32m+[m[32m        // 新しいタブで開く[m
[32m+[m[32m        window.open(href, '_blank', 'noopener,noreferrer');[m
[32m+[m[41m        [m
[32m+[m[32m        console.log('🌐 外部リンクを新しいタブで開く:', href);[m
[32m+[m[32m      }[m
[32m+[m[32m    });[m
[32m+[m[41m    [m
[32m+[m[32m    console.log('🔗 内部ナビゲーション制御を設定しました');[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  // 内部ナビゲーションかどうかを判定[m
[32m+[m[32m  function isInternalNavigation(href) {[m
[32m+[m[32m    // 現在のドメインと同じかどうか[m
[32m+[m[32m    const currentDomain = window.location.hostname;[m
[32m+[m[32m    const currentProtocol = window.location.protocol;[m
[32m+[m[41m    [m
[32m+[m[32m    // 相対パス[m
[32m+[m[32m    if (href.startsWith('./') || href.startsWith('/') || href.startsWith('#')) {[m
[32m+[m[32m      return true;[m
[32m+[m[32m    }[m
[32m+[m[41m    [m
[32m+[m[32m    // 同じドメイン[m
[32m+[m[32m    if (href.startsWith(currentProtocol + '//' + currentDomain)) {[m
[32m+[m[32m      return true;[m
[32m+[m[32m    }[m
[32m+[m[41m    [m
[32m+[m[32m    // 同じドメイン（プロトコル省略）[m
[32m+[m[32m    if (href.startsWith('//' + currentDomain)) {[m
[32m+[m[32m      return true;[m
[32m+[m[32m    }[m
[32m+[m[41m    [m
[32m+[m[32m    // 同じドメイン（ドメインのみ）[m
[32m+[m[32m    if (href.startsWith(currentDomain)) {[m
[32m+[m[32m      return true;[m
[32m+[m[32m    }[m
[32m+[m[41m    [m
[32m+[m[32m    // ファイル拡張子がHTML系[m
[32m+[m[32m    if (href.match(/\.(html|htm)$/i)) {[m
[32m+[m[32m      return true;[m
[32m+[m[32m    }[m
[32m+[m[41m    [m
[32m+[m[32m    return false;[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  // 外部リンクの設定[m
[32m+[m[32m  function configureExternalLinks() {[m
[32m+[m[32m    // 既存の外部リンクにtarget="_blank"を追加[m
[32m+[m[32m    const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="' + window.location.hostname + '"])');[m
[32m+[m[32m    externalLinks.forEach(link => {[m
[32m+[m[32m      link.setAttribute('target', '_blank');[m
[32m+[m[32m      link.setAttribute('rel', 'noopener noreferrer');[m
[32m+[m[32m    });[m
[32m+[m[41m    [m
[32m+[m[32m    console.log('🌐 外部リンク設定を完了しました');[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  // 埋め込みモード用のスタイル調整[m
[32m+[m[32m  function adjustEmbedStyles() {[m
[32m+[m[32m    // 埋め込みモード用のCSSクラスを追加[m
[32m+[m[32m    document.documentElement.classList.add('embed-mode');[m
[32m+[m[32m    document.body.classList.add('embed-mode');[m
[32m+[m[41m    [m
[32m+[m[32m    // 埋め込みモード用のスタイルを動的に追加[m
[32m+[m[32m    const style = document.createElement('style');[m
[32m+[m[32m    style.textContent = `[m
[32m+[m[32m      .embed-mode {[m
[32m+[m[32m        /* 埋め込みモード用のスタイル調整 */[m
[32m+[m[32m      }[m
[32m+[m[41m      [m
[32m+[m[32m      .embed-mode .no-embed {[m
[32m+[m[32m        display: none !important;[m
[32m+[m[32m      }[m
[32m+[m[32m    `;[m
[32m+[m[32m    document.head.appendChild(style);[m
[32m+[m[41m    [m
[32m+[m[32m    console.log('🎨 埋め込みモード用スタイルを適用しました');[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  // 初期化[m
[32m+[m[32m  function initEmbedMode() {[m
[32m+[m[32m    console.log('🎬 埋め込みモード制御システム初期化中...');[m
[32m+[m[41m    [m
[32m+[m[32m    // DOMContentLoadedを待ってから設定[m
[32m+[m[32m    if (document.readyState === 'loading') {[m
[32m+[m[32m      document.addEventListener('DOMContentLoaded', configureEmbedMode);[m
[32m+[m[32m    } else {[m
[32m+[m[32m      configureEmbedMode();[m
[32m+[m[32m    }[m
[32m+[m[41m    [m
[32m+[m[32m    console.log('✅ 埋め込みモード制御システム初期化完了');[m
[32m+[m[32m  }[m
[32m+[m
[32m+[m[32m  // 即座に初期化[m
[32m+[m[32m  initEmbedMode();[m
[32m+[m
[32m+[m[32m})();[m
[1mdiff --git a/public/generator.html b/public/generator.html[m
[1mindex 94fceaf..e729923 100644[m
[1m--- a/public/generator.html[m
[1m+++ b/public/generator.html[m
[36m@@ -346,5 +346,8 @@[m
       }[m
     });[m
   </script>[m
[32m+[m[41m  [m
[32m+[m[32m  <!-- 埋め込みモード制御スクリプト -->[m
[32m+[m[32m  <script src="assets/js/embed-mode.js"></script>[m
 </body>[m
 </html> [m
\ No newline at end of file[m
[1mdiff --git a/public/index.html b/public/index.html[m
[1mindex 71ebd91..37875a3 100644[m
[1m--- a/public/index.html[m
[1m+++ b/public/index.html[m
[36m@@ -1591,5 +1591,8 @@[m
 [m
 [m
   </script>[m
[32m+[m[41m  [m
[32m+[m[32m  <!-- 埋め込みモード制御スクリプト -->[m
[32m+[m[32m  <script src="assets/js/embed-mode.js"></script>[m
 </body>[m
 </html> [m
\ No newline at end of file[m
[1mdiff --git a/public/quiz.html b/public/quiz.html[m
[1mindex d312df8..232c632 100644[m
[1m--- a/public/quiz.html[m
[1m+++ b/public/quiz.html[m
[36m@@ -1128,5 +1128,8 @@[m
       }[m
     }, 1000);[m
   </script>[m
[32m+[m[41m  [m
[32m+[m[32m  <!-- 埋め込みモード制御スクリプト -->[m
[32m+[m[32m  <script src="assets/js/embed-mode.js"></script>[m
 </body>[m
 </html> [m
\ No newline at end of file[m
