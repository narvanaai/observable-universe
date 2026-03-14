// Upload routes — photo upload to Cloudflare R2 via S3-compatible API.
// Works on 4-year-old Android phones with mediocre signal. Compressed. Fast.
import { Router, Request, Response } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import logger from "../lib/logger";

const router = Router();

// Multer config — 10MB max, images only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// S3 client configured for Cloudflare R2
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || "",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET = process.env.R2_BUCKET || "civicos-uploads";

// POST /api/upload — upload a photo, return the public URL
router.post("/", upload.single("photo"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }

  const ext = req.file.originalname.split(".").pop() || "jpg";
  const key = `issues/${uuidv4()}.${ext}`;

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        // Public read — these are civic photos, they should be visible
        ACL: "public-read",
      })
    );

    const publicUrl = `${process.env.R2_PUBLIC_URL || ""}/${key}`;

    logger.info("Photo uploaded", {
      key,
      size: req.file.size,
      type: req.file.mimetype,
    });

    res.status(201).json({ data: { url: publicUrl, key } });
  } catch (error) {
    logger.error("Upload failed", { error });
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
