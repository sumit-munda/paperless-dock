import { randomUUID } from "crypto";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { getR2BucketName, getR2Client } from "../r2.js";

const MAX_PDF_SIZE = 25 * 1024 * 1024;

function isValidPdf(buffer: Buffer): boolean {
  return (
    buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-"
  );
}

function isValidPdfObjectKey(objectKey: string): boolean {
  return objectKey.startsWith("books/") && objectKey.endsWith(".pdf");
}

export async function uploadBookPdf(
  bookId: string,
  buffer: Buffer,
): Promise<string> {
  if (!buffer || buffer.length === 0) {
    throw new Error("PDF file is empty.");
  }

  if (buffer.length > MAX_PDF_SIZE) {
    throw new Error("PDF file must not exceed 25 MB.");
  }

  if (!isValidPdf(buffer)) {
    throw new Error("The uploaded file is not a valid PDF.");
  }

  const bucketName = getR2BucketName();
  const client = getR2Client();

  const objectKey = `books/${bookId}/${randomUUID()}.pdf`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      Body: buffer,
      ContentType: "application/pdf",
      CacheControl: "private, no-store",
    }),
  );

  return objectKey;
}

export async function deleteStoredObject(objectKey: string): Promise<void> {
  if (!isValidPdfObjectKey(objectKey)) {
    throw new Error("Invalid storage object key.");
  }

  const bucketName = getR2BucketName();
  const client = getR2Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    }),
  );
}

export async function getStoredPdf(objectKey: string, range?: string) {
  if (!isValidPdfObjectKey(objectKey)) {
    throw new Error("Invalid storage object key.");
  }

  const bucketName = getR2BucketName();
  const client = getR2Client();

  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ...(range ? { Range: range } : {}),
    }),
  );

  return response;
}

export async function getStoredPdfSize(objectKey: string): Promise<number> {
  if (!isValidPdfObjectKey(objectKey)) {
    throw new Error("Invalid storage object key.");
  }

  const bucketName = getR2BucketName();
  const client = getR2Client();

  const response = await client.send(
    new HeadObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    }),
  );

  if (response.ContentLength === undefined) {
    throw new Error("Could not determine the stored PDF size.");
  }

  return response.ContentLength;
}
