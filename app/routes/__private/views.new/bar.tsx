import AutoCompleteInput from "@dvargas92495/app/components/AutoCompleteInput";
import { Form, useLoaderData, useSearchParams } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/server-runtime";
import getBarGraphData from "~/data/getBarGraphData.server";
import { Chart, ChartOptions } from "react-charts";
import { useMemo } from "react";
import Select from "@dvargas92495/app/components/Select";

type BarGraphData = Awaited<ReturnType<typeof getBarGraphData>>;

const BarView = () => {
  const { data, users, contributor, contribution, x } = useLoaderData<BarGraphData>();
  const [searchParams, setSearchParams] = useSearchParams();

  const options = useMemo<
    Omit<ChartOptions<typeof data[number]["data"][number]>, "data">
  >(
    () => ({
      primaryAxis: { getValue: (data) => data.type },
      secondaryAxes: [{ getValue: (data) => data.amount, elementType: "bar" }],
    }),
    []
  );
  return (
    <div className="relative flex gap-32 w-full mt-4 h-96 items-stretch">
      <div className={"w-full max-w-3xl"}>
        <Chart
          options={{
            data,
            ...options,
          }}
        />
      </div>
      <Form method="get" className={"flex gap-4 flex-col"}>
        <AutoCompleteInput
          options={users}
          name={"contributor"}
          label={"Contributor"}
          defaultValue={contributor}
          className={"w-48"}
          onChange={(e) =>
            setSearchParams(
              {
                ...Object.fromEntries(searchParams),
                contributor: e as string,
              },
              { replace: false }
            )
          }
        />
        <Select
          name="contribution"
          label="Contribution"
          defaultValue={contribution}
          options={[
            "all",
            "tasks",
            "projects",
            "replies",
            "wiki",
            "initiatives",
          ]}
          onChange={(e) =>
            setSearchParams(
              {
                ...Object.fromEntries(searchParams),
                contribution: e as string,
              },
              { replace: false }
            )
          }
        />
        <Select
          name="x"
          label="X Axis"
          defaultValue={x}
          options={["count", "month", "tags"]}
          onChange={(e) =>
            setSearchParams(
              {
                ...Object.fromEntries(searchParams),
                x: e as string,
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
  const { searchParams } = new URL(request.url);
  const contributor = searchParams.get("contributor") || "everyone";
  const x = searchParams.get("x") || "count";
  const contribution = searchParams.get("contribution") || "all";
  // @ts-ignore
  return getBarGraphData({ contributor, x, contribution });
};

export const handle = {
  header: "New Color Graph",
};

export default BarView;
