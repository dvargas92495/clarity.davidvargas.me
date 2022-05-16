import AWS from "aws-sdk";
import type { UploadHandler } from "@remix-run/node";

const s3 = new AWS.S3({ region: process.env.AWS_REGION });

const uploadJson: UploadHandler = ({ filename, stream }) => {
  const Key = `data/${filename}`;
  return s3
    .putObject({
      Bucket: "clarity.davidvargas.me",
      Key,
      Body: stream,
    })
    .promise()
    .then(() => Key);
};

export default uploadJson;
