import multer = require("multer");
import crypto from "crypto";
import { env } from "@/env.ts";
import * as fs from "node:fs";
import path = require("node:path");
import { memoryStorage, type Multer } from "multer";
import { BadRequestError, UnsupportedMediaTypeError } from "@/utils/errors";
import { type MulterWrapper, wrapMulter } from "@/utils/multer.util.ts";

fs.mkdirSync(env.UPLOADS_DIR, { recursive: true });

const documentStore = multer.diskStorage({
  destination: (req, file, callback) => {
    const hash = crypto.randomBytes(16).toString("hex");
    const shard = hash.substring(0, 4);

    fs.mkdirSync(path.join(env.UPLOADS_DIR, shard), { recursive: true });

    file.hash = hash;
    file.shard = shard;

    callback(null, env.UPLOADS_DIR);
  },
  filename: (req, file, callback) => {
    callback(null, `${file.shard}/${file.hash}`);
  },
});

export const documentMulter: MulterWrapper = wrapMulter(
  multer({
    storage: documentStore,
    limits: {
      fieldNameSize: 1024,
      fieldSize: 1024 * 1024,
      fields: 10,
      fileSize: 50 * 1024 * 1024,
      files: 5,
      fieldNestingDepth: 5,
    },
    fileFilter: (req, file, callback) => {
      if (
        file.mimetype === "application/pdf" &&
        path.extname(file.originalname).toLowerCase() === ".pdf"
      )
        return callback(null, true);
      callback(new UnsupportedMediaTypeError("Only PDF files are allowed"));
    },
  }),
  "/docs",
);

export const pfpMulter: MulterWrapper = wrapMulter(
  multer({
    storage: memoryStorage(),
    limits: {
      fieldNameSize: 1024,
      fieldSize: 1024 * 1024,
      fields: 10,
      fileSize: 10 * 1024 * 1024,
      files: 1,
      fieldNestingDepth: 5,
    },
    fileFilter: (req, file, callback) => {
      if (file.mimetype.startsWith("image/")) {
        callback(null, true);
      } else {
        callback(new UnsupportedMediaTypeError("Only image files are allowed"));
      }
    },
  }),
  "/pfps",
);

fs.mkdirSync(env.IMAGES_DIR, { recursive: true });

const imageStore = multer.diskStorage({
  destination: (req, file, callback) => {
    const hash = crypto.randomBytes(16).toString("hex");
    const shard = hash.substring(0, 4);

    fs.mkdirSync(path.join(env.IMAGES_DIR, shard), { recursive: true });

    file.hash = hash;
    file.shard = shard;

    callback(null, env.IMAGES_DIR);
  },
  filename: (req, file, callback) => {
    callback(null, `${file.shard}/${file.hash}`);
  },
});

export const imageMulter = wrapMulter(
  multer({
    storage: imageStore,
    limits: {
      fieldNameSize: 1024,
      fieldSize: 1024 * 1024,
      fields: 25,
      fileSize: 10 * 1024 * 1024,
      files: 5,
      fieldNestingDepth: 5,
    },
    fileFilter: (req, file, callback) => {
      if (file.mimetype.startsWith("image/")) {
        callback(null, true);
      } else {
        callback(new UnsupportedMediaTypeError("Only image files are allowed"));
      }
    },
  }),
  "/images",
);
