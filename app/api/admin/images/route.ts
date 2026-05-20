import { promises as fs } from "node:fs";
import path from "node:path";

const imagesDirectory = path.join(process.cwd(), "public", "images");
const allowedExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"]);
const maxUploadSize = 5 * 1024 * 1024;

async function listImages() {
  await fs.mkdir(imagesDirectory, { recursive: true });
  const entries = await fs.readdir(imagesDirectory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && allowedExtensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => `/images/${entry.name}`)
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
  return Response.json({ ok: true, images: await listImages() });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File)) {
    return Response.json({ ok: false, error: "Debes seleccionar una imagen." }, { status: 400 });
  }

  const extension = path.extname(image.name).toLowerCase();
  if (!image.type.startsWith("image/") || !allowedExtensions.has(extension)) {
    return Response.json({ ok: false, error: "Formato de imagen no permitido." }, { status: 400 });
  }

  if (image.size > maxUploadSize) {
    return Response.json({ ok: false, error: "La imagen no puede superar 5 MB." }, { status: 400 });
  }

  await fs.mkdir(imagesDirectory, { recursive: true });
  const filename = normalizeFilename(image.name);
  const destination = path.join(imagesDirectory, filename);
  await fs.writeFile(destination, Buffer.from(await image.arrayBuffer()));

  const url = `/images/${filename}`;
  const images = await listImages();

  return Response.json({ ok: true, url, images }, { status: 201 });
}
