'use client';

/**
 * Skalerer og komprimerer et billede i browseren før upload — reducerer typisk et
 * kamera/telefon-billede på 3-5 MB til et par hundrede KB uden mærkbart kvalitetstab
 * ved normal visningsstørrelse.
 */
export async function compressImage(
  file: File,
  options: { maxDimension?: number; quality?: number } = {}
): Promise<File> {
  const { maxDimension = 1600, quality = 0.75 } = options;

  // Komprimer kun rigtige billeder — lad andre filtyper passere uændret.
  if (!file.type.startsWith('image/')) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality)
  );
  if (!blob) return file;

  const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], newName, { type: 'image/jpeg' });
}