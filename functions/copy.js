export async function onRequest(context) {
  try {
    const url = new URL(context.request.url);
    const textToCopy = url.searchParams.get('u');
    const backUrl = url.searchParams.get('back') || '/';
    
    if (!textToCopy) {
      return new Response('テキストが指定されていません', { status: 400 });
    }
    
    // 自動コピー用のHTML
    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>コピー中...</title>
  <style>
    body {
      font-family: 'Noto Sans JP', sans-serif;
      background: linear-gradient(135deg, #B997D6, #A895D0);
      margin: 0;
      padding: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: white;
      text-align: center;
    }
    .copy-status {
      background: rgba(255, 255, 255, 0.1);
      padding: 2rem;
      border-radius: 16px;
      backdrop-filter: blur(10px);
      max-width: 400px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .success { color: #98d7a5; }
    .error { color: #ff6b6b; }
  </style>
</head>
<body>
  <div class="copy-status">
    <div class="spinner" id="spinner"></div>
    <p id="status">クリップボードにコピー中...</p>
    <p id="text" style="font-size: 0.8em; margin-top: 1rem; word-break: break-all; background: rgba(255,255,255,0.1); padding: 0.5rem; border-radius: 8px;"></p>
  </div>

  <script>
    (function() {
      const text = ${JSON.stringify(textToCopy)};
      const backUrl = ${JSON.stringify(backUrl)};
      
      // テキストを表示
      document.getElementById('text').textContent = text;
      
      // コピー処理
      async function copyToClipboard() {
        try {
          // 1. Clipboard API
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
          }
        } catch (e) {
          console.log('Clipboard API failed:', e);
        }
        
        try {
          // 2. execCommand
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.select();
          const success = document.execCommand('copy');
          document.body.removeChild(textArea);
          if (success) return true;
        } catch (e) {
          console.log('execCommand failed:', e);
        }
        
        return false;
      }
      
      // コピー実行
      copyToClipboard().then(success => {
        const spinner = document.getElementById('spinner');
        const status = document.getElementById('status');
        
        if (success) {
          spinner.style.display = 'none';
          status.innerHTML = '<span class="success">✅ コピー完了！</span>';
          status.style.fontSize = '1.2em';
        } else {
          spinner.style.display = 'none';
          status.innerHTML = '<span class="error">❌ コピーに失敗しました</span>';
          status.style.fontSize = '1.2em';
        }
        
        // 3秒後に元のページに戻る
        setTimeout(() => {
          window.location.href = backUrl;
        }, 3000);
      });
    })();
  </script>
</body>
</html>`;
    
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    console.error('Copy function error:', error);
    return new Response('エラーが発生しました', { status: 500 });
  }
}
