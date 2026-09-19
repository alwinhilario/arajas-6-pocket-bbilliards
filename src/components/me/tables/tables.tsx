"use client";

import React from "react";
import TableEdit from "./table-edit";
import Table from "./table";
import storage, { onStorageChange } from "@/lib/localforage";
import { TTableOpts, TTableOptsData } from "./types";
import { isEmpty } from "lodash";
import { NAME_OPTS, TABLE_OPTS } from "@/app/constants";
import dayjs from "dayjs";
import { myData } from "@/app/test";

export default function Tables() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [tables, setTables] = React.useState<TTableOpts>();
  const [currentTable, setCurrentTable] = React.useState<TTableOptsData>();

  React.useEffect(() => {
    const load = async () => {
      const data = ((await storage.getItem("tables")) || TABLE_OPTS) as TTableOpts;
      setTables(data);
    };

    load();
    return onStorageChange("tables", () => {
      load();
    });
  }, []);

  return (
    <div>
      {isOpen && (
        <TableEdit
          setIsOpen={setIsOpen}
          currentTable={currentTable}
          onConfirm={async (data) => {
            const newTables = tables?.map((item) => {
              if (item?.value === data?.value) {
                return {
                  ...item,
                  ...data,
                  is_open_time: (() => {
                    if (item?.is_open_time && data?.out) {
                      return false;
                    }

                    return item?.is_open_time || !data?.out;
                  })(),
                };
              }

              return item;
            });

            await storage.setItem("tables", newTables);

            const allListTable = ((await storage.getItem("all_tables_list")) || []) as TTableOpts;
            const x = tables?.find((x) => x?.value === data?.value);

            const exists = !isEmpty(allListTable?.find((x) => x?.id === data?.id));
            await storage.setItem(
              "all_tables_list",
              exists
                ? allListTable?.map((item) => {
                    if (data?.id === item?.id) {
                      return {
                        ...item,
                        ...data,
                        is_open_time: item?.is_open_time || !data?.out,
                      };
                    }

                    return item;
                  })
                : [
                    ...allListTable,
                    {
                      ...x,
                      ...data,
                      is_open_time: !data?.out,
                    },
                  ],
            );
            setTables(newTables);
            setIsOpen(!isOpen);
          }}
        />
      )}

      {/* <div className='text-3xl font-bold'>Table Management</div> */}

      {/* <br /> */}

      <div className='grid grid-cols-3 gap-4'>
        {tables?.map((item, key) => (
          <Table
            data={item}
            key={key}
            setIsOpen={setIsOpen}
            setCurrentTable={setCurrentTable}
            setTables={setTables}
            tables={tables}
          />
        ))}
      </div>
    </div>
  );
}
