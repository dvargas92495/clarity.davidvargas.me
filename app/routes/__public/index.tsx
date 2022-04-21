import React from "react";
import { Link } from "@remix-run/react";

const Home: React.FC = () => (
  <div className="bg-clarity-50 flex flex-col pt-60 items-center w-full">
    <Link to={"/user"} className={"absolute top-2 right-2"}>
      Sign in with ethereum
    </Link>
    <h1 className="text-2xl font-extrabold">
      The simplest workspace for decentralized teams
    </h1>
    <p>
      Ignore everything else on this website template and just click login on
      the top right to get to the demo!
    </p>
  </div>
);

export default Home;
