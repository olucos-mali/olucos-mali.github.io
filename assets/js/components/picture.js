import { el } from '../utils/dom.js';

/**
 * <picture> responsive à partir d'un objet coverImage :
 *   { base: '/assets/images/photos/nom', widths: [640, 1200], width, height, alt }
 * Les fichiers existent en AVIF, WebP et JPEG : nom-640.avif, nom-640.webp, nom-640.jpg…
 */
export function picture(image, { sizes = '100vw', className = '', loading = 'lazy' } = {}) {
  if (!image) return null;
  const set = (ext) => image.widths.map((w) => `${image.base}-${w}.${ext} ${w}w`).join(', ');
  const largest = image.widths[image.widths.length - 1];
  const style = image.placeholder ? `background: url("${image.placeholder}") center / cover no-repeat;` : null;
  return el('picture', { class: className, style },
    el('source', { type: 'image/avif', srcset: set('avif'), sizes }),
    el('source', { type: 'image/webp', srcset: set('webp'), sizes }),
    el('img', {
      src: `${image.base}-${largest}.jpg`,
      srcset: set('jpg'),
      sizes,
      width: image.width,
      height: image.height,
      alt: image.alt ?? '',
      loading,
      decoding: 'async',
    }),
  );
}
