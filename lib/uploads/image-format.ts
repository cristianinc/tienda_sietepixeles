export type UploadImageFormat = {
  extension: ".jpeg" | ".jpg" | ".png" | ".webp";
  mimeType: "image/jpeg" | "image/png" | "image/webp";
};

const formats: UploadImageFormat[] = [
  { extension: ".jpeg", mimeType: "image/jpeg" },
  { extension: ".jpg", mimeType: "image/jpeg" },
  { extension: ".png", mimeType: "image/png" },
  { extension: ".webp", mimeType: "image/webp" },
];

export function hasValidImageSignature(bytes: Uint8Array, format: UploadImageFormat) {
  if (format.mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (format.mimeType === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((value, index) => bytes[index] === value);
  }

  return bytes.length >= 12
    && String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP";
}

export function getUploadImageFormat(extension: string, mimeType: string) {
  return formats.find((format) => format.extension === extension && format.mimeType === mimeType) ?? null;
}
