import React from "react";
import { Link } from "@remix-run/react";

const Home: React.FC = () => (
  <div className="flex flex-col h-full">
    <div className="bg-clarity-50 flex flex-col pt-60 items-center w-full flex-grow">
      <Link
        to={"/views"}
        className={
          "absolute top-6 right-6 bg-clarity-300 px-4 py-2 cursor-pointer rounded-lg shadow-sm hover:shadow-md active:shadow-none"
        }
      >
        Check out some views!
      </Link>
      <h1 className="text-2xl font-extrabold">
        The simplest workspace for decentralized teams
      </h1>
      <p>
        Ignore everything else on this website template and just click login on
        the top right to get to the demo!
      </p>
    </div>
  </div>
);

export default Home;
