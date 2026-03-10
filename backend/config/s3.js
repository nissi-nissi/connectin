const { S3Client } = require("@aws-sdk/client-s3");

const S3_REGION = process.env.AWS_REGION;
const S3_BUCKET = process.env.AWS_S3_BUCKET;

if (!S3_REGION || !S3_BUCKET) {
  console.warn("AWS_REGION or AWS_S3_BUCKET is not set. S3 operations will fail until configured.");
}

const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ""
  }
});

module.exports = { s3Client, S3_REGION, S3_BUCKET };
