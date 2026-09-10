import { promises as fs } from "node:fs";
import path from "node:path";
import { authorizeAdminRequest } from "@/lib/auth/api-authorization";
import { getUploadImageFormat, hasValidImageSignature } from "@/lib/uploads/image-format";

const imagesDirectory = process.env.UPLOADS_DIR ?? path.join(process.cwd(), "public", "uploads");
const allowedExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"]);
const maxUploadSize = 5 * 1024 * 1024;

async function listImages() {
  await fs.mkdir(imagesDirectory, { recursive: true });
  const entries = await fs.readdir(imagesDirectory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && allowedExtensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => `/uploads/${entry.name}`)
    .sort((first, second) => first.localeCompare(second));
}

function normalizeFilename(filename: string) {
  const extension = path.extname(filename).toLowerCase();
  const basename = path.basename(filename, extension)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${basename || "imagen"}-${Date.now()}${extension}`;
}

export async function GET() {
  const authorization = await authorizeAdminRequest();
  if ("response" in authorization) return authorization.response;

  return Response.json({ ok: true, images: await listImages() });
}

export async function POST(request: Request) {
  const authorization = await authorizeAdminRequest();
  if ("response" in authorization) return authorization.response;

  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return Response.json({ ok: false, error: "Debes seleccionar una imagen." }, { status: 400 });
  }

  const extension = path.extname(image.name).toLowerCase();
  const format = getUploadImageFormat(extension, image.type);
  if (!format) {
    return Response.json({ ok: false, error: "Formato de imagen no permitido." }, { status: 400 });
  }

  if (image.size > maxUploadSize) {
    return Response.json({ ok: false, error: "La imagen no puede superar 5 MB." }, { status: 400 });
  }

  const bytes = new Uint8Array(await image.arrayBuffer());
  if (!hasValidImageSignature(bytes, format)) {
    return Response.json({ ok: false, error: "El contenido no coincide con el formato de imagen." }, { status: 400 });
  }

  await fs.mkdir(imagesDirectory, { recursive: true });
  const filename = normalizeFilename(image.name);
  const destination = path.join(imagesDirectory, filename);
  await fs.writeFile(destination, bytes);

  const url = `/uploads/${filename}`;
  const images = await listImages();

  return Response.json({ ok: true, url, images }, { status: 201 });
}
