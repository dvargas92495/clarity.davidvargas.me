import React from "react";
// import type { LoaderFunction } from "@remix-run/server-runtime";
// import Table from "@dvargas92495/app/components/Table";
import getMeta from "@dvargas92495/app/utils/getMeta";
import { Link } from "@remix-run/react";

const ViewsPage = () => {
  return (
    // <Table
    //   className={"w-full"}
    //   thClassName={"cursor-pointer p-3 font-medium opacity-50 text-left"}
    //   theadClassName={""}
    //   getTrClassName={() => ""}
    //   getTdClassName={(index) =>
    //     `p-3 border-t border-opacity-50 ${
    //       index === 0 ? "opacity-1" : "opacity-50"
    //     }`
    //   }
    // />
    <>
      <p>
        Loading existing views coming soon. Click the button below to create
        one:
      </p>
      <Link
        to={"/views/new/color"}
        className={
          "bg-sky-400 rounded-lg hover:bg-sky-600 active:bg-sky-800 px-4 py-2 mt-8 cursor-pointer inline-block"
        }
      >
        + New
      </Link>
    </>
  );
};

export const meta = getMeta({
  title: "Views",
});

export default ViewsPage;
