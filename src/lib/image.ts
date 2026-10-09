/** Recorta em 4:5 (centro), redimensiona p/ máx 800px de largura e comprime (qualidade 80%). */
export async function processPhoto(file: File): Promise<Blob> {
  let source: Blob = file;
  const isHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  if (isHeic) {
    try {
      const bmp = await createImageBitmap(file);
      bmp.close();
    } catch {
      const heic2any = (await import("heic2any")).default;
      const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
      source = Array.isArray(out) ? out[0] : out;
    }
  }
  const bitmap = await createImageBitmap(source, {
    imageOrientation: "from-image",
  } as ImageBitmapOptions);
  const ratio = 4 / 5;
  let sw = bitmap.width;
  let sh = bitmap.height;
  let sx = 0;
  let sy = 0;
  if (sw / sh > ratio) {
    const nw = sh * ratio;
    sx = (sw - nw) / 2;
    sw = nw;
  } else {
    const nh = sw / ratio;
    sy = (sh - nh) / 2;
    sh = nh;
  }
  const outW = Math.min(800, Math.round(sw));
  const outH = Math.round(outW / ratio);
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, outW, outH);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao processar imagem"))),
      "image/jpeg",
      0.8,
    ),
  );
}
