const {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client, S3_BUCKET, S3_REGION } = require("../config/s3");

const assertS3Configured = () => {
  if (!S3_BUCKET || !S3_REGION) {
    const err = new Error("S3 is not configured. Set AWS_REGION and AWS_S3_BUCKET.");
    err.code = "S3_NOT_CONFIGURED";
    throw err;
  }
};

const buildS3Url = (key) => `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;

const uploadBufferToS3 = async (buffer, key, contentType) => {
  assertS3Configured();
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType
  });

  await s3Client.send(command);
  return buildS3Url(key);
};

const deleteFromS3 = async (key) => {
  assertS3Configured();
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key
  });

  await s3Client.send(command);
};

const getSignedDownloadUrl = async (key, fileName, expiresInSeconds = 300) => {
  assertS3Configured();
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`
  });
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
};

const getSignedViewUrl = async (key, expiresInSeconds = 300) => {
  assertS3Configured();
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key
  });
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
};

module.exports = {
  uploadBufferToS3,
  deleteFromS3,
  getSignedDownloadUrl,
  getSignedViewUrl
};
