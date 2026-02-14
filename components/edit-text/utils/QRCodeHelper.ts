import { ImageHelper } from './ImageHelper';
import { generateQRCodeDataURL } from '@/lib/qrcode';

/**
 * Gera o src do QR code via pacote qrcode (data URL).
 * Como toDataURL eh async, usamos um placeholder e atualizamos depois.
 */
async function buildDataURL(text: string, size: number): Promise<string> {
  return generateQRCodeDataURL(text, size);
}

export const QRCodeHelper = {
  /**
   * Gera HTML de um QR Code com placeholder (carrega async).
   * O src comeca vazio e eh preenchido via updateSrcAsync.
   */
  createHTML(text: string, size = 150): string {
    return `<img src="" class="qr-code" data-qr-text="${text.replace(/"/g, '&quot;')}" data-qr-size="${size}" style="width:${size}px;height:${size}px;max-width:100%;" />`;
  },

  /**
   * Atualiza o src de todas as imagens QR que ainda nao foram carregadas.
   * Deve ser chamado apos insertHTML no editor.
   */
  async updatePendingQRCodes(container: HTMLElement): Promise<void> {
    const imgs = container.querySelectorAll<HTMLImageElement>('img.qr-code[data-qr-text]');
    for (const img of imgs) {
      if (img.src && !img.src.endsWith('/')) continue;
      const text = img.getAttribute('data-qr-text') || '';
      const size = parseInt(img.getAttribute('data-qr-size') || '150');
      if (text) {
        img.src = await buildDataURL(text, size);
      }
    }
  },

  getText(el: HTMLElement): string {
    return el.getAttribute('data-qr-text') || '';
  },

  async regenerate(el: HTMLElement, newText: string, size?: number, update?: () => void) {
    const s = size || el.offsetWidth || 150;
    el.setAttribute('data-qr-text', newText);
    el.setAttribute('data-qr-size', String(s));
    (el as HTMLImageElement).src = await buildDataURL(newText, s);
    el.style.width = s + 'px';
    el.style.height = s + 'px';
    el.style.maxWidth = '100%';
    update?.();
  },

  async setSize(el: HTMLElement, size: number, update?: () => void) {
    const clamped = Math.max(30, Math.min(500, size));
    el.style.width = clamped + 'px';
    el.style.height = clamped + 'px';
    el.style.maxWidth = '100%';
    el.setAttribute('data-qr-size', String(clamped));
    const text = QRCodeHelper.getText(el);
    if (text) {
      (el as HTMLImageElement).src = await buildDataURL(text, clamped);
    }
    update?.();
  },

  // Delegate wrap/border/align to ImageHelper since QR is an IMG
  setWrap: ImageHelper.setWrap,
  getWrapMode: ImageHelper.getWrapMode,
  setBorder: ImageHelper.setBorder,
  rotate: ImageHelper.rotate,
  flip: ImageHelper.flip,
};
