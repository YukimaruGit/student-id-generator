(() => {
  const EMBED = new URLSearchParams(location.search).has('embed') || (window.top !== window);
  if (!EMBED) return;

  const isInternal = (href) => {
    try { const u = new URL(href, location.href); return u.origin === location.origin; }
    catch { return false; }
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a,button[data-href]');
    if (!a) return;
    const href = a.tagName === 'A' ? a.getAttribute('href') : a.dataset.href;
    if (!href) return;

    if (isInternal(href)) {
      e.preventDefault();
      const url = new URL(href, location.href);
      url.searchParams.set('embed','1');   // 次ページでも埋め込み継続
      location.assign(url.toString());     // 親は触らない
    } else {
      a.setAttribute('target','_blank');
      a.setAttribute('rel', (a.getAttribute('rel') || '') + ' noopener noreferrer');
    }
  }, { capture:true });
})();
