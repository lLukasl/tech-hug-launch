// Browser-only helpers: generate the OS PDF from the rendered page and share it.
export async function elementToPdf(el: HTMLElement, fileName: string): Promise<File> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const w = pw - margin * 2;
  const pxPerMm = canvas.width / w;
  const pageHpx = Math.floor((ph - margin * 2) * pxPerMm);
  let y = 0;
  let first = true;
  while (y < canvas.height) {
    const h = Math.min(pageHpx, canvas.height - y);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = h;
    slice.getContext("2d")!.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
    if (!first) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, w, h / pxPerMm);
    first = false;
    y += h;
  }
  return new File([pdf.output("blob")], fileName, { type: "application/pdf" });
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Returns "shared" when the native share sheet handled the file, otherwise "downloaded". */
export async function sharePdf(file: File, text: string, waPhone: string): Promise<"shared" | "downloaded" | "cancelled"> {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: file.name, text });
      return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled";
    }
  }
  downloadFile(file);
  const phone = waPhone.replace(/\D/g, "");
  window.open(`https://wa.me/${phone ? (phone.length <= 11 ? "55" + phone : phone) : ""}?text=${encodeURIComponent(text)}`, "_blank");
  return "downloaded";
}
