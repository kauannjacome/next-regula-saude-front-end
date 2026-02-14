
export const ImageHelper = {
  getWrapMode: (img: HTMLElement) => {
    return img.getAttribute('data-wrap') || 'inline';
  },

  setWrap: (img: HTMLElement, mode: string, update: () => void) => {
    if (img.tagName !== 'IMG') return;

    // Clear styles
    img.style.float = '';
    img.style.position = '';
    img.style.zIndex = '';
    img.style.display = '';
    img.style.margin = '4px 2px';
    img.style.left = '';
    img.style.top = '';

    // Set attribute
    img.setAttribute('data-wrap', mode);

    switch (mode) {
      case 'inline':
        img.style.display = 'inline';
        img.style.verticalAlign = 'middle';
        break;
      case 'square-left':
        img.style.display = 'block';
        img.style.float = 'left';
        img.style.margin = '4px 12px 4px 0';
        break;
      case 'square-right':
        img.style.display = 'block';
        img.style.float = 'right';
        img.style.margin = '4px 0 4px 12px';
        break;
      case 'top-bottom':
        img.style.display = 'block';
        img.style.margin = '10px auto';
        // Insert clear div logic handled by parent if needed, strictly style here
        break;
      case 'behind':
        img.style.position = 'absolute';
        img.style.zIndex = '1';
        break;
      case 'front':
        img.style.position = 'absolute';
        img.style.zIndex = '50';
        break;
    }
    update();
  },

  rotate: (img: HTMLElement, deg: number, update: () => void) => {
    const currentT = img.style.transform || '';
    const match = currentT.match(/rotate\((-?\d+)deg\)/);
    const cur = match ? parseInt(match[1]) : 0;
    const newT = currentT.replace(/rotate\(-?\d+deg\)/, '').trim() + ` rotate(${cur + deg}deg)`;
    img.style.transform = newT;
    update();
  },

  flip: (img: HTMLElement, axis: 'h' | 'v', update: () => void) => {
    const t = img.style.transform || '';
    const prop = axis === 'h' ? 'scaleX(-1)' : 'scaleY(-1)';
    img.style.transform = t.includes(prop) ? t.replace(prop, '').trim() : (t + ' ' + prop).trim();
    update();
  },

  updateSize: (img: HTMLElement, dim: 'w' | 'h', val: number, update: () => void) => {
    const imgEl = img as HTMLImageElement;
    if (dim === 'w') {
      const ratio = imgEl.naturalWidth / imgEl.naturalHeight;
      img.style.width = val + 'px';
      if (ratio) img.style.height = Math.round(val / ratio) + 'px';
    } else {
      const ratio = imgEl.naturalWidth / imgEl.naturalHeight;
      img.style.height = val + 'px';
      if (ratio) img.style.width = Math.round(val * ratio) + 'px';
    }
    update();
  },

  setBorder: (img: HTMLElement, style: string, update: () => void) => {
    img.style.boxShadow = '';
    img.style.border = '';
    img.style.borderRadius = '';

    switch (style) {
      case 'thin': img.style.border = '1px solid #d1d5db'; break;
      case 'thick': img.style.border = '3px solid #374151'; break;
      case 'rounded': img.style.border = '2px solid #d1d5db'; img.style.borderRadius = '8px'; break;
      case 'shadow': img.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; break;
    }
    update();
  },

  align: (img: HTMLElement, align: 'left' | 'center' | 'right', update: () => void) => {
    // Apply wrapper or margin based on wrap mode
    const mode = ImageHelper.getWrapMode(img);

    if (mode === 'top-bottom') {
      img.style.marginLeft = align === 'left' ? '0' : (align === 'center' ? 'auto' : 'auto');
      img.style.marginRight = align === 'right' ? '0' : (align === 'center' ? 'auto' : 'auto');
    } else if (mode === 'behind' || mode === 'front') {
      // Simple align relative to container?
      // Absolute positioning logic tricky without container ref
      if (align === 'center') {
        img.style.left = '50%';
        img.style.transform = (img.style.transform || '') + ' translateX(-50%)';
      } else if (align === 'left') {
        img.style.left = '0';
      } else {
        img.style.left = '';
        img.style.right = '0';
      }
    } else {
      // Inline - wrap in div
      // Simplified: Assuming parent is a block we can set align on
      const p = img.parentElement;
      if (p) p.style.textAlign = align;
    }
    update();
  }
};
