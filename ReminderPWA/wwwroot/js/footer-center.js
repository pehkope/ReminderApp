(() => {
  function centerFooter() {
    const container = document.querySelector('.mobile-container');
    const footer = document.querySelector('.footer-bar');
    if (!container || !footer) return;

    const rect = container.getBoundingClientRect();
    // Korttien leveys = kontti - 40px (content-area padding 20px per puoli)
    const targetWidth = Math.max(0, rect.width - 40);
    const left = Math.round(rect.left + 20);

    footer.style.position = 'fixed';
    footer.style.left = left + 'px';
    footer.style.right = 'auto';
    footer.style.transform = 'none';
    footer.style.width = targetWidth + 'px';
  }

  const onReady = () => { centerFooter(); setTimeout(centerFooter, 100); };
  window.addEventListener('load', onReady);
  window.addEventListener('resize', centerFooter);
  window.addEventListener('orientationchange', centerFooter);
})();


