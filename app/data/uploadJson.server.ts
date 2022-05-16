import AWS from "aws-sdk";
import type { Readable } from "stream";
import type { UploadHandler } from "@remix-run/node";

const s3 = new AWS.S3();

const uploadJson: UploadHandler = ({
  filename,
  stream,
}) => {
  const Key = `data/${filename}`;
  return s3
    .upload({
      Bucket: "clarity.davidvargas.me",
      Key,
      Body: stream,
    })
    .promise()
    .then(() => Key);
};

export default uploadJson;
