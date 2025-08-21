// セキュリティ監視・レポートシステム
(function() {
  'use strict';

  // セキュリティイベントのカウンター
  const SecurityMetrics = {
    xssAttempts: 0,
    injectionAttempts: 0,
    suspiciousFileUploads: 0,
    maliciousUrls: 0,
    prototypePollutionAttempts: 0,
    clickjackingAttempts: 0,
    timingAttacks: 0,
    memoryAttacks: 0,
    totalThreats: 0
  };

  // セキュリティログ
  const SecurityLog = [];
  const MAX_LOG_ENTRIES = 1000;

  // ログエントリの作成
  function logSecurityEvent(type, details, severity = 'medium') {
    const timestamp = new Date().toISOString();
    
    // ログの最小化＆匿名化
    const entry = {
      timestamp,
      type,
      details,
      severity,
      userAgent: getMaskedUserAgent(), // UA情報を要約
      url: getMaskedUrl(), // URLのクエリ/フラグメントを削除
      sessionId: generateSecureSessionId() // CSPRNGで16バイト生成
    };

    SecurityLog.push(entry);
    SecurityMetrics.totalThreats++;

    // ログサイズ制限
    if (SecurityLog.length > MAX_LOG_ENTRIES) {
      SecurityLog.shift();
    }

    // 高重要度の場合は即座に報告
    if (severity === 'high' || severity === 'critical') {
      console.error('🚨 セキュリティ警告:', entry);
      handleHighSeverityThreat(entry);
    } else {
      console.warn('⚠️ セキュリティイベント:', entry);
    }

    // 統計更新
    updateSecurityMetrics(type);
  }

  // CSPRNGセッションID生成（16バイト）
  function generateSecureSessionId() {
    if (!window.securitySessionId) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      window.securitySessionId = 'sec_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    return window.securitySessionId;
  }

  // UA情報の要約（主要情報のみ）
  function getMaskedUserAgent() {
    const ua = navigator.userAgent;
    const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
    if (browserMatch) {
      return `${browserMatch[1]}/${browserMatch[2]}`;
    }
    return 'Unknown';
  }

  // URLのクエリ/フラグメントを削除（ドメイン＋パスのみ）
  function getMaskedUrl() {
    try {
      const url = new URL(window.location.href);
      return `${url.origin}${url.pathname}`;
    } catch {
      return window.location.origin + window.location.pathname;
    }
  }

  // セキュリティメトリクス更新
  function updateSecurityMetrics(type) {
    switch (type) {
      case 'xss_attempt':
        SecurityMetrics.xssAttempts++;
        break;
      case 'injection_attempt':
        SecurityMetrics.injectionAttempts++;
        break;
      case 'suspicious_file':
        SecurityMetrics.suspiciousFileUploads++;
        break;
      case 'malicious_url':
        SecurityMetrics.maliciousUrls++;
        break;
      case 'prototype_pollution':
        SecurityMetrics.prototypePollutionAttempts++;
        break;
      case 'clickjacking':
        SecurityMetrics.clickjackingAttempts++;
        break;
      case 'timing_attack':
        SecurityMetrics.timingAttacks++;
        break;
      case 'memory_attack':
        SecurityMetrics.memoryAttacks++;
        break;
    }
  }

  // 高重要度脅威の処理
  function handleHighSeverityThreat(entry) {
    // 緊急セキュリティモードの有効化を検討
    if (SecurityMetrics.totalThreats > 10) {
      console.log('🚨 脅威レベル上昇 - 追加セキュリティ対策を検討');
      
      if (SecurityMetrics.totalThreats > 50) {
        console.log('🚨 緊急セキュリティモード有効化の検討');
        if (window.AdvancedSecurity && typeof window.AdvancedSecurity.emergencyMode === 'function') {
          // 自動的には実行せず、ログのみ
          console.log('🚨 緊急モードが利用可能です');
        }
      }
    }

    // セキュリティデータのクリア（個人情報保護）
    if (entry.type === 'data_breach_attempt') {
      if (window.PrivacySecurity && typeof window.PrivacySecurity.emergencyClear === 'function') {
        window.PrivacySecurity.emergencyClear();
        console.log('🧹 セキュリティデータを緊急クリアしました');
      }
    }
  }

  // 外部からのセキュリティイベント報告用API
  const SecurityMonitorAPI = {
    // セキュリティイベントの報告
    reportThreat: function(type, details, severity = 'medium') {
      logSecurityEvent(type, details, severity);
    },

    // 統計情報の取得
    getMetrics: function() {
      return { ...SecurityMetrics };
    },

    // セキュリティログの取得（開発用）
    getLog: function() {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return [...SecurityLog];
      } else {
        console.log('📊 セキュリティログは開発環境でのみ利用可能です');
        return null;
      }
    },

    // セキュリティステータスの表示
    showStatus: function() {
      console.log('🛡️ セキュリティステータス:');
      console.log('- 総脅威数:', SecurityMetrics.totalThreats);
      console.log('- XSS試行:', SecurityMetrics.xssAttempts);
      console.log('- インジェクション試行:', SecurityMetrics.injectionAttempts);
      console.log('- 疑わしいファイル:', SecurityMetrics.suspiciousFileUploads);
      console.log('- 悪意のあるURL:', SecurityMetrics.maliciousUrls);
      console.log('- セッションID:', generateSecureSessionId());
    },

    // セキュリティレポートの生成
    generateReport: function() {
      const report = {
        generated: new Date().toISOString(),
        sessionId: generateSecureSessionId(),
        metrics: { ...SecurityMetrics },
        recentEvents: SecurityLog.slice(-10), // 直近10件
        riskLevel: calculateRiskLevel(),
        recommendations: generateRecommendations()
      };

      console.log('📋 セキュリティレポート:', report);
      return report;
    }
  };

  // APIを固定化
  Object.freeze(SecurityMonitorAPI);
  window.SecurityMonitor = SecurityMonitorAPI;

  // リスクレベルの計算
  function calculateRiskLevel() {
    const total = SecurityMetrics.totalThreats;
    
    if (total === 0) return 'low';
    if (total < 5) return 'low';
    if (total < 20) return 'medium';
    if (total < 50) return 'high';
    return 'critical';
  }

  // 推奨事項の生成
  function generateRecommendations() {
    const recommendations = [];
    const metrics = SecurityMetrics;

    if (metrics.xssAttempts > 5) {
      recommendations.push('XSS攻撃が頻発しています。入力検証の強化を推奨します。');
    }

    if (metrics.suspiciousFileUploads > 3) {
      recommendations.push('疑わしいファイルアップロードが検出されています。ファイル検証の強化を推奨します。');
    }

    if (metrics.totalThreats > 20) {
      recommendations.push('脅威レベルが高くなっています。緊急セキュリティモードの有効化を検討してください。');
    }

    if (metrics.prototypePollutionAttempts > 0) {
      recommendations.push('プロトタイプ汚染の試行が検出されています。JSON処理の見直しを推奨します。');
    }

    if (recommendations.length === 0) {
      recommendations.push('現在のセキュリティ状態は良好です。');
    }

    return recommendations;
  }

  // セキュリティイベントの自動検知（開発時のみ）
  function setupAutomaticDetection() {
    // 開発環境でのみ有効
    if (window.__APP_ENV__ === 'development') {
      // コンソールエラーの監視
      const originalError = console.error;
      console.error = function(...args) {
        const message = args.join(' ');
        
        // セキュリティ関連エラーの検出
        if (message.includes('script') || message.includes('inject') || 
            message.includes('eval') || message.includes('XSS')) {
          logSecurityEvent('xss_attempt', 'Console error suggests XSS attempt: ' + message, 'high');
        }
        
        if (message.includes('prototype') || message.includes('__proto__')) {
          logSecurityEvent('prototype_pollution', 'Prototype pollution attempt detected: ' + message, 'high');
        }

        return originalError.apply(this, args);
      };

      // ページの可視性変化を監視（タブ切り替え攻撃の検出）
      document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
          logSecurityEvent('visibility_change', 'Page hidden - potential tab hijacking', 'low');
        }
      });

      // 異常なスクロール動作の検出
      let rapidScrollCount = 0;
      let lastScrollTime = 0;
      
      window.addEventListener('scroll', function() {
        const now = Date.now();
        if (now - lastScrollTime < 10) { // 10ms以内の連続スクロール
          rapidScrollCount++;
          if (rapidScrollCount > 50) {
            logSecurityEvent('rapid_scroll', 'Rapid scrolling detected - potential bot activity', 'medium');
            rapidScrollCount = 0;
          }
        } else {
          rapidScrollCount = 0;
        }
        lastScrollTime = now;
      });

      // 異常なキーボード入力の検出
      let rapidKeyCount = 0;
      let lastKeyTime = 0;
      
      document.addEventListener('keydown', function(event) {
        const now = Date.now();
        if (now - lastKeyTime < 5) { // 5ms以内の連続キー入力
          rapidKeyCount++;
          if (rapidKeyCount > 100) {
            logSecurityEvent('rapid_input', 'Rapid keyboard input detected - potential bot activity', 'medium');
            rapidKeyCount = 0;
          }
        } else {
          rapidKeyCount = 0;
        }
        lastKeyTime = now;
      });
    }
  }

  // 定期的なセキュリティチェック（開発時のみ）
  function runPeriodicSecurityCheck() {
    // 開発環境でのみ有効
    if (window.__APP_ENV__ === 'development') {
      // 5分ごとにセキュリティ状態をチェック
      setInterval(function() {
        const riskLevel = calculateRiskLevel();
        
        if (riskLevel === 'high' || riskLevel === 'critical') {
          console.warn('⚠️ 定期チェック: リスクレベルが上昇しています:', riskLevel);
        }

        // メモリ使用量のチェック
        if (window.performance && window.performance.memory) {
          const used = window.performance.memory.usedJSHeapSize;
          const limit = window.performance.memory.jsHeapSizeLimit;
          
          if (used / limit > 0.9) {
            logSecurityEvent('memory_pressure', 'High memory usage detected: ' + Math.round((used/limit)*100) + '%', 'medium');
          }
        }

      }, 5 * 60 * 1000); // 5分
    }
  }

  // セキュリティダッシュボード（開発用）
  function createSecurityDashboard() {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return; // 本番環境では表示しない
    }

    // 開発環境でのみダッシュボード表示
    console.log('🔧 開発環境: セキュリティダッシュボードが利用可能です');
    console.log('使用方法:');
    console.log('- SecurityMonitor.showStatus() : 現在の状態表示');
    console.log('- SecurityMonitor.generateReport() : レポート生成');
    console.log('- SecurityMonitor.getLog() : ログ取得');
  }

  // 初期化
  function initSecurityMonitor() {
    console.log('📊 セキュリティ監視システム初期化中...');
    
    setupAutomaticDetection();
    runPeriodicSecurityCheck();
    createSecurityDashboard();
    
    // 初期ログ
    logSecurityEvent('system_start', 'Security monitoring system initialized', 'info');
    
    console.log('✅ セキュリティ監視システム初期化完了');
  }

  // DOM読み込み完了後に初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSecurityMonitor);
  } else {
    initSecurityMonitor();
  }

})(); 