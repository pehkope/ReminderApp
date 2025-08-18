(() => {
  function centerFooter() {
    const container = document.querySelector('.mobile-container');
    const footer = document.querySelector('.footer-bar');
    if (!container || !footer) return;

    // Get container center relative to viewport
    const rect = container.getBoundingClientRect();
    const footerWidth = footer.offsetWidth;
    const centerX = rect.left + rect.width / 2;
    const left = Math.round(centerX - footerWidth / 2);

    // Lock footer horizontally to container center
    footer.style.left = left + 'px';
    footer.style.right = 'auto';
    footer.style.transform = 'translateX(0)';
  }

  window.addEventListener('load', () => {
    centerFooter();
    setTimeout(centerFooter, 100); // after fonts/layout
  });
  window.addEventListener('resize', centerFooter);
  window.addEventListener('orientationchange', centerFooter);
})();


