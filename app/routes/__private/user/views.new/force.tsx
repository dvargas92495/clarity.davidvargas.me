import React, { useEffect, useState } from "react";
import { useLoaderData } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/server-runtime";
import getWorkConnections from "../../../../data/getWorkConnections.server";

const ForceView = () => {
  const data = useLoaderData<Awaited<ReturnType<typeof getWorkConnections>>>()
  const [loaded, setLoaded] = useState<React.ReactNode>();
  useEffect(() => {
    import("react-force-graph").then(({ ForceGraph2D }) =>
      setLoaded(<ForceGraph2D graphData={data} height={800} width={800} />)
    );
  }, [setLoaded, data]);
  return <div><style>{`.force-graph-container {
    border: 1px dashed #88888880;
    border-radius: 16px;
    height: 800px;
    width: 800px;
  }`}</style>{loaded || "Loading..."}</div>;
};

export const loader: LoaderFunction = async () => {
  return getWorkConnections();
};

export const handle = {
  header: "New Force Graph",
};

export default ForceView;
