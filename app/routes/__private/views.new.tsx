import React, { useCallback, useMemo, useState } from "react";
import { Menu, Popover, Transition } from "@headlessui/react";
import { Link, Outlet, useMatches } from "@remix-run/react";
import Dialog from "@dvargas92495/app/components/Dialog";
import dateFormat from "date-fns/format";
import subMonths from "date-fns/subMonths";
import { v4 } from "uuid";
import { useToolbar } from "../../contexts/ToolbarContext";
import getMeta from "@dvargas92495/app/utils/getMeta";

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
    id: "Radar",
    Icon: (
      <svg
        viewBox="0 0 24 24"
        focusable="false"
        width="1em"
        height="1em"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M23 8c0 1.1-.9 2-2 2-.18 0-.35-.02-" />
      </svg>
    )
  },
  {
    id: "Bar",
    Icon: (
      <svg
        viewBox="0 0 24 24"
        focusable="false"
        width="1em"
        height="1em"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M23 8c0 1.1-.9 2-2 2-.18 0-.35-.02-" />
      </svg>
    )
  },
  {
    id: "Line",
    Icon: (
      <svg
        viewBox="0 0 24 24"
        focusable="false"
        width="1em"
        height="1em"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M23 8c0 1.1-.9 2-2 2-.18 0-.35-.02-" />
      </svg>
    )
  }
];

// @ts-ignore
const _ = [
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

const ButtonPopover = ({
  ButtonContent,
  children,
}: React.PropsWithChildren<{
  ButtonContent: React.FC<{ className: string }>;
}>) => {
  return (
    <span>
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button
              className={`p-2 rounded-md inline-flex items-center text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`}
            >
              <ButtonContent
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
              <Popover.Panel className="absolute z-40 w-64 px-4 mt-3 transform -translate-x-full lg:max-w-3xl">
                {children}
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </span>
  );
};

type ClarityFilter = {
  field: string;
  condition: string;
  values: string[];
  uuid: string;
};

const ButtomMenu = ({
  buttonContent,
  children,
}: {
  buttonContent: React.ReactElement;
  children: Parameters<typeof Menu.Item>[0]["children"][];
}) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="inline-flex justify-center items-center w-full px-4 pb-1 text-sm font-medium rounded-md bg-opacity-20 hover:bg-gray-200 border">
        {buttonContent}
      </Menu.Button>
      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-40 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {children.map((c, i) => (
            <Menu.Item key={i}>{c}</Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

const FilterItem = ({
  active,
  label,
  options,
  ...props
}: {
  active: boolean;
  label: string;
  options: string[];
}) => {
  return (
    <div
      {...props}
      className={`${
        active ? "bg-gray-200" : "bg-transparent"
      } p-2 flex justify-between text-sm opacity-80 cursor-pointer relative items-center whitespace-nowrap clarity-filter`}
      data-value={label}
    >
      {label}{" "}
      <div>
        <svg
          viewBox="64 64 896 896"
          focusable="false"
          data-icon="right"
          width="1em"
          height="1em"
          fill="currentColor"
          aria-hidden="true"
          className="opacity-50 ml-2"
        >
          <path d="M765.7 486.8L314.9 134.7A7.97 7.97 0 00302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 000-50.4z" />
        </svg>
        {active && (
          <Transition
            as={React.Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <div className="absolute right-full pr-2 top-0 pt-1 origin-top-right bg-transparent whitespace-nowrap">
              <div className="bg-white rounded-sm shadow-lg">
                {options.map((c, j) => (
                  <div
                    className={
                      "p-2 bg-white hover:bg-gray-200 cursor-pointer clarity-condition"
                    }
                    key={j}
                    data-value={c}
                  >
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </Transition>
        )}
      </div>
    </div>
  );
};

const IconDrawer = ({
  children,
}: {
  children: (props: { close: () => void }) => React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  return (
    <>
      <button
        className={`p-2 rounded-md inline-flex items-center text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`}
        onClick={() => setIsOpen(true)}
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
      {isOpen && (
        <div className="fixed inset-0 z-20">
          <div
            className="bg-opacity-25 bg-gray-600 fixed -z-10 inset-0"
            onClick={close}
          />
          <div className="w-96 right-0 p-5 rounded-tl-xl rounded-bl-xl shadow-lg h-full bg-white fixed">
            {children({ close })}
          </div>
        </div>
      )}
    </>
  );
};

const getOptionsFromFilter = (s: string) => {
  if (s === "Closed Date") {
    const today = new Date();
    return [
      dateFormat(subMonths(today, 3), "yyyy/MM/dd"),
      dateFormat(subMonths(today, 6), "yyyy/MM/dd"),
      dateFormat(subMonths(today, 9), "yyyy/MM/dd"),
      dateFormat(subMonths(today, 12), "yyyy/MM/dd"),
    ];
  } else if (s === "Type") {
    return [];
  }
  return ["foo", "bar", "baz", "lollipop"];
};

const FilterDrawerContent = ({ close }: { close: () => void }) => {
  const { data: filters = [], setData: setFilters } =
    useToolbar<ClarityFilter[]>("filters");
  const filterByUuid = useMemo(
    () => Object.fromEntries(filters.map((f) => [f.uuid, f])),
    [filters]
  );
  const [selectedFilter, setSelectedFilter] = useState("");
  const selectedFilterValues = useMemo(
    () => new Set(filterByUuid[selectedFilter]?.values || []),
    [selectedFilter, filterByUuid]
  );
  const selectedFilterField = filterByUuid[selectedFilter]?.field;
  const selectedFilterOptions = useMemo(
    () => getOptionsFromFilter(selectedFilterField),
    [selectedFilterField]
  );
  return (
    <>
      <div className="flex justify-between mb-8">
        <span className="opacity-40">Filters</span>
        <span
          onClick={(e) => {
            const target = e.target as HTMLDivElement;
            if (target.classList.contains("clarity-condition")) {
              const condition = target.getAttribute("data-value") || "";
              const filter = target.closest<HTMLDivElement>(".clarity-filter");
              if (filter) {
                const field = filter.getAttribute("data-value") || "";
                setFilters([
                  ...filters,
                  { field, condition, values: [], uuid: v4() },
                ]);
              }
            }
          }}
        >
          <ButtomMenu
            buttonContent={
              <>
                <span className="opacity-40 text-lg mr-2">+</span> Add filter
              </>
            }
          >
            {({ active }) => (
              <FilterItem
                active={active}
                label={"Created Date"}
                options={[
                  "is this week",
                  "is before...",
                  "is after...",
                  "is exactly...",
                  "is not...",
                ]}
              />
            )}
            {({ active }) => (
              <FilterItem
                active={active}
                label={"Closed Date"}
                options={[
                  "is this week",
                  "is before...",
                  "is after...",
                  "is exactly...",
                  "is not...",
                ]}
              />
            )}
            {({ active }) => (
              <FilterItem
                active={active}
                label={"Due Date"}
                options={[
                  "is this week",
                  "is overdue",
                  "is before...",
                  "is after...",
                  "is exactly...",
                  "is not...",
                ]}
              />
            )}
            {({ active }) => (
              <FilterItem
                active={active}
                label={"Priority"}
                options={["is...", "is not..."]}
              />
            )}
            {({ active }) => (
              <FilterItem
                active={active}
                label={"Parent"}
                options={["is...", "is not..."]}
              />
            )}
            {({ active }) => (
              <FilterItem
                active={active}
                label={"Cycle"}
                options={["is...", "is not..."]}
              />
            )}
            {({ active }) => (
              <FilterItem
                active={active}
                label={"Status"}
                options={["is...", "is not..."]}
              />
            )}
            {({ active }) => (
              <FilterItem
                active={active}
                label={"Tags"}
                options={["is...", "is not..."]}
              />
            )}
            {({ active }) => (
              <FilterItem
                active={active}
                label={"Reward"}
                options={[
                  "has reward",
                  "does not have reward",
                  "is approved for payment",
                  "is not approved for payment",
                  "is paid",
                  "is not paid",
                ]}
              />
            )}
            {({ active }) => (
              <FilterItem
                active={active}
                label={"Type"}
                options={["Any", "Goals", "Projects", "Tasks"]}
              />
            )}
          </ButtomMenu>
          <span className="opacity-50 ml-5 cursor-pointer" onClick={close}>
            X
          </span>
        </span>
      </div>
      {filters.map((f, i, a) => (
        <React.Fragment key={i}>
          <div className="rounded-md bg-clarity-100 p-4">
            <h2 className="text-base font-bold mb-1">{f.field}</h2>
            <p className="text-sm opacity-50 mb-0.5 flex space-between items-center w-full">
              <span className="flex-grow">{f.condition}</span>
              <span
                className="ml-5 cursor-pointer mx-2 hover:bg-gray-400 rounded-full w-5 text-center"
                onClick={() =>
                  setFilters(filters.filter((fil) => fil.uuid !== f.uuid))
                }
              >
                X
              </span>
            </p>
            {!!getOptionsFromFilter(f.field).length && (
              <div className="flex items-center justify-between">
                <div
                  className="bg-white rounded-md border border-clarity-300 p-2 flex-grow h-11 cursor-pointer"
                  onClick={() => setSelectedFilter(f.uuid)}
                >
                  {f.values.map((v) => (
                    <div
                      key={v}
                      className={
                        "font-medium text-sm bg-clarity-100 rounded-sm border border-clarity-300 inline-block mr-3"
                      }
                    >
                      {v}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {i < a.length - 1 && (
            <div className="capitalize my-4 w-full opacity-75 text-center">
              AND
            </div>
          )}
        </React.Fragment>
      ))}
      <Dialog
        isOpen={!!selectedFilter}
        onClose={() => setSelectedFilter("")}
        title={`Filter ${selectedFilterField}`}
        contentClassName="inline-block max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-gray-800 text-white shadow-xl rounded-md"
        titleClassName="text-lg font-medium leading-6 px-6 py-3"
      >
        <input className="border-y border-y-black p-6 text-white bg-transparent focus:outline-none w-full" />
        <div className={"h-96 w-96 overflow-auto"}>
          {selectedFilterOptions.map((o, i) => (
            <div key={i} className={"py-3 px-6 hover:bg-gray-700"}>
              <input
                type={"checkbox"}
                placeholder={`Select ${selectedFilterField}s to include...`}
                defaultChecked={selectedFilterValues.has(o)}
                onChange={(e) => {
                  const { checked } = e.target;
                  if (checked) {
                    setFilters(
                      filters.map((f) =>
                        f.uuid === selectedFilter
                          ? { ...f, values: f.values.concat(o) }
                          : f
                      )
                    );
                  } else {
                    setFilters(
                      filters.map((f) =>
                        f.uuid === selectedFilter
                          ? { ...f, values: f.values.filter((v) => v !== o) }
                          : f
                      )
                    );
                  }
                }}
              />
              <span className="ml-2">{o}</span>
            </div>
          ))}
        </div>
      </Dialog>
    </>
  );
};

const Toolbar = () => {
  return (
    <>
      <ButtonPopover
        ButtonContent={({ className }) => (
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
                <Link to={`/views/new?type=${v.id.toLowerCase()}`} key={v.id}>
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
      </ButtonPopover>
      <IconDrawer>
        {({ close }) => <FilterDrawerContent close={close} />}
      </IconDrawer>
    </>
  );
};

const NewViewPage = () => {
  const matches = useMatches();
  const leaf = matches[matches.length - 1].pathname;
  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        {VIEW_TYPES.map((c) => (
          <Link
            to={`/views/new/${c.id.toLowerCase()}`}
            key={c.id}
            className={`capitalize rounded-md text-green-700 border-green-700 border px-6 py-3 text-lg font-semibold cursor-pointer hover:bg-green-50 ${
              leaf.endsWith(c.id.toLowerCase())
                ? "bg-green-100"
                : "bg-transparent"
            }`}
          >
            {c.id}
          </Link>
        ))}
      </div>
      <Outlet />
    </>
  );
};

export const handle = {
  Toolbar,
  header: "New",
};

export const meta = getMeta({
  title: "New View",
});

export default NewViewPage;
