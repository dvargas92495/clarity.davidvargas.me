import React, { useMemo, useState } from "react";
import { Transition } from "@headlessui/react";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/server-runtime";
import NumberInput from "@dvargas92495/app/components/NumberInput";
import dateFormat from "date-fns/format";
import dateParse from "date-fns/parse";
import addWeeks from "date-fns/addWeeks";
import differenceInWeeks from "date-fns/differenceInWeeks";
import addDays from "date-fns/addDays";
import subYears from "date-fns/subYears";
import subMonths from "date-fns/subMonths";
import isAfter from "date-fns/isAfter";
import startOfWeek from "date-fns/startOfWeek";
import WORK_TYPES, { workById } from "../../../enums/workTypes";
import BaseInput from "@dvargas92495/app/components/BaseInput";
import getAllUsers from "~/data/getAllUsers.server";
import getMysqlConnection from "@dvargas92495/app/backend/mysql.server";
import AutoCompleteInput from "@dvargas92495/app/components/AutoCompleteInput";

const VALID_WORK_TYPES = WORK_TYPES.map((w) => w.name);

const ColorView = () => {
  const contributions =
    useLoaderData<Awaited<ReturnType<typeof getContributionsData>>>();
  const [searchParams, setSearchParams] = useSearchParams();
  const maxContribution = Object.values(contributions.data).reduce(
    (p, c) => (c.length > p ? c.length : p),
    0
  );
  const defaultThresholds = useMemo(
    () => [
      { level: 15, background: "#155b1e" },
      { level: 6, background: "#329a34" },
      { level: 3, background: "#61c14e" },
      { level: 2, background: "#a0d27f" },
      { level: 1, background: "#b9e1a8" },
    ],
    [maxContribution]
  );
  const [colorThresholds, setColorThresholds] = useState(defaultThresholds);

  const maxDate = new Date();
  const defaultMinDate = startOfWeek(subYears(maxDate, 1)).valueOf();
  const [minDate, setMinDate] = useState(defaultMinDate);
  const [validTypes, setValidTypes] = useState(new Set(VALID_WORK_TYPES));

  const filteredContributions = useMemo(() => {
    return Object.fromEntries(
      Object.entries(contributions.data)
        .filter(([k]) =>
          isAfter(dateParse(k, "yyyy-MM-dd", new Date(0)), minDate)
        )
        .map(([k, works]) => {
          return [k, works.filter((w) => validTypes.has(w.type))] as const;
        })
        .filter(([, v]) => !!v.length)
    );
  }, [minDate, validTypes, contributions.data]);

  const total = Object.values(filteredContributions).reduce(
    (p, c) => p + c.length,
    0
  );
  const numColumns = differenceInWeeks(maxDate, minDate) + 1;
  const headers = Array(numColumns)
    .fill(null)
    .map((_, w) => addWeeks(minDate, w))
    .reduce(
      (p, c) => {
        const last = p.slice(-1)[0];
        if (last.date.getMonth() !== c.getMonth()) {
          p.push({ date: c, colSpan: 1 });
        } else {
          last.colSpan++;
        }
        return p;
      },
      [{ date: new Date(minDate), colSpan: 0 }]
    );

  const ColorViewCell = ({ week, day }: { week: number; day: number }) => {
    const [isOpen, setIsOpen] = useState(false);
    const date = addWeeks(addDays(minDate, day), week);
    const key = dateFormat(date, "yyyy-MM-dd");
    const count = filteredContributions[key]?.length || 0;
    const { background } = colorThresholds.find((c) => count >= c.level) || {
      background: "rgba(0,0,0, 0.1)",
    };
    return (
      <td
        onMouseEnter={() => setIsOpen(true)}
        onMouseMove={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={"p-0.5 relative"}
      >
        <div
          className={`h-4 w-4 rounded-sm hover:border hover:border-opacity-75 hover:border-black`}
          style={{ background }}
        />
        <Transition
          as={React.Fragment}
          show={isOpen}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <div className={`absolute z-30 bottom-full`}>
            <div className="bg-white rounded-md shadow-lg px-2 py-1 whitespace-nowrap relative -left-1/2">
              <span className="text-sm opacity-75">{count} contributions</span>{" "}
              <span className="text-sm opacity-50">{key}</span>
            </div>
          </div>
        </Transition>
      </td>
    );
  };
  return (
    <div className="relative w-min">
      <div className="px-1 flex space-between items-center mb-2">
        <h2 className="text-normal mb-2 text-lg flex-grow">
          {total} total contributions
        </h2>
        <select
          onChange={(e) => setMinDate(Number(e.target.value))}
          className={
            "bg-black bg-opacity-10 rounded-md border-none text-sm py-1 pl-2 pr-8 cursor-pointer outline-none"
          }
        >
          <option value={defaultMinDate}>Last 12 months</option>
          <option value={startOfWeek(subMonths(maxDate, 9)).valueOf()}>
            Last 9 months
          </option>
          <option value={startOfWeek(subMonths(maxDate, 6)).valueOf()}>
            Last 6 months
          </option>
          <option value={startOfWeek(subMonths(maxDate, 3)).valueOf()}>
            Last 3 months
          </option>
        </select>
      </div>
      <div className="border py-2 rounded-md w-min">
        <table className="mx-2 pt-1 text-center h-full">
          <thead>
            <tr className="text-xs font-normal text-left">
              <th />
              {headers.map(({ date, colSpan }, index) => {
                return (
                  <th colSpan={colSpan} className={"pl-1"} key={index}>
                    {colSpan > 1 ? dateFormat(date, "MMM") : ""}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Array(7)
              .fill(null)
              .map((_, day) => {
                return (
                  <tr key={day}>
                    <td className="text-xs">
                      {day === 1 && "Mon"}
                      {day === 3 && "Wed"}
                      {day === 5 && "Fri"}
                    </td>
                    {Array(numColumns)
                      .fill(null)
                      .map((_, week) => (
                        <ColorViewCell key={week} week={week} day={day} />
                      ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <div className="mt-12 flex gap-32">
        <div className="flex gap-16 items-start justify-start">
          <div>
            <h2 className={"text-lg font-semibold mb-3"}>Color Thresholds</h2>
            {defaultThresholds.map((c, i) => (
              <div key={i} className={"mb-2 w-32 flex gap-4 items-center"}>
                <NumberInput
                  defaultValue={c.level}
                  onChange={(e) =>
                    setColorThresholds(
                      colorThresholds.map((ct, j) =>
                        i === j ? { ...ct, level: Number(e.target.value) } : ct
                      )
                    )
                  }
                  disabled={i === defaultThresholds.length - 1}
                />
                <input
                  defaultValue={c.background}
                  onChange={(e) =>
                    setColorThresholds(
                      colorThresholds.map((ct, j) =>
                        i === j ? { ...ct, background: e.target.value } : ct
                      )
                    )
                  }
                  type={"color"}
                />
              </div>
            ))}
          </div>
          <div>
            <h2 className={"text-lg font-semibold mb-3"}>Work Types</h2>
            {VALID_WORK_TYPES.map((c) => (
              <BaseInput
                key={c}
                defaultChecked={validTypes.has(c)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  if (checked) {
                    validTypes.add(c);
                  } else {
                    validTypes.delete(c);
                  }
                  setValidTypes(new Set(validTypes));
                }}
                type={"checkbox"}
                label={c}
                name={"workType"}
                value={c}
                inputClassname={"w-6 h-6 mb-2"}
                className={"flex flex-row-reverse gap-2 justify-end"}
              />
            ))}
          </div>
          <div>
            <AutoCompleteInput
              options={contributions.users}
              name={"contributor"}
              label={"Contributor"}
              defaultValue={contributions.contributor}
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
          </div>
        </div>
      </div>
    </div>
  );
};

const getContributionsData = (contributor: string) => {
  return getMysqlConnection().then((cxn) =>
    Promise.all([
      cxn
        .execute(
          `SELECT 
      w.id, 
      w.date_closed, 
      w.work_type,
      w.assignee_id,
      w.author_id,
      w.reviewer_id 
    FROM work w`
        )
        .then(
          (a) =>
            a as {
              id: string;
              date_closed: Date;
              work_type: number;
              author_id: string;
              assignee_id: string;
              reviewer_id: string;
            }[]
        )
        .then((a) =>
          a.map((r) => ({
            id: r.id,
            date: r.date_closed.toJSON(),
            type: workById[r.work_type],
            contributors: [r.assignee_id, r.author_id, r.reviewer_id].filter(
              Boolean
            ),
          }))
        ),
      getAllUsers(cxn.execute),
      cxn
        .execute(
          `SELECT 
      c.user_id, 
      c.work_id
    FROM contributors c`
        )
        .then((a) => a as { user_id: string; work_id: string }[])
        .then((a) =>
          a.map((r) => ({
            user: r.user_id,
            work: r.work_id,
          }))
        ),
    ]).then(([data, users, contributors]) => {
      cxn.destroy();
      const relevantContributions =
        contributor === "everyone"
          ? new Set<string>()
          : new Set(
              contributors
                .filter((w) => w.user === contributor)
                .map((w) => w.work)
            );
      const filteredData =
        contributor === "everyone"
          ? data
          : data.filter(
              (d) =>
                relevantContributions.has(d.id) ||
                d.contributors.includes(contributor)
            );
      return {
        data: filteredData.reduce((p, c) => {
          const key = dateFormat(new Date(c.date), "yyyy-MM-dd");
          const item = { id: c.id, type: c.type };
          if (p[key]) {
            p[key].push(item);
          } else {
            p[key] = [item];
          }
          return p;
        }, {} as Record<string, { id: string; type: "Task" | "Project" | "Goal" }[]>),
        users,
        contributor,
      };
    })
  );
};

export const loader: LoaderFunction = async ({ request }) => {
  const contributor =
    new URL(request.url).searchParams.get("contributor") || "everyone";
  return getContributionsData(contributor);
};

export const handle = {
  header: "New Color Graph",
};

export default ColorView;
