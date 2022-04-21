import React from "react";
import type { LoaderFunction } from "@remix-run/server-runtime";
import Table from "@dvargas92495/ui/components/Table";

const ViewsPage = () => {
  return (
    <div className="p-8">
      <Table
        className={"w-full"}
        thClassName={"cursor-pointer p-3 font-medium opacity-50 text-left"}
        theadClassName={""}
        getTrClassName={() => ""}
        getTdClassName={(index) =>
          `p-3 border-t border-opacity-50 ${
            index === 0 ? "opacity-1" : "opacity-50"
          }`
        }
      />
    </div>
  );
};

export const loader: LoaderFunction = () => {
  return {
    data: [
      {
        name: "Bounties Owed",
        updated: "Jan 11, 2022",
        created: "Dec 14, 2021",
      },
      {
        name: "Founder Roles",
        updated: "Oct 7, 2021",
        created: "Oct 7, 2021",
      },
      {
        name: "Product Guild Bounties",
        updated: "Feb 2, 2022",
        created: "Dec 2, 2021",
      },
    ],
    columns: [
      { Header: "Name", accessor: "name" },
      { Header: "Updated", accessor: "updated" },
      { Header: "Created", accessor: "created" },
    ],
  };
};

export default ViewsPage;
