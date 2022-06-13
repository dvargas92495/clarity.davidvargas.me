import href from "react-svg-radar-chart/build/css/index.css";
import type { LoaderFunction } from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useSubmit,
  useSearchParams,
} from "@remix-run/react";
import getWorkData from "~/data/getWorkData.server";
export { default as CatchBoundary } from "@dvargas92495/app/components/DefaultCatchBoundary";
export { default as ErrorBoundary } from "@dvargas92495/app/components/DefaultErrorBoundary";
import Select from "@dvargas92495/app/components/Select";
import RadarChart, { ChartProps, ChartData } from "react-svg-radar-chart";
import { useCallback, useRef } from "react";

const DIMENSIONS = [
  { id: 0, label: "Work Type" },
  { id: 1, label: "Tag" },
];

const userToId = (user: string) => user.toLowerCase().replace(/ /g, "_");

const RadarView = () => {
  const { captions, radarData, users, dimension, contributor } = useLoaderData<{
    captions: ChartProps["captions"];
    radarData: ChartData["data"];
    users: { id: string; label: string }[];
    dimension: number;
    contributor: string;
  }>();

  // const submit = useSubmit();
  // const formRef = useRef<HTMLFormElement>(null);
  // const onChange = useCallback(
  //   () => submit(formRef.current),
  //   [submit, formRef]
  // );
  const [searchParams, setSearchParams] = useSearchParams();

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
      <Form
        method="get"
        className={"flex flex-col"}
        // ref={formRef}
        // onChange={(e) => submit(formRef.current)}
      >
        <Select
          options={DIMENSIONS}
          name={"dimension"}
          label={"Dimension"}
          defaultValue={dimension}
          onChange={(dimension) =>
            setSearchParams({ ...searchParams, dimension: `${dimension}` })
          }
        />
        <i>Below input still under development</i>
        <Select
          options={users}
          name={"contributor"}
          label={"Contributor"}
          defaultValue={contributor}
          onChange={(contributor) =>
            setSearchParams({ ...searchParams, contributor: `${contributor}` })
          }
        />
      </Form>
    </div>
  );
};

type Work = Awaited<ReturnType<typeof getWorkData>>;

export const loader: LoaderFunction = async ({ request }) => {
  return getWorkData().then((data) => {
    const searchParams = new URL(request.url).searchParams;
    const dimension = Number(searchParams.get("dimension") || 0);
    const contributor = searchParams.get("contributor") || "all";
    const users = Object.entries(
      Object.fromEntries(
        Array.from(new Set(data.flatMap((d) => [d.author, d.assignee])))
          .map((user) => [userToId(user), user])
          .concat([["all", "ALL"]])
      )
    ).map(([id, label]) => ({ id, label }));
    const get = () => {
      const filteredData =
        contributor === "all"
          ? data.map((d) => ({ ...d, isAuthor: true, isAssignee: true }))
          : data
              .map((d) => ({
                ...d,
                isAuthor: userToId(d.author) === contributor,
                isAssignee: userToId(d.assignee) === contributor,
              }))
              .filter((d) => d.isAuthor || d.isAssignee);
      if (dimension === 0) {
        const groupedByType = filteredData.reduce((p, c) => {
          const add = (type: string) => {
            if (p[type]) {
              p[type].add(c.id);
            } else {
              p[type] = new Set([c.id]);
            }
          };
          if (c.isAssignee) {
            add(`${c.type} Assigned`);
          }
          if (c.isAuthor) {
            add(`${c.type} Authored`);
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
        const groupedByTag = filteredData.reduce((p, c) => {
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
    };
    return { ...get(), users, dimension, contributor };
  });
};

export const links = () => [{ rel: "stylesheet", href }];

export const handle = {
  header: "New Radar Chart",
};

export default RadarView;
