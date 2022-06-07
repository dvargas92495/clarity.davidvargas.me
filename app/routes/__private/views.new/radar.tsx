import href from "react-svg-radar-chart/build/css/index.css";
import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import getWorkData from "~/data/getWorkData.server";
export { default as CatchBoundary } from "@dvargas92495/app/components/DefaultCatchBoundary";
export { default as ErrorBoundary } from "@dvargas92495/app/components/DefaultErrorBoundary";
import Select from "@dvargas92495/app/components/Select";
import RadarChart from "react-svg-radar-chart";
import { useMemo } from "react";

const DIMENSIONS = [
  { id: 0, label: "Work Type" },
  { id: 1, label: "Author" },
  { id: 2, label: "Tag" },
];

const RadarView = () => {
  const data = useLoaderData<Work>();

  const [searchParams, setSearchParams] = useSearchParams();
  const dimension = Number(searchParams.get("dimension") || 0);
  const { captions, radarData } = useMemo(() => {
    if (dimension === 0) {
      const groupedByType = data.reduce((p, c) => {
        if (p[c.type]) {
          p[c.type].add(c.id);
        } else {
          p[c.type] = new Set([c.id]);
        }
        return p;
      }, {} as Record<Work[number]["type"], Set<string>>);
      const maxWork = Object.values(groupedByType).reduce(
        (p, c) => (c.size > p ? c.size : p),
        0
      );
      return {
        captions: Object.fromEntries(
          Object.keys(groupedByType).map((k) => [k, k])
        ),
        radarData: Object.fromEntries(
          Object.keys(groupedByType).map((k) => [
            k,
            groupedByType[k].size / maxWork,
          ])
        ),
      };
    } else if (dimension === 1) {
      const nameByUser = Object.fromEntries(
        data.map((d) => [d.authorId, d.user])
      );
      const groupedByAuthor = data.reduce((p, c) => {
        if (p[c.authorId]) {
          p[c.authorId].add(c.id);
        } else {
          p[c.authorId] = new Set([c.id]);
        }
        return p;
      }, {} as Record<Work[number]["type"], Set<string>>);
      const maxWork = Object.values(groupedByAuthor).reduce(
        (p, c) => (c.size > p ? c.size : p),
        0
      );
      return {
        captions: Object.fromEntries(
          Object.keys(groupedByAuthor).map((k) => [
            k,
            nameByUser[k] || "Unknown User",
          ])
        ),
        radarData: Object.fromEntries(
          Object.keys(groupedByAuthor).map((k) => [
            k,
            groupedByAuthor[k].size / maxWork,
          ])
        ),
      };
    } else if (dimension === 2) {
      const groupedByTag = data.reduce((p, c) => {
        if (p[c.tag]) {
          p[c.tag].add(c.id);
        } else {
          p[c.tag] = new Set([c.id]);
        }
        return p;
      }, {} as Record<Work[number]["type"], Set<string>>);
      const maxWork = Object.values(groupedByTag).reduce(
        (p, c) => (c.size > p ? c.size : p),
        0
      );
      return {
        captions: Object.fromEntries(
          Object.keys(groupedByTag).map((k) => [k, k])
        ),
        radarData: Object.fromEntries(
          Object.keys(groupedByTag).map((k) => [
            k,
            groupedByTag[k].size / maxWork,
          ])
        ),
      };
    } else {
      return {
        captions: {},
        radarData: {},
      };
    }
  }, [dimension]);
  return (
    <div className="relative w-min">
      <RadarChart
        captions={captions}
        data={[
          {
            data: radarData,
            meta: { color: "blue" },
          },
        ]}
        size={450}
      />
      <div className={"flex flex-col"}>
        <Select
          options={DIMENSIONS}
          label={"Dimension"}
          onChange={(dimension) =>
            setSearchParams({ dimension: `${dimension}` })
          }
          defaultValue={dimension}
        />
      </div>
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
