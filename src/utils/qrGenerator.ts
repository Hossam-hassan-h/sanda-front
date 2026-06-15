import QRCode from "qrcode";

export async function generateQRDataUrl(data: string, size = 300): Promise<string> {
  return QRCode.toDataURL(data, {
    width: size,
    margin: 2,
    color: { dark: "#1a1a1a", light: "#ffffff" },
  });
}

export function downloadQRImage(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
