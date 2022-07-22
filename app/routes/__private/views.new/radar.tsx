import href from "react-svg-radar-chart/build/css/index.css";
import type { LoaderFunction } from "@remix-run/node";
import { Form, useLoaderData, useSearchParams } from "@remix-run/react";
export { default as CatchBoundary } from "@dvargas92495/app/components/DefaultCatchBoundary";
export { default as ErrorBoundary } from "@dvargas92495/app/components/DefaultErrorBoundary";
import AutoCompleteInput from "@dvargas92495/app/components/AutoCompleteInput";
import RadarChart, { ChartProps, ChartData } from "react-svg-radar-chart";
import WORK_TYPES from "~/enums/workTypes";
import Checkbox from "@dvargas92495/app/components/Checkbox";
import getMysqlConnection from "@dvargas92495/app/backend/mysql.server";
import getAllUsers from "~/data/getAllUsers.server";

const DIMENSIONS = WORK_TYPES.filter((w) => w.name !== "Initiative")
  .flatMap((w) => [
    { id: `${w.id}-assigned`, name: `${w.name} Assigned` },
    { id: `${w.id}-authored`, name: `${w.name} Authored` },
  ])
  .concat([
    { id: "replies", name: "Replies" },
    { id: "wikis", name: "Wiki Contributions" },
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
          onChange={(e) =>
            setSearchParams(
              {
                ...searchParams,
                contributor: e as string,
              },
              { replace: false }
            )
          }
        />
      </Form>
    </div>
  );
};

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
      getAllUsers(cxn.execute),
      cxn
        .execute(`SELECT r.id, r.author_id, r.date FROM replies r`)
        .then((a) => a as { author_id: string; id: string; date: Date }[]),
      cxn
        .execute(
          `SELECT w.id, w.created_by, w.count, w.day
      FROM wiki_contributions w`
        )
        .then(
          (a) =>
            a as { created_by: string; id: string; count: number; day: Date }[]
        ),
    ]).then(([work, users, replies, wikis]) => {
      cxn.destroy();
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
        )
          .filter(
            (w) =>
              !dimensionsHidden.some((d) => {
                return w.typeId === d;
              })
          )
          .map((w) => ({ typeId: w.typeId, count: 1 }));
        const filteredReplies = (
          contributor === "everyone"
            ? replies
            : replies.filter((d) => d.author_id === contributor)
        ).map(() => ({
          typeId: "replies" as const,
          count: 1,
        }));
        const filteredWikis = (
          contributor === "everyone"
            ? wikis
            : wikis.filter((d) => d.created_by === contributor)
        ).map((r) => ({
          typeId: "wikis" as const,
          count: r.count,
        }));
        const groupedByType = filteredData
          .concat(filteredReplies)
          .concat(filteredWikis)
          .reduce((p, c) => {
            if (!c.typeId) return p;
            if (p[c.typeId]) {
              p[c.typeId] += c.count;
            } else {
              p[c.typeId] = c.count;
            }
            return p;
          }, {} as Record<string, number>);

        const keys = DIMENSIONS.map((d) => d.id).filter(
          (d) => !dimensionsHidden.includes(d)
        );
        const maxWork = keys
          .map((k) => groupedByType[k] || 0)
          .reduce((p, c) => (c > p ? c : p), 1);
        return {
          captions: Object.fromEntries(
            keys.map((k) => [nameById[k], nameById[k]])
          ),
          radarData: Object.fromEntries(
            keys.map((k) => [nameById[k], (groupedByType[k] || 0) / maxWork])
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
