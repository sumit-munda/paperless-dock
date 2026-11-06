import { S3Client } from "@aws-sdk/client-s3";

let r2Client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (r2Client) {
    return r2Client;
  }

  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const region = process.env.R2_REGION || "auto";

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 credentials are not configured.");
  }

  let parsedEndpoint: URL;

  try {
    parsedEndpoint = new URL(endpoint);
  } catch (error) {
    throw new Error("Cloudflare R2 endpoint is invalid.");
  }

  if (parsedEndpoint.protocol !== "https:") {
    throw new Error("Cloudflare R2 endpoint must use HTTPS.");
  }

  r2Client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },

    forcePathStyle: true,
  });

  return r2Client;
}

export function getR2BucketName(): string {
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("Cloudflare R2 bucket name is not configured.");
  }

  return bucketName;
}
