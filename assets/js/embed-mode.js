(() => {
  'use strict';
  
  // 埋め込みモード判定
  const isEmbed = (() => {
    // iframe/Studio/?embed=1 のいずれかで判定
    if (window.parent !== window || window.top !== window || window.frameElement) {
      return true;
    }
    
    // URLにembed=1がある場合
    if (new URLSearchParams(location.search).has('embed')) {
      return true;
    }
    
    // Studio環境の検出
    if (location.hostname.includes('studio') || location.href.includes('studio')) {
      return true;
    }
    
    // referrerでStudio環境を検出
    if (document.referrer && document.referrer.includes('studio')) {
      return true;
    }
    
    return false;
  })();
  
  if (!isEmbed) return;
  
  console.log('🎬 埋め込みモード検出 - embed-mode.js 起動');
  
  // 現在URLにembed=1が無い場合、history.replaceStateで付与
  if (!new URLSearchParams(location.search).has('embed')) {
    const url = new URL(location.href);
    url.searchParams.set('embed', '1');
    history.replaceState(null, '', url.toString());
    console.log('🔗 URLにembed=1を付与:', url.toString());
  }
  
  // 同一オリジン判定
  const isInternal = (href) => {
    try {
      const url = new URL(href, location.href);
      return url.origin === location.origin && url.pathname.endsWith('.html');
    } catch {
      return false;
    }
  };
  
  // クリック捕捉で同一オリジン *.html へのリンクに embed=1 を付与
  document.addEventListener('click', (e) => {
    const target = e.target.closest('a, button[data-href], button[onclick]');
    if (!target) return;
    
    let href = null;
    
    // リンク要素の場合
    if (target.tagName === 'A') {
      href = target.getAttribute('href');
    }
    // data-href属性の場合
    else if (target.dataset.href) {
      href = target.dataset.href;
    }
    // onclick属性の場合（文字列として解析）
    else if (target.onclick && typeof target.onclick === 'string') {
      const onclickMatch = target.onclick.match(/['"`]([^'"`]*\.html[^'"`]*)['"`]/);
      if (onclickMatch) {
        href = onclickMatch[1];
      }
    }
    
    if (href && isInternal(href)) {
      e.preventDefault();
      const url = new URL(href, location.href);
      url.searchParams.set('embed', '1');
      console.log('🔗 埋め込みリンク遷移:', url.toString());
      location.assign(url.toString());
    }
  }, { capture: true });
  
  // location.assign/replace をラップして、同一オリジンの *.html に embed=1 を注入
  const originalAssign = location.assign;
  const originalReplace = location.replace;
  
  location.assign = function(url) {
    if (typeof url === 'string' && isInternal(url)) {
      const newUrl = new URL(url, location.href);
      newUrl.searchParams.set('embed', '1');
      console.log('🔗 location.assign で埋め込み遷移:', newUrl.toString());
      return originalAssign.call(this, newUrl.toString());
    }
    return originalAssign.call(this, url);
  };
  
  location.replace = function(url) {
    if (typeof url === 'string' && isInternal(url)) {
      const newUrl = new URL(url, location.href);
      newUrl.searchParams.set('embed', '1');
      console.log('🔗 location.replace で埋め込み遷移:', newUrl.toString());
      return originalReplace.call(this, newUrl.toString());
    }
    return originalReplace.call(this, url);
  };
  
  // window.location.href の設定も監視
  let originalHrefDescriptor = Object.getOwnPropertyDescriptor(location, 'href');
  if (!originalHrefDescriptor) {
    originalHrefDescriptor = {
      get: function() { return location.href; },
      set: function(value) { location.assign(value); }
    };
  }
  
  Object.defineProperty(location, 'href', {
    get: originalHrefDescriptor.get,
    set: function(value) {
      if (typeof value === 'string' && isInternal(value)) {
        const newUrl = new URL(value, location.href);
        newUrl.searchParams.set('embed', '1');
        console.log('🔗 location.href で埋め込み遷移:', newUrl.toString());
        return originalHrefDescriptor.set.call(this, newUrl.toString());
      }
      return originalHrefDescriptor.set.call(this, value);
    },
    configurable: true
  });
  
  // 動的に生成されるリンクやボタンにも対応
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // 新しく追加された要素内のリンクやボタンを確認
          const links = node.querySelectorAll ? node.querySelectorAll('a, button[data-href]') : [];
          links.forEach(link => {
            if (link.tagName === 'A') {
              const href = link.getAttribute('href');
              if (href && isInternal(href)) {
                link.addEventListener('click', (e) => {
                  e.preventDefault();
                  const url = new URL(href, location.href);
                  url.searchParams.set('embed', '1');
                  console.log('🔗 動的リンクで埋め込み遷移:', url.toString());
                  location.assign(url.toString());
                });
              }
            }
          });
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('✅ embed-mode.js 初期化完了');
})();
