import BaseInput from "@dvargas92495/app/components/BaseInput";
import Button from "@dvargas92495/app/components/Button";
import SuccessfulActionToast from "@dvargas92495/app/components/SuccessfulActionToast";
import Select from "@dvargas92495/app/components/Select";
import { Link, useFetcher } from "@remix-run/react";
import {
  ActionFunction,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import uploadJson from "~/data/uploadJson.server";
import bulkInsertData from "~/data/bulkInsertData.server";
import FILE_TYPES from "~/enums/fileTypes";
export { default as CatchBoundary } from "@dvargas92495/app/components/DefaultCatchBoundary";
export { default as ErrorBoundary } from "@dvargas92495/app/components/DefaultErrorBoundary";
import { useEffect, useRef } from "react";

const DataPage = () => {
  const fetcher = useFetcher();
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (fetcher.type === "done") {
      formRef.current?.reset();
    }
  }, [fetcher]);
  return (
    <>
      <fetcher.Form
        method={"post"}
        className={"max-w-xl mb-32"}
        encType={"multipart/form-data"}
        ref={formRef}
      >
        <Select options={FILE_TYPES} label={"Upload Schema"} name={"schema"} />
        <BaseInput type={"file"} label={"File"} name={"filename"} />
        <Button>Upload</Button>
        <SuccessfulActionToast fetcher={fetcher} />
      </fetcher.Form>
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
  const schema = formData.get("schema") as typeof FILE_TYPES[number]["id"];
  const filename = formData.get("filename") as string;
  return bulkInsertData({ schema, filename });
};

export default DataPage;
