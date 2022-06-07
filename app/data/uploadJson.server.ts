import AWS from "aws-sdk";
import type { UploadHandler } from "@remix-run/node";

const s3 = new AWS.S3({ region: process.env.AWS_REGION });

const uploadJson: UploadHandler = ({ filename, data }) => {
  const Key = `data/${filename}`;
  return s3
    .upload({
      Bucket: "clarity.davidvargas.me",
      Key,
      Body: data,
    })
    .promise()
    .then(() => Key);
};

export default uploadJson;
