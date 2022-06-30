import AutoCompleteInput from "@dvargas92495/app/components/AutoCompleteInput";
import { Form, useLoaderData, useSearchParams } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/server-runtime";
import getBarGraphData from "~/data/getBarGraphData.server";
import { Chart, ChartOptions } from "react-charts";
import { useMemo } from "react";

type BarGraphData = Awaited<ReturnType<typeof getBarGraphData>>;

const BarView = () => {
  const { data, users, contributor } = useLoaderData<BarGraphData>();
  const [searchParams, setSearchParams] = useSearchParams();

  const barChartData = Object.entries(data).map(([label, items]) => ({
    label,
    data: [
      {
        type: "contributions",
        amount: items.length,
      },
    ],
  }));
  const barChartOptions = useMemo<
    Omit<ChartOptions<typeof barChartData[number]["data"][number]>, "data">
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
            data: barChartData,
            ...barChartOptions,
          }}
        />
      </div>
      <Form method="get" className={"flex gap-4"}>
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
  const contributor =
    new URL(request.url).searchParams.get("contributor") || "everyone";
  return getBarGraphData(contributor);
};

export const handle = {
  header: "New Color Graph",
};

export default BarView;
