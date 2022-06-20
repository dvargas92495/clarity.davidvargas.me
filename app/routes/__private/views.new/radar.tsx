import href from "react-svg-radar-chart/build/css/index.css";
import type { LoaderFunction } from "@remix-run/node";
import { Form, useLoaderData, useSearchParams } from "@remix-run/react";
import getWorkData from "~/data/getWorkData.server";
export { default as CatchBoundary } from "@dvargas92495/app/components/DefaultCatchBoundary";
export { default as ErrorBoundary } from "@dvargas92495/app/components/DefaultErrorBoundary";
import AutoCompleteInput from "@dvargas92495/app/components/AutoCompleteInput";
import RadarChart, { ChartProps, ChartData } from "react-svg-radar-chart";
import WORK_TYPES from "~/enums/workTypes";
import Checkbox from "@dvargas92495/app/components/Checkbox";
import getMysqlConnection from "@dvargas92495/app/backend/mysql.server";

const DIMENSIONS = WORK_TYPES.flatMap((w) => [
  { id: `${w.id}-assigned`, name: `${w.name} Assigned` },
  { id: `${w.id}-authored`, name: `${w.name} Authored` },
]);
const nameById = Object.fromEntries(DIMENSIONS.map((d) => [d.id, d.name]));

const RadarView = () => {
  const { captions, radarData, users, dimensionsHidden, contributor } =
    useLoaderData<{
      captions: ChartProps["captions"];
      radarData: ChartData["data"];
      users: { id: string; label: string }[];
      dimensionsHidden: string[];
      contributor: string;
    }>();
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <div className="relative flex gap-32 w-full mt-4">
      <RadarChart
        captions={captions}
        data={[
          {
            data: radarData,
            meta: { color: "blue" },
          },
        ]}
        size={448}
      />
      <Form method="get" className={"flex gap-4"}>
        <div className="flex flex-col gap-2 w-48">
          <span className="block mb-2 text-sm font-medium text-gray-900">
            Hide Dimensions
          </span>
          <div className="grid col-span-3">
            {DIMENSIONS.map((d) => (
              <Checkbox
                name={"hide"}
                key={d.id}
                value={d.id}
                label={d.name}
                defaultChecked={!dimensionsHidden.includes(d.id)}
                onChange={(e) =>
                  setSearchParams(
                    {
                      ...searchParams,
                      hide: e.target.checked
                        ? searchParams.getAll("hide").filter((h) => h !== d.id)
                        : searchParams.getAll("hide").concat(d.id),
                    },
                    { replace: false }
                  )
                }
              />
            ))}
          </div>
        </div>
        <AutoCompleteInput
          options={users}
          name={"contributor"}
          label={"Contributor"}
          defaultValue={contributor}
          className={"w-48"}
          onChange={() =>
            setSearchParams(
              {
                ...searchParams,
                contributor: searchParams.get("contributor") || "",
              },
              { replace: false }
            )
          }
        />
      </Form>
    </div>
  );
};

type Work = Awaited<ReturnType<typeof getWorkData>>;

export const loader: LoaderFunction = async ({ request }) => {
  const searchParams = new URL(request.url).searchParams;
  const dimensionsHidden = searchParams.getAll("hide");
  const contributor = searchParams.get("contributor") || "everyone";
  return getMysqlConnection().then((cxn) =>
    Promise.all([
      cxn
        .execute(
          `SELECT 
          w.id, 
          w.date_closed, 
          w.work_type,
          w.author_id,
          w.assignee_id
        FROM work w`
        )
        .then(
          (a) =>
            a as {
              id: string;
              date_closed: Date;
              work_type: number;
              author_id?: string;
              assignee_id?: string;
            }[]
        ),
      cxn.execute(`SELECT id, name, username FROM users`).then(
        (a) =>
          a as {
            id: string;
            name: string;
            username: string;
          }[]
      ),
    ]).then(([work, _users]) => {
      cxn.destroy();
      const users = [{ id: "everyone", label: "Everyone" }].concat(
        _users
          .map((u) => ({ id: u.id, label: u.name || u.username }))
          .sort((a, b) => a.label.localeCompare(b.label))
      );
      const get = () => {
        const filteredData = (
          contributor === "everyone"
            ? work.flatMap((w) => [
                { ...w, typeId: `${w.work_type}-assigned` },
                { ...w, typeId: `${w.work_type}-authored` },
              ])
            : work
                .flatMap((w) => [
                  {
                    ...w,
                    typeId:
                      w.author_id === contributor && `${w.work_type}-assigned`,
                  },
                  {
                    ...w,
                    typeId:
                      w.assignee_id === contributor &&
                      `${w.work_type}-authored`,
                  },
                ])
                .filter((w) => w.typeId)
        ).filter(
          (w) =>
            !dimensionsHidden.some((d) => {
              return w.typeId === d;
            })
        );
        const groupedByType = filteredData.reduce((p, c) => {
          if (!c.typeId) return p;
          if (p[c.typeId]) {
            p[c.typeId].add(c.id);
          } else {
            p[c.typeId] = new Set([c.id]);
          }
          return p;
        }, {} as Record<Work[number]["type"], Set<string>>);
        const maxWork = Object.values(groupedByType).reduce(
          (p, c) => (c.size > p ? c.size : p),
          1
        );
        const keys = DIMENSIONS.map((d) => d.id).filter(
          (d) => !dimensionsHidden.includes(d)
        );
        return {
          captions: Object.fromEntries(
            keys.map((k) => [nameById[k], nameById[k]])
          ),
          radarData: Object.fromEntries(
            keys.map((k) => [
              nameById[k],
              (groupedByType[k]?.size || 0) / maxWork,
            ])
          ),
        };
      };
      return { ...get(), users, dimensionsHidden, contributor };
    })
  );
};

export const links = () => [{ rel: "stylesheet", href }];

export const handle = {
  header: "New Radar Chart",
};

export default RadarView;
