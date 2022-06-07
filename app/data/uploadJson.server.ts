import AWS from "aws-sdk";
import type { UploadHandler } from "@remix-run/node";

const s3 = new AWS.S3({ region: process.env.AWS_REGION });

const uploadJson: UploadHandler = async ({ filename, data }) => {
  let Body = [];
  for await (const datum of data) {
    Body.push(datum);
  }
  const Key = `data/${filename}`;
  return s3
    .upload({
      Bucket: "clarity.davidvargas.me",
      Key,
      Body: Buffer.concat(Body),
    })
    .promise()
    .then(() => Key);
};

export default uploadJson;
