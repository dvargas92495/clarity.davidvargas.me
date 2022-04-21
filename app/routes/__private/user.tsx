import React, { useState } from "react";
import { UserButton, useUser } from "@clerk/remix";
import getMeta from "@dvargas92495/ui/utils/getMeta";
export { default as CatchBoundary } from "@dvargas92495/ui/components/DefaultCatchBoundary";
export { default as ErrorBoundary } from "@dvargas92495/ui/components/DefaultErrorBoundary";
import { Link, Outlet, useMatches } from "@remix-run/react";

const TABS = [{ id: "assigned" }, { id: "views" }, { id: "roadmap" }];

const Tab = ({ active, id }: { active: boolean; id: string }) => {
  const [showAdd, setShowAdd] = useState(false);
  return (
    <div className="h-8 p-1 mb-1 text-sm font-medium opacity-50">
      <Link to={`/user/${id}`}>
        <div
          className={`cursor-pointer hover:bg-clarity-100 min-h-full flex items-center p-1 ${
            active ? "bg-clarity-300 text-black font-bold" : ""
          } capitalize justify-between`}
          onMouseEnter={() => setShowAdd(true)}
          onMouseMove={() => setShowAdd(true)}
          onMouseLeave={() => setShowAdd(false)}
        >
          <span className="flex items-center">
            <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-gray-200">
              <path
                d="M19 5h-2V3c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v2H9V3c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v2H1c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1zM8.71 15.29a1.003 1.003 0 01-1.42 1.42l-4-4C3.11 12.53 3 12.28 3 12s.11-.53.29-.71l4-4a1.003 1.003 0 011.42 1.42L5.41 12l3.3 3.29zm8-2.58l-4 4a1.003 1.003 0 01-1.42-1.42l3.3-3.29-3.29-3.29A.965.965 0 0111 8a1.003 1.003 0 011.71-.71l4 4c.18.18.29.43.29.71s-.11.53-.29.71z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
            <span className={"ml-2"}>{id}</span>
          </span>
          {showAdd && (
            <Link to={`/user/${id}/new`}>
              <button className="mr-2 bg-clarity-100 cursor-pointer h-6 w-6 rounded-sm font-extrabold hover:bg-clarity-200 text-lg">
                +
              </button>
            </Link>
          )}
        </div>
      </Link>
    </div>
  );
};

const UserPage: React.FunctionComponent = () => {
  const user = useUser();
  const matches = useMatches();
  const currentTabPath = matches
    .slice(-1)[0]
    .pathname.replace(/^\/user\//, "")
    .replace(/^\//, "")
    .replace(/\/$/, "");
  const currentTab = currentTabPath || "Dashboard";
  const handle = matches.map((m) => m.handle).find((t) => !!t);
  return (
    <div className="flex-grow flex">
      <nav className="bg-clarity-50 min-h-full w-72 flex flex-col border-r-2 border-r-black border-opacity-10">
        <div className="p-3 h-14 flex items-center">
          <div className="flex items-center gap-3 hover:bg-clarity-100 cursor-pointer w-fit">
            <img
              className="h-5 w-5"
              src="https://tailwindui.com/img/logos/workflow-mark-indigo-500.svg"
              alt="Workflow"
            />
            <img
              className="h-5 w-5"
              src="https://tailwindui.com/img/logos/workflow-mark-indigo-500.svg"
              alt="Workflow"
            />
            <img
              className="h-5 w-5"
              src="https://tailwindui.com/img/logos/workflow-mark-indigo-500.svg"
              alt="Workflow"
            />
          </div>
        </div>
        <div className="flex-grow">
          {TABS.map((tab) => (
            <Tab key={tab.id} id={tab.id} active={currentTab === tab.id} />
          ))}
        </div>
        <div className="h-12 bg-clarity-50 flex items-center px-4 border-t-2 border-t-black border-opacity-10">
          <UserButton />
          <div className="ml-4">
            {user.user?.firstName} {user.user?.lastName}
          </div>
        </div>
      </nav>
      <div className="flex-grow flex flex-col">
        <div className="h-14 flex p-4 border-b-2 border-b-black border-opacity-10 justify-between">
          <h1 className="capitalize text-md font-bold">{handle?.header || currentTab}</h1>
          <span className="flex gap-4 items-center">{handle?.Toolbar && <handle.Toolbar />}</span>
        </div>
        <div className="flex-grow p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export const meta = getMeta({
  title: "user",
});

export default UserPage;
