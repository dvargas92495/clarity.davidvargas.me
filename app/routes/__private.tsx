import React from "react";
import { Link, Outlet } from "remix";

const PrivatePage = () => {
  return (
    <div className="min-w-full min-h-full flex">
      <div className="flex flex-col min-h-full shadow bg-clarity-50 w-14 border-r-2 border-r-black border-opacity-10">
        <div className="flex flex-col items-center h-full overflow-y-auto pb-16">
          <a
            href={"/profile"}
            className={
              "h-11 w-11 rounded-xl bg-red-300 my-2 p-1 flex justify-center items-center"
            }
          >
            <img src="https://app.clarity.so/static/media/clarity-logomark-white.637858b3.svg" />
          </a>
          <div
            className={"mb-2 w-8 bg-black bg-opacity-10"}
            style={{ height: 1 }}
          />
          <div className="flex flex-col items-center gap-4">
            <Link to={"/user"}>
              <img
                className="h-11 w-11 rounded-xl"
                src={
                  "https://clarity-so.s3.amazonaws.com/baseAvatar/pf496uYXnSQ6b9TbtGNSKs.jpeg"
                }
              />
            </Link>
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
};

export default PrivatePage;
