// 包括的セキュリティ対策ライブラリ
(function() {
  'use strict';

  // 高度なセキュリティ設定
  const AdvancedSecurityConfig = {
    // WebAssembly制限
    blockWasm: true,
    // メモリ攻撃対策
    preventMemoryAttacks: true,
    // タイミング攻撃対策
    preventTimingAttacks: true,
    // プロトタイプ汚染対策
    preventPrototypePollution: true,
    // DOM Clobbering対策
    preventDomClobbering: true,
    // ClickJacking対策
    preventClickJacking: true,
    // Side-Channel攻撃対策
    preventSideChannelAttacks: true,
    // CPU脆弱性対策
    preventSpeculativeExecution: true
  };

  // WebAssembly制限
  function blockWebAssembly() {
    if (!AdvancedSecurityConfig.blockWasm) return;

    // WebAssembly無効化
    if (window.WebAssembly) {
      window.WebAssembly = undefined;
      delete window.WebAssembly;
      console.log('🚫 WebAssemblyをブロックしました');
    }

    // Worker内でのWebAssembly制限
    const originalWorker = window.Worker;
    if (originalWorker) {
      window.Worker = function(scriptURL, options) {
        console.warn('🚫 Worker作成を制限しました');
        throw new Error('Worker creation blocked for security');
      };
    }

    // SharedArrayBuffer無効化
    if (window.SharedArrayBuffer) {
      window.SharedArrayBuffer = undefined;
      delete window.SharedArrayBuffer;
      console.log('🚫 SharedArrayBufferをブロックしました');
    }
  }

  // メモリ攻撃対策
  function preventMemoryAttacks() {
    if (!AdvancedSecurityConfig.preventMemoryAttacks) return;

    // ArrayBuffer制限
    const originalArrayBuffer = window.ArrayBuffer;
    if (originalArrayBuffer) {
      window.ArrayBuffer = function(length) {
        // 異常に大きなバッファをブロック
        if (length > 100 * 1024 * 1024) { // 100MB制限
          console.warn('🚫 大きすぎるArrayBufferをブロック:', length);
          throw new Error('ArrayBuffer size limit exceeded');
        }
        return new originalArrayBuffer(length);
      };
      Object.setPrototypeOf(window.ArrayBuffer, originalArrayBuffer);
      window.ArrayBuffer.prototype = originalArrayBuffer.prototype;
    }

    // Blob制限
    const originalBlob = window.Blob;
    if (originalBlob) {
      window.Blob = function(array, options) {
        if (array && array.length > 0) {
          const totalSize = array.reduce((size, item) => {
            if (typeof item === 'string') return size + item.length;
            if (item instanceof ArrayBuffer) return size + item.byteLength;
            return size;
          }, 0);
          
          if (totalSize > 50 * 1024 * 1024) { // 50MB制限
            console.warn('🚫 大きすぎるBlobをブロック:', totalSize);
            throw new Error('Blob size limit exceeded');
          }
        }
        return new originalBlob(array, options);
      };
      Object.setPrototypeOf(window.Blob, originalBlob);
      window.Blob.prototype = originalBlob.prototype;
    }
  }

  // タイミング攻撃対策
  function preventTimingAttacks() {
    if (!AdvancedSecurityConfig.preventTimingAttacks) return;

    // performance.now()の精度制限
    const originalNow = performance.now;
    performance.now = function() {
      const time = originalNow.call(this);
      // マイクロ秒精度を削減（ミリ秒単位に丸める）
      return Math.floor(time);
    };

    // Date.now()の精度制限
    const originalDateNow = Date.now;
    Date.now = function() {
      const time = originalDateNow.call(this);
      // 100ms単位に丸める
      return Math.floor(time / 100) * 100;
    };

    // console.timeの制限
    const originalTime = console.time;
    const originalTimeEnd = console.timeEnd;
    
    console.time = function() {
      // タイミング測定を無効化
      console.log('⏰ タイミング測定は無効化されています');
    };
    
    console.timeEnd = function() {
      console.log('⏰ タイミング測定は無効化されています');
    };
  }

  // プロトタイプ汚染対策
  function preventPrototypePollution() {
    if (!AdvancedSecurityConfig.preventPrototypePollution) return;

    // Object.prototype の保護
    const sensitiveKeys = ['__proto__', 'constructor', 'prototype'];
    
    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function(obj, prop, descriptor) {
      if (typeof prop === 'string' && sensitiveKeys.includes(prop.toLowerCase())) {
        console.warn('🚫 プロトタイプ汚染の試行をブロック:', prop);
        throw new Error('Prototype pollution attempt blocked');
      }
      return originalDefineProperty.call(this, obj, prop, descriptor);
    };

    // JSON.parse の保護
    const originalJSONParse = JSON.parse;
    JSON.parse = function(text, reviver) {
      try {
        const result = originalJSONParse.call(this, text, reviver);
        
        // 危険なプロパティをチェック
        function checkObject(obj, path = '') {
          if (obj && typeof obj === 'object') {
            for (const key in obj) {
              if (sensitiveKeys.includes(key.toLowerCase())) {
                console.warn('🚫 JSON内の危険なプロパティを削除:', path + key);
                delete obj[key];
                continue;
              }
              checkObject(obj[key], path + key + '.');
            }
          }
        }
        
        checkObject(result);
        return result;
      } catch (e) {
        console.warn('🚫 不正なJSONをブロック');
        throw e;
      }
    };
  }

  // DOM Clobbering対策
  function preventDomClobbering() {
    if (!AdvancedSecurityConfig.preventDomClobbering) return;

    // createElement の監視
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
      const element = originalCreateElement.call(this, tagName);
      
      // 危険な属性の設定を監視
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name, value) {
        if (typeof name === 'string') {
          const lowerName = name.toLowerCase();
          if (lowerName === 'id' || lowerName === 'name') {
            // グローバル変数と衝突する可能性のある名前をチェック
            const dangerousNames = ['window', 'document', 'location', 'navigator', 'console', 'alert', 'confirm'];
            if (dangerousNames.includes(value.toLowerCase())) {
              console.warn('🚫 DOM Clobberingの試行をブロック:', name, value);
              return;
            }
          }
        }
        return originalSetAttribute.call(this, name, value);
      };
      
      return element;
    };
  }

  // ClickJacking対策
  function preventClickJacking() {
    if (!AdvancedSecurityConfig.preventClickJacking) return;

    // フレーム内で実行されているかチェック
    if (window.self !== window.top) {
      console.warn('🚫 フレーム内での実行を検出');
      
      // フレームから脱出を試行
      try {
        window.top.location = window.self.location;
      } catch (e) {
        // 脱出に失敗した場合、ページを隠蔽
        document.body.style.display = 'none';
        document.head.innerHTML = '<title>Security Error</title>';
        document.body.innerHTML = '<h1 style="color: red;">セキュリティエラー: 不正なフレーム内実行が検出されました</h1>';
      }
    }

    // pointer-events の監視
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (type === 'click' || type === 'mousedown' || type === 'mouseup') {
        // クリックイベントの監視を強化
        const wrappedListener = function(event) {
          // 疑わしいクリック座標をチェック
          if (event.clientX < 0 || event.clientY < 0 || 
              event.clientX > window.innerWidth || event.clientY > window.innerHeight) {
            console.warn('🚫 疑わしいクリック座標:', event.clientX, event.clientY);
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          
          if (typeof listener === 'function') {
            return listener.call(this, event);
          }
        };
        
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      
      return originalAddEventListener.call(this, type, listener, options);
    };
  }

  // Side-Channel攻撃対策
  function preventSideChannelAttacks() {
    if (!AdvancedSecurityConfig.preventSideChannelAttacks) return;

    // Canvas fingerprinting 対策強化
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function(sx, sy, sw, sh) {
      const imageData = originalGetImageData.call(this, sx, sy, sw, sh);
      
      // ランダムノイズを追加
      if (imageData && imageData.data) {
        for (let i = 0; i < imageData.data.length; i += 4) {
          // アルファチャンネル以外にわずかなノイズ
          if (Math.random() < 0.1) { // 10%の確率でノイズ追加
            imageData.data[i] = Math.max(0, Math.min(255, imageData.data[i] + (Math.random() - 0.5) * 2));
            imageData.data[i + 1] = Math.max(0, Math.min(255, imageData.data[i + 1] + (Math.random() - 0.5) * 2));
            imageData.data[i + 2] = Math.max(0, Math.min(255, imageData.data[i + 2] + (Math.random() - 0.5) * 2));
          }
        }
      }
      
      return imageData;
    };

    // Battery API 無効化
    if (navigator.getBattery) {
      navigator.getBattery = function() {
        return Promise.reject(new Error('Battery API blocked for privacy'));
      };
    }

    // Gamepad API 制限
    if (navigator.getGamepads) {
      navigator.getGamepads = function() {
        console.log('🚫 Gamepad API アクセスをブロック');
        return [];
      };
    }
  }

  // CPU脆弱性対策（Spectre/Meltdown対策）
  function preventSpeculativeExecution() {
    if (!AdvancedSecurityConfig.preventSpeculativeExecution) return;

    // 高精度タイマーの無効化
    if (window.performance && window.performance.measureUserAgentSpecificMemory) {
      window.performance.measureUserAgentSpecificMemory = function() {
        return Promise.reject(new Error('Memory measurement blocked for security'));
      };
    }

    // メモリ情報の制限
    if (window.performance && window.performance.memory) {
      // メモリ情報を固定値で置き換え
      Object.defineProperty(window.performance, 'memory', {
        get: function() {
          return {
            totalJSHeapSize: 10000000,
            usedJSHeapSize: 5000000,
            jsHeapSizeLimit: 20000000
          };
        },
        configurable: false
      });
    }

    // requestIdleCallback の制限
    if (window.requestIdleCallback) {
      const originalRequestIdleCallback = window.requestIdleCallback;
      window.requestIdleCallback = function(callback, options) {
        // コールバックを遅延実行してタイミング攻撃を困難にする
        const wrappedCallback = function(deadline) {
          setTimeout(() => {
            callback({
              didTimeout: false,
              timeRemaining: () => Math.floor(Math.random() * 10) + 1
            });
          }, Math.floor(Math.random() * 100) + 50);
        };
        
        return originalRequestIdleCallback.call(this, wrappedCallback, options);
      };
    }
  }

  // URL検証強化
  function enhanceUrlValidation() {
    // URL constructor の監視
    const originalURL = window.URL;
    window.URL = function(url, base) {
      const urlObj = new originalURL(url, base);
      
      // 危険なプロトコルをブロック
      const dangerousProtocols = [
        'javascript:', 'data:', 'vbscript:', 'file:', 'ftp:',
        'jar:', 'view-source:', 'resource:', 'chrome:', 'moz-extension:'
      ];
      
      if (dangerousProtocols.some(protocol => urlObj.protocol.toLowerCase().startsWith(protocol))) {
        console.warn('🚫 危険なプロトコルをブロック:', urlObj.protocol);
        throw new Error('Dangerous protocol blocked');
      }
      
      // 異常に長いURLをブロック
      if (urlObj.href.length > 2048) {
        console.warn('🚫 異常に長いURLをブロック:', urlObj.href.length);
        throw new Error('URL too long');
      }
      
      return urlObj;
    };
    
    // 元のプロトタイプを維持
    window.URL.prototype = originalURL.prototype;
    window.URL.createObjectURL = originalURL.createObjectURL;
    window.URL.revokeObjectURL = originalURL.revokeObjectURL;
  }

  // リソース制限
  function enforceResourceLimits() {
    let resourceCount = 0;
    const MAX_RESOURCES = 1000;

    // 画像読み込み制限
    const originalImage = window.Image;
    window.Image = function() {
      if (++resourceCount > MAX_RESOURCES) {
        console.warn('🚫 リソース制限に達しました');
        throw new Error('Resource limit exceeded');
      }
      
      const img = new originalImage();
      
      // ロード後にカウントを減らす
      img.onload = img.onerror = function() {
        resourceCount--;
      };
      
      return img;
    };

    // script要素の制限
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
      if (tagName.toLowerCase() === 'script') {
        if (++resourceCount > MAX_RESOURCES / 10) { // script要素はより厳しく制限
          console.warn('🚫 スクリプト要素制限に達しました');
          throw new Error('Script element limit exceeded');
        }
      }
      
      return originalCreateElement.call(this, tagName);
    };
  }

  // 公開API
  window.AdvancedSecurity = {
    configure: function(config) {
      Object.assign(AdvancedSecurityConfig, config);
    },
    
    // 緊急セキュリティモード
    emergencyMode: function() {
      console.log('🚨 緊急セキュリティモードを有効化');
      
      // すべてのイベントリスナーを無効化
      EventTarget.prototype.addEventListener = function() {
        console.log('🚫 緊急モード: イベントリスナー無効');
      };
      
      // 動的コード実行を完全ブロック
      window.eval = function() {
        throw new Error('eval() blocked in emergency mode');
      };
      
      window.Function = function() {
        throw new Error('Function() constructor blocked in emergency mode');
      };
      
      // すべての外部通信をブロック
      window.fetch = function() {
        return Promise.reject(new Error('Network requests blocked in emergency mode'));
      };
      
      XMLHttpRequest.prototype.open = function() {
        throw new Error('XHR blocked in emergency mode');
      };
    }
  };

  // 初期化
  function initAdvancedSecurity() {
    console.log('🛡️ 包括的セキュリティシステム初期化中...');
    
    blockWebAssembly();
    preventMemoryAttacks();
    preventTimingAttacks();
    preventPrototypePollution();
    preventDomClobbering();
    preventClickJacking();
    preventSideChannelAttacks();
    preventSpeculativeExecution();
    enhanceUrlValidation();
    enforceResourceLimits();
    
    console.log('✅ 包括的セキュリティシステム初期化完了');
  }

  // 即座に初期化
  initAdvancedSecurity();

})(); 