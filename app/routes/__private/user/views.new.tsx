import React, { useState } from "react";
import { Popover, Transition } from "@headlessui/react";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/server-runtime";
import subDays from "date-fns/subDays";
import dateFormat from "date-fns/format";
import dateParse from "date-fns/parse";
import addWeeks from "date-fns/addWeeks";
import addDays from "date-fns/addDays";
import addMonths from "date-fns/addMonths";
import subYears from "date-fns/subYears";
import startOfWeek from "date-fns/startOfWeek";

const VIEW_TYPES = [
  {
    id: "Color",
    Icon: (
      <svg
        viewBox="0 0 24 24"
        focusable="false"
        width="1em"
        height="1em"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.28.73-.55v-1.84c-3.03.64-3.67-1.46-3.67-1.46-.55-1.29-1.28-1.65-1.28-1.65-.92-.65.1-.65.1-.65 1.1 0 1.73 1.1 1.73 1.1.92 1.65 2.57 1.2 3.21.92a2 2 0 01.64-1.47c-2.47-.27-5.04-1.19-5.04-5.5 0-1.1.46-2.1 1.2-2.84a3.76 3.76 0 010-2.93s.91-.28 3.11 1.1c1.8-.49 3.7-.49 5.5 0 2.1-1.38 3.02-1.1 3.02-1.1a3.76 3.76 0 010 2.93c.83.74 1.2 1.74 1.2 2.94 0 4.21-2.57 5.13-5.04 5.4.45.37.82.92.82 2.02v3.03c0 .27.1.64.73.55A11 11 0 0012 1.27" />
      </svg>
    ),
  },
  {
    id: "Force",
    Icon: (
      <svg
        viewBox="0 0 24 24"
        focusable="false"
        width="1em"
        height="1em"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M23 8c0 1.1-.9 2-2 2-.18 0-.35-.02-.51-.07l-3.56 3.55c.05.16.07.34.07.52 0 1.1-.9 2-2 2s-2-.9-2-2c0-.18.02-.36.07-.52l-2.55-2.55c-.16.05-.34.07-.52.07s-.36-.02-.52-.07l-4.55 4.56c.05.16.07.33.07.51 0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.18 0 .35.02.51.07l4.56-4.55C8.02 9.36 8 9.18 8 9c0-1.1.9-2 2-2s2 .9 2 2c0 .18-.02.36-.07.52l2.55 2.55c.16-.05.34-.07.52-.07s.36.02.52.07l3.55-3.56C19.02 8.35 19 8.18 19 8c0-1.1.9-2 2-2s2 .9 2 2z" />
      </svg>
    ),
  },
  {
    id: "Kanban",
    Icon: (
      <svg
        viewBox="64 64 896 896"
        focusable="false"
        data-icon="project"
        width="1em"
        height="1em"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M280 752h80c4.4 0 8-3.6 8-8V280c0-4.4-3.6-8-8-8h-80c-4.4 0-8 3.6-8 8v464c0 4.4 3.6 8 8 8zm192-280h80c4.4 0 8-3.6 8-8V280c0-4.4-3.6-8-8-8h-80c-4.4 0-8 3.6-8 8v184c0 4.4 3.6 8 8 8zm192 72h80c4.4 0 8-3.6 8-8V280c0-4.4-3.6-8-8-8h-80c-4.4 0-8 3.6-8 8v256c0 4.4 3.6 8 8 8zm216-432H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656z" />
      </svg>
    ),
  },
  {
    id: "Table",
    Icon: (
      <svg
        viewBox="64 64 896 896"
        focusable="false"
        data-icon="unordered-list"
        width="1em"
        height="1em"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M912 192H328c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h584c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm0 284H328c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h584c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm0 284H328c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h584c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zM104 228a56 56 0 10112 0 56 56 0 10-112 0zm0 284a56 56 0 10112 0 56 56 0 10-112 0zm0 284a56 56 0 10112 0 56 56 0 10-112 0z" />
      </svg>
    ),
  },
];

const IconPopover = ({
  Icon,
  children,
}: React.PropsWithChildren<{ Icon: React.FC<{ className: string }> }>) => {
  return (
    <span>
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button
              className={`p-2 rounded-md inline-flex items-center text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`}
            >
              <Icon
                className={`text-opacity-60 ${
                  open ? "" : "text-opacity-70"
                } ml-2 h-5 w-5 group-hover:text-opacity-80 transition ease-in-out duration-150`}
                aria-hidden="true"
              />
            </Popover.Button>
            <Transition
              as={React.Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute z-10 w-64 px-4 mt-3 transform -translate-x-full lg:max-w-3xl">
                {children}
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </span>
  );
};

const Toolbar = () => {
  return (
    <>
      <IconPopover
        Icon={({ className }) => (
          <svg
            viewBox="64 64 896 896"
            focusable="false"
            data-icon="control"
            width="1em"
            height="1em"
            fill="currentColor"
            aria-hidden="true"
            className={className}
          >
            <path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656zM340 683v77c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8v-77c-10.1 3.3-20.8 5-32 5s-21.9-1.8-32-5zm64-198V264c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v221c10.1-3.3 20.8-5 32-5s21.9 1.8 32 5zm-64 198c10.1 3.3 20.8 5 32 5s21.9-1.8 32-5c41.8-13.5 72-52.7 72-99s-30.2-85.5-72-99c-10.1-3.3-20.8-5-32-5s-21.9 1.8-32 5c-41.8 13.5-72 52.7-72 99s30.2 85.5 72 99zm.1-115.7c.3-.6.7-1.2 1-1.8v-.1l1.2-1.8c.1-.2.2-.3.3-.5.3-.5.7-.9 1-1.4.1-.1.2-.3.3-.4.5-.6.9-1.1 1.4-1.6l.3-.3 1.2-1.2.4-.4c.5-.5 1-.9 1.6-1.4.6-.5 1.1-.9 1.7-1.3.2-.1.3-.2.5-.3.5-.3.9-.7 1.4-1 .1-.1.3-.2.4-.3.6-.4 1.2-.7 1.9-1.1.1-.1.3-.1.4-.2.5-.3 1-.5 1.6-.8l.6-.3c.7-.3 1.3-.6 2-.8.7-.3 1.4-.5 2.1-.7.2-.1.4-.1.6-.2.6-.2 1.1-.3 1.7-.4.2 0 .3-.1.5-.1.7-.2 1.5-.3 2.2-.4.2 0 .3 0 .5-.1.6-.1 1.2-.1 1.8-.2h.6c.8 0 1.5-.1 2.3-.1s1.5 0 2.3.1h.6c.6 0 1.2.1 1.8.2.2 0 .3 0 .5.1.7.1 1.5.2 2.2.4.2 0 .3.1.5.1.6.1 1.2.3 1.7.4.2.1.4.1.6.2.7.2 1.4.4 2.1.7.7.2 1.3.5 2 .8l.6.3c.5.2 1.1.5 1.6.8.1.1.3.1.4.2.6.3 1.3.7 1.9 1.1.1.1.3.2.4.3.5.3 1 .6 1.4 1 .2.1.3.2.5.3.6.4 1.2.9 1.7 1.3s1.1.9 1.6 1.4l.4.4 1.2 1.2.3.3c.5.5 1 1.1 1.4 1.6.1.1.2.3.3.4.4.4.7.9 1 1.4.1.2.2.3.3.5l1.2 1.8s0 .1.1.1a36.18 36.18 0 015.1 18.5c0 6-1.5 11.7-4.1 16.7-.3.6-.7 1.2-1 1.8 0 0 0 .1-.1.1l-1.2 1.8c-.1.2-.2.3-.3.5-.3.5-.7.9-1 1.4-.1.1-.2.3-.3.4-.5.6-.9 1.1-1.4 1.6l-.3.3-1.2 1.2-.4.4c-.5.5-1 .9-1.6 1.4-.6.5-1.1.9-1.7 1.3-.2.1-.3.2-.5.3-.5.3-.9.7-1.4 1-.1.1-.3.2-.4.3-.6.4-1.2.7-1.9 1.1-.1.1-.3.1-.4.2-.5.3-1 .5-1.6.8l-.6.3c-.7.3-1.3.6-2 .8-.7.3-1.4.5-2.1.7-.2.1-.4.1-.6.2-.6.2-1.1.3-1.7.4-.2 0-.3.1-.5.1-.7.2-1.5.3-2.2.4-.2 0-.3 0-.5.1-.6.1-1.2.1-1.8.2h-.6c-.8 0-1.5.1-2.3.1s-1.5 0-2.3-.1h-.6c-.6 0-1.2-.1-1.8-.2-.2 0-.3 0-.5-.1-.7-.1-1.5-.2-2.2-.4-.2 0-.3-.1-.5-.1-.6-.1-1.2-.3-1.7-.4-.2-.1-.4-.1-.6-.2-.7-.2-1.4-.4-2.1-.7-.7-.2-1.3-.5-2-.8l-.6-.3c-.5-.2-1.1-.5-1.6-.8-.1-.1-.3-.1-.4-.2-.6-.3-1.3-.7-1.9-1.1-.1-.1-.3-.2-.4-.3-.5-.3-1-.6-1.4-1-.2-.1-.3-.2-.5-.3-.6-.4-1.2-.9-1.7-1.3s-1.1-.9-1.6-1.4l-.4-.4-1.2-1.2-.3-.3c-.5-.5-1-1.1-1.4-1.6-.1-.1-.2-.3-.3-.4-.4-.4-.7-.9-1-1.4-.1-.2-.2-.3-.3-.5l-1.2-1.8v-.1c-.4-.6-.7-1.2-1-1.8-2.6-5-4.1-10.7-4.1-16.7s1.5-11.7 4.1-16.7zM620 539v221c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V539c-10.1 3.3-20.8 5-32 5s-21.9-1.8-32-5zm64-198v-77c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v77c10.1-3.3 20.8-5 32-5s21.9 1.8 32 5zm-64 198c10.1 3.3 20.8 5 32 5s21.9-1.8 32-5c41.8-13.5 72-52.7 72-99s-30.2-85.5-72-99c-10.1-3.3-20.8-5-32-5s-21.9 1.8-32 5c-41.8 13.5-72 52.7-72 99s30.2 85.5 72 99zm.1-115.7c.3-.6.7-1.2 1-1.8v-.1l1.2-1.8c.1-.2.2-.3.3-.5.3-.5.7-.9 1-1.4.1-.1.2-.3.3-.4.5-.6.9-1.1 1.4-1.6l.3-.3 1.2-1.2.4-.4c.5-.5 1-.9 1.6-1.4.6-.5 1.1-.9 1.7-1.3.2-.1.3-.2.5-.3.5-.3.9-.7 1.4-1 .1-.1.3-.2.4-.3.6-.4 1.2-.7 1.9-1.1.1-.1.3-.1.4-.2.5-.3 1-.5 1.6-.8l.6-.3c.7-.3 1.3-.6 2-.8.7-.3 1.4-.5 2.1-.7.2-.1.4-.1.6-.2.6-.2 1.1-.3 1.7-.4.2 0 .3-.1.5-.1.7-.2 1.5-.3 2.2-.4.2 0 .3 0 .5-.1.6-.1 1.2-.1 1.8-.2h.6c.8 0 1.5-.1 2.3-.1s1.5 0 2.3.1h.6c.6 0 1.2.1 1.8.2.2 0 .3 0 .5.1.7.1 1.5.2 2.2.4.2 0 .3.1.5.1.6.1 1.2.3 1.7.4.2.1.4.1.6.2.7.2 1.4.4 2.1.7.7.2 1.3.5 2 .8l.6.3c.5.2 1.1.5 1.6.8.1.1.3.1.4.2.6.3 1.3.7 1.9 1.1.1.1.3.2.4.3.5.3 1 .6 1.4 1 .2.1.3.2.5.3.6.4 1.2.9 1.7 1.3s1.1.9 1.6 1.4l.4.4 1.2 1.2.3.3c.5.5 1 1.1 1.4 1.6.1.1.2.3.3.4.4.4.7.9 1 1.4.1.2.2.3.3.5l1.2 1.8v.1a36.18 36.18 0 015.1 18.5c0 6-1.5 11.7-4.1 16.7-.3.6-.7 1.2-1 1.8v.1l-1.2 1.8c-.1.2-.2.3-.3.5-.3.5-.7.9-1 1.4-.1.1-.2.3-.3.4-.5.6-.9 1.1-1.4 1.6l-.3.3-1.2 1.2-.4.4c-.5.5-1 .9-1.6 1.4-.6.5-1.1.9-1.7 1.3-.2.1-.3.2-.5.3-.5.3-.9.7-1.4 1-.1.1-.3.2-.4.3-.6.4-1.2.7-1.9 1.1-.1.1-.3.1-.4.2-.5.3-1 .5-1.6.8l-.6.3c-.7.3-1.3.6-2 .8-.7.3-1.4.5-2.1.7-.2.1-.4.1-.6.2-.6.2-1.1.3-1.7.4-.2 0-.3.1-.5.1-.7.2-1.5.3-2.2.4-.2 0-.3 0-.5.1-.6.1-1.2.1-1.8.2h-.6c-.8 0-1.5.1-2.3.1s-1.5 0-2.3-.1h-.6c-.6 0-1.2-.1-1.8-.2-.2 0-.3 0-.5-.1-.7-.1-1.5-.2-2.2-.4-.2 0-.3-.1-.5-.1-.6-.1-1.2-.3-1.7-.4-.2-.1-.4-.1-.6-.2-.7-.2-1.4-.4-2.1-.7-.7-.2-1.3-.5-2-.8l-.6-.3c-.5-.2-1.1-.5-1.6-.8-.1-.1-.3-.1-.4-.2-.6-.3-1.3-.7-1.9-1.1-.1-.1-.3-.2-.4-.3-.5-.3-1-.6-1.4-1-.2-.1-.3-.2-.5-.3-.6-.4-1.2-.9-1.7-1.3s-1.1-.9-1.6-1.4l-.4-.4-1.2-1.2-.3-.3c-.5-.5-1-1.1-1.4-1.6-.1-.1-.2-.3-.3-.4-.4-.4-.7-.9-1-1.4-.1-.2-.2-.3-.3-.5l-1.2-1.8v-.1c-.4-.6-.7-1.2-1-1.8-2.6-5-4.1-10.7-4.1-16.7s1.5-11.7 4.1-16.7z" />
          </svg>
        )}
      >
        <div className="flex flex-col rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="flex items-center p-2 justify-between transition duration-150 ease-in-out rounded-lg hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-opacity-50">
            <p className="text-sm font-medium text-gray-900">View as:</p>
            <div className="flex items-center gap-2">
              {VIEW_TYPES.map((v) => (
                <Link
                  to={`/user/views/new?type=${v.id.toLowerCase()}`}
                  key={v.id}
                >
                  <button className={"hover:bg-clarity-200 rounded-md p-2"}>
                    {v.Icon}
                  </button>
                </Link>
              ))}
            </div>
          </div>
          <hr />
          <div className="flex items-center p-2 justify-between transition duration-150 ease-in-out rounded-lg hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-opacity-50">
            <p className="text-sm font-medium text-gray-900">View option:</p>
            <div className="flex items-center gap-2 font-bold">
              <button className="border-r border-r-black">Reset</button>
              <button>Save view...</button>
            </div>
          </div>
        </div>
      </IconPopover>
      <button
        className={`p-2 rounded-md inline-flex items-center text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`}
      >
        <svg
          viewBox="64 64 896 896"
          focusable="false"
          data-icon="filter"
          width="1em"
          height="1em"
          fill="currentColor"
          aria-hidden="true"
          className={`text-opacity-60 ml-2 h-5 w-5 group-hover:text-opacity-80 transition ease-in-out duration-150`}
        >
          <path d="M880.1 154H143.9c-24.5 0-39.8 26.7-27.5 48L349 597.4V838c0 17.7 14.2 32 31.8 32h262.4c17.6 0 31.8-14.3 31.8-32V597.4L907.7 202c12.2-21.3-3.1-48-27.6-48zM603.4 798H420.6V642h182.9v156zm9.6-236.6l-9.5 16.6h-183l-9.5-16.6L212.7 226h598.6L613 561.4z" />
        </svg>
      </button>
    </>
  );
};

const ColorView = ({
  contributions,
}: {
  contributions: ReturnType<typeof getData>;
}) => {
  const total = Object.values(contributions).reduce((p, c) => p + c, 0);
  const maxDate = new Date();
  const minDate = startOfWeek(subYears(maxDate, 1));
  const maxContribution = Object.values(contributions).reduce(
    (p, c) => (c > p ? c : p),
    0
  );
  const [hoverDate, setHoverDate] = useState<string>();
  return (
    <div className="relative">
      <h2 className="text-normal mb-2 text-lg">{total} contributions</h2>
      <div className="border py-2 rounded-md">
        <table
          className="mx-2 pt-1 text-center h-full"
          onMouseLeave={() => setHoverDate("")}
        >
          <thead>
            <tr className="text-xs font-normal text-left">
              <th />
              {Array(13)
                .fill(null)
                .map((_, index) => {
                  const date = addMonths(minDate, index);
                  //   const colSpan = Array(5)
                  //     .fill(null)
                  //     .findIndex(
                  //       (_, w) => addWeeks(date, w).getMonth() !== date.getMonth()
                  //     );
                  const colSpan = index === 0 ? 2 : 4;
                  return (
                    <th colSpan={colSpan} className={"pl-1"}>
                      {dateFormat(date, "MMM")}
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
                    {Array(53)
                      .fill(null)
                      .map((_, week) => {
                        const date = addWeeks(addDays(minDate, day), week);
                        const key = dateFormat(date, "yyyy-MM-dd");
                        const contribution = contributions[key] || 0;
                        const colorGradient =
                          1000 -
                          Math.ceil((contribution / maxContribution) * 5) * 100;
                        return (
                          <td
                            key={week}
                            onMouseEnter={() => setHoverDate(key)}
                            className={"p-0.5"}
                          >
                            <div
                              className={`h-4 w-4 rounded-sm ${
                                colorGradient === 500
                                  ? `bg-green-500`
                                  : colorGradient === 600
                                  ? `bg-green-600`
                                  : colorGradient === 700
                                  ? `bg-green-700`
                                  : colorGradient === 800
                                  ? `bg-green-800`
                                  : colorGradient === 900
                                  ? `bg-green-900`
                                  : "bg-black bg-opacity-25"
                              }`}
                            />
                          </td>
                        );
                      })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <span>
        {hoverDate &&
          `${contributions[hoverDate] || 0} Contributions on ${hoverDate}`}
      </span>
    </div>
  );
};

const NewViewPage = () => {
  const loaderData = useLoaderData();

  return (
    <>
      {loaderData.type === "color" && (
        <ColorView contributions={loaderData.contributions} />
      )}
      {loaderData.type && <div>{}</div>}
      {loaderData.type && <div>{}</div>}
      {loaderData.type && <div>{}</div>}
    </>
  );
};

const getData = () => {
  return Object.fromEntries(
    Array(100)
      .fill(null)
      .map(() => {
        return [
          dateFormat(
            subDays(new Date(), Math.floor(Math.random() * 365)),
            "yyyy-MM-dd"
          ),
          Math.ceil(Math.random() * 50),
        ];
      })
  );
};

export const loader: LoaderFunction = (args) => {
  const params = new URLSearchParams(args.request.url);
  return {
    type: params.get("type") || "color",
    contributions: getData(),
  };
};

export const handle = {
  Toolbar,
  header: "New",
};

export default NewViewPage;
