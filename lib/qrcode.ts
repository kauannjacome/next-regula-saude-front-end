import QRCode from 'qrcode'

const DEFAULT_SIZE = 200
const DEFAULT_MARGIN = 2
const DEFAULT_COLOR = { dark: '#000000', light: '#ffffff' }

/**
 * Gera um QR Code como Data URL (base64 PNG).
 * Uso padronizado para toda a aplicacao.
 */
export async function generateQRCodeDataURL(
  text: string,
  size = DEFAULT_SIZE
): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: DEFAULT_MARGIN,
    color: DEFAULT_COLOR,
  })
}

/**
 * Gera um QR Code como Data URL de forma sincrona (callback-based, para uso em helpers).
 * Retorna uma Promise para manter a API consistente.
 */
export async function generateQRCodeSVGString(
  text: string,
  size = DEFAULT_SIZE
): Promise<string> {
  return QRCode.toString(text, {
    type: 'svg',
    width: size,
    margin: DEFAULT_MARGIN,
    color: DEFAULT_COLOR,
  })
}
