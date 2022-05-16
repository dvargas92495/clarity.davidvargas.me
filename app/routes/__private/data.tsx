import BaseInput from "@dvargas92495/app/components/BaseInput";
import Button from "@dvargas92495/app/components/Button";
import SuccessfulActionToast from "@dvargas92495/app/components/SuccessfulActionToast";
import React from "react";
import { Form, Link } from "@remix-run/react";
import {
  ActionFunction,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import uploadJson from "~/data/uploadJson.server";
import bulkInsertData from "~/data/bulkInsertData.server";

const DataPage = () => {
  return (
    <>
      <Form
        method={"post"}
        className={"max-w-xl mb-32"}
        encType={"multipart/form-data"}
      >
        <BaseInput type={"file"} label={"Users"} name={"users"} />
        <BaseInput type={"file"} label={"Closed Projects"} name={"projects"} />
        <Button>Upload</Button>
        <SuccessfulActionToast message="Successfully uploaded files!" />
      </Form>
      <Link
        to={"/views"}
        className={
          "text-sky-500 cursor-pointer hover:underline active:no-underline active:text-sky-700"
        }
      >
        {"Go to views ->"}
      </Link>
    </>
  );
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await unstable_parseMultipartFormData(request, uploadJson);
  const users = formData.get("users") as string;
  const projects = formData.get("projects") as string;
  console.log(users, projects);
  return bulkInsertData({ users, projects }).then(() => ({ success: true }));
};

export default DataPage;
