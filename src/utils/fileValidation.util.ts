import path = require("node:path");
import fs from "node:fs";
import { fileTypeFromFile } from "file-type";
import sharp from "sharp";
import { readFile } from "node:fs/promises";

export async function validPDF(file: Express.Multer.File): Promise<boolean> {
  if (!file || !file.path) return false;

  const isPdfExt = path.extname(file.originalname).toLowerCase() === ".pdf";
  const isPdfMime = file.mimetype === "application/pdf";
  if (!isPdfExt || !isPdfMime) return false;

  const internal_type = await fileTypeFromFile(file.path);
  if (!internal_type) return false;
  return internal_type.mime == "application/pdf";
}

export async function validImage(file: Express.Multer.File): Promise<boolean> {
  if (!file.mimetype.startsWith("image/")) return false;

  const internal_type = await fileTypeFromFile(file.path);
  if (!internal_type || !internal_type.mime.startsWith("image/")) return false;

  return isValidAndDecodableImage(await readFile(file.path));
}

export async function validPFP(file: Express.Multer.File): Promise<boolean> {
  if (!file.mimetype.startsWith("image/")) return false;

  const internal_type = await fileTypeFromFile(file.path);
  if (!internal_type || !internal_type.mime.startsWith("image/")) return false;

  return isValidAndDecodableImage(file.buffer);
}

async function isValidAndDecodableImage(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata();
    return Boolean(metadata.format);
  } catch {
    return false;
  }
}
