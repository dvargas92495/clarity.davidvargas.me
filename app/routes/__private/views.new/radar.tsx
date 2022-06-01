import href from "react-svg-radar-chart/build/css/index.css";
import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import getWorkData from "~/data/getWorkData.server";
export { default as CatchBoundary } from "@dvargas92495/app/components/DefaultCatchBoundary";
export { default as ErrorBoundary } from "@dvargas92495/app/components/DefaultErrorBoundary";
import RadarChart from "react-svg-radar-chart";
import { useMemo } from "react";

const RadarView = () => {
  const data = useLoaderData<Work>();
  const groupedByType = useMemo(
    () =>
      data.reduce((p, c) => {
        if (p[c.type]) {
          p[c.type].push(c);
        } else {
          p[c.type] = [c];
        }
        return p;
      }, {} as Record<Work[number]["type"], Work[number][]>),
    [data]
  );
  const maxWork = Object.values(groupedByType).reduce(
    (p, c) => (c.length > p ? c.length : p),
    0
  );
  return (
    <div className="relative w-min">
      <RadarChart
        captions={Object.fromEntries(
          Object.keys(groupedByType).map((k) => [k, k])
        )}
        data={[
          {
            data: Object.fromEntries(
              Object.keys(groupedByType).map((k) => [
                k,
                groupedByType[k].length / maxWork,
              ])
            ),
            meta: { color: "blue" },
          },
        ]}
        size={450}
      />
    </div>
  );
};

type Work = Awaited<ReturnType<typeof getWorkData>>;

export const loader: LoaderFunction = async () => {
  return getWorkData();
};

export const links = () => [{ rel: "stylesheet", href }];

export const handle = {
  header: "New Radar Chart",
};

export default RadarView;
