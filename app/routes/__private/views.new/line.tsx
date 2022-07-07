import AutoCompleteInput from "@dvargas92495/app/components/AutoCompleteInput";
import { Form, useLoaderData, useSearchParams } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/server-runtime";
import getLineGraphData from "~/data/getLineGraphData.server";
import { Chart, ChartOptions } from "react-charts";
import { useMemo } from "react";
import Select from "@dvargas92495/app/components/Select";
import Title from "@dvargas92495/app/components/Title";

type LineGraphData = Awaited<ReturnType<typeof getLineGraphData>>;

const LineView = () => {
  const { data, users, contributor, contribution, tag, tags, interval } =
    useLoaderData<LineGraphData>();
  const [searchParams, setSearchParams] = useSearchParams();

  const options = useMemo<
    Omit<ChartOptions<typeof data[number]["data"][number]>, "data">
  >(
    () => ({
      primaryAxis: { getValue: (data) => data.type },
      secondaryAxes: [{ getValue: (data) => data.amount, elementType: "line" }],
    }),
    []
  );
  return (
    <div className="relative flex gap-32 w-full mt-4 h-96 items-stretch">
      <div className={"w-full max-w-3xl"}>
        {!data[0].data.length ? (
          <Title>No data found</Title>
        ) : (
          <Chart
            options={{
              data,
              ...options,
            }}
          />
        )}
      </div>
      <Form method="get" className={"flex gap-4 flex-col"}>
        <Title>Filters</Title>
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
        <AutoCompleteInput
          name="tag"
          label="Tag"
          defaultValue={tag}
          options={tags.map((t) => ({ id: t, label: t }))}
          onChange={(e) =>
            setSearchParams(
              {
                ...Object.fromEntries(searchParams),
                tag: e as string,
              },
              { replace: false }
            )
          }
        />
        <Select
          name="interval"
          label="Interval"
          defaultValue={interval}
          options={["month", "week", "quarter"]}
          onChange={(e) =>
            setSearchParams(
              {
                ...Object.fromEntries(searchParams),
                interval: e as string,
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
  return getLineGraphData(Object.fromEntries(searchParams));
};

export const handle = {
  header: "New Line Chart",
};

export default LineView;
