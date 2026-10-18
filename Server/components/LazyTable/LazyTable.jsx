
import { getStoredUser } from "@lib/browserStorage";

import { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { getData } from "./LazyTable.js";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { AccessButton as Button } from "@components/Access/AccessButton";
import { Can } from "@components/Access/AccessProvider";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import MemberDateFilter from "./MemberDateFilter";
import MemberSearchFilters from "./MemberSearchFilters";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import Report from "./Report.jsx";
import ReportExcel from "./ReportExcel.jsx";
import { cancelReciept,reverse, cancelErp, LogIn } from "@components/Members/member";
import { Tooltip } from "primereact/tooltip";

let inputValue;

function isDifference21YearsOrMore(date1, date2) {
  const diffYears = date1.getFullYear() - date2.getFullYear();

  if (diffYears > 21) {
    
    return true;
  } else if (diffYears === 21) {
    // If the difference is exactly 21 years, check months and days
    const diffMonths = date1.getMonth() - date2.getMonth();
    if (diffMonths > 0) {
      

      return true;
    } else if (diffMonths === 0) {
      // If months are equal, check days
      

      const diffDays = date1.getDate() - date2.getDate();
      if (diffDays >= 0) {
        

        return true;
      }
    }
  }
  return false;
}

function getValueFromNestedObject(obj, key) {
  const keys = key.split(".");
  let value = obj;
  for (const k of keys) {
    if (value && k in value) {
      value = value[k];
      // Check if the value is an array with one element
      if (Array.isArray(value) && value.length === 1) {
        value = value[0];
      }
    } else {
      value = undefined;
      break;
    }
  }
  return value;
}

const LazyTable = ({
  table,
  exportName,
  tableHeader,
  orderBy,
  id,
  rows,
  columns,
  include,
  filter,
  paginator,
  handleReload,
  selectionMode,
  selection,
  onSelectionChange,
  defaultConditions,
}) => {
  const router = useRouter();
  const filters = columns.reduce((acc, column) => {
    const { field } = column;
    if (column.filter) {
      acc[field] = { matchMode: column.filterMode };
    }

    return acc;
  }, {});

  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [data, setData] = useState(null);
  const requestId = useRef(0);
  const [loadError, setLoadError] = useState("");
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelID, setCancelID] = useState("");
  const [cancelSerial, setCancelSerial] = useState("0");

  const [lazyState, setlazyState] = useState({
    first: 0,
    rows,
    page: 1,
    filters,
  });

  useEffect(() => {
    loadLazyData();
  }, [lazyState]);

  const loadLazyData = async () => {
    const request = ++requestId.current;
    setLoading(true);
    setLoadError("");
    const combinedFilter = {
      ...filter,
      ...defaultConditions,
    };
    try {
    const data = await getData(
      table,
      lazyState,
      orderBy,
      include,
      combinedFilter
    );
    if (request !== requestId.current) return;
    setData(JSON.parse(data.data));
    
    
    setTotalRecords(data.totalRecords);
    } catch (error) {
      if (request === requestId.current) {
        setLoadError("تعذر تحميل البيانات، حاول مرة أخرى");
        setData([]);
        setTotalRecords(0);
      }
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  };

  const onPage = (event) => {
    setlazyState(event);
  };

  const onFilter = (event) => {
    if (table === "members") {
      setlazyState((previous) => ({ ...previous, ...event, first: 0, page: 1 }));
      return;
    }
    event["first"] = 0;
    setlazyState(event);
  };

  const exportReport = async (type) => {
    setLoading(true);

    // Clone the current lazyState but remove pagination constraints for exporting
    const exportState = { ...lazyState, rows: null, page: null, first: null };

    // Add a flag or modify the request to indicate you want all data for exporting
    const requestBody = JSON.stringify({
      table,
      lazyState: exportState,
      orderBy,
      include,
      filter: table === "members" ? { ...filter, ...defaultConditions } : filter,
      columns,
    });

    const response = await fetch(`../api/${type}`, {
      method: "POST",
      body: requestBody,
    });

    if (response.ok) {
      const buffer = await response.arrayBuffer();
      saveAsReportFile(buffer, exportName || table, type);
    } else {
      console.error("Operation failed");
    }
    setLoading(false);
  };

  const saveAsReportFile = (buffer, fileName, type) => {
    import("file-saver").then((module) => {
      if (module && module.default) {
        let FILE_TYPE, FILE_EXTENSION;
        if (type == "excel") {
          FILE_TYPE =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
          FILE_EXTENSION = ".xlsx";
        } else if (type == "pdf") {
          FILE_TYPE = "application/pdf;charset=UTF-8";
          FILE_EXTENSION = ".pdf";
        }

        const data = new Blob([buffer], {
          type: FILE_TYPE,
        });

        module.default.saveAs(data, fileName + FILE_EXTENSION);
      }
    });
  };
  let totalPrices = [];
  if (data) {
    totalPrices = data.map(item =>
      item?.bookingLockersLinks?.reduce((sum, link) => sum + (link?.bookingLocker?.Price || 0), 0)
    );
  }
  const header = (
    <div className="flex align-items-center justify-content-end gap-2">
      {exportName && (
        <>
          <Button
            permission="reports.export"
            className="excel"
            type="button"
            icon="pi pi-file-excel"
            rounded
            onClick={() => {
              exportReport("excel");
            }}
            data-pr-tooltip="XLS"
            loading={loading}
          />
          <Tooltip target=".excel" mouseTrack mouseTrackLeft={10} />
        </>
      )}
      <div style={{ right: 10, position: "absolute" }}>
        {tableHeader == "report" ? (
          <>
            <Can permission="reports.view"><Report
              lazyState={lazyState}
              orderBy={orderBy}
              filter={filter}
              include={include}
            /></Can>
          </>
        ) : (
          tableHeader
        )}
      </div>
    </div>
  );

  return (
    <div className={table === "members" ? "card member-list-table" : "card"}>
      {table === "members" && <MemberSearchFilters filters={lazyState.filters} onApply={(values, reset) => {
        setlazyState((previous) => ({
          ...previous, first: 0, page: 1,
          filters: reset ? filters : {
            ...previous.filters,
            ...Object.fromEntries(Object.entries(values).map(([field, value]) => [field, { value, matchMode: "equals" }])),
          },
        }));
      }} />}
      {loadError && <p role="alert">{loadError}</p>}
      <DataTable
        dir="rtl"
        value={data}
        lazy
        dataKey={id}
        paginator={paginator}
        header={tableHeader && header}
        paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
        currentPageReportTemplate="{currentPage} من {totalPages}"
        first={lazyState.first}
        rows={lazyState.rows}
        totalRecords={totalRecords}
        onPage={onPage}
        filterDisplay={Object.keys(filters).length ? "row" : false}
        onFilter={onFilter}
        filters={lazyState.filters ? lazyState.filters : null}
        loading={loading}
        tableStyle={{ minWidth: "75rem" }}
        scrollable
        selection={selection}
        onSelectionChange={onSelectionChange}
        selectionMode={selectionMode}
      >
        {columns.map((el, index) => {
          const filterInputText = (options) => {
            return (
              <InputText
                value={options.value}
                onChange={(e) => options.filterApplyCallback(e.value)}
              />
            );
          };
          const filterInputNumber = (options) => {
            return (
              <InputNumber
                value={options.value}
                onChange={(e) => options.filterApplyCallback(e.value)}
                useGrouping={false}
              />
            );
          };
          const filterDropdown = (options) => {
            return (
              <Dropdown
                value={options.value}
                options={["aaa"]}
                placeholder="بحث ..."
                onChange={(e) => options.filterApplyCallback(e.value)}
              />
            );
          };
          const filterDate = (options) => {
            if (table === "members") return <MemberDateFilter options={options} label={el.header} />;
            return (
              <Calendar
                placeholder="بحث ..."
                onChange={(e) => {
                  if (!e.value) return;
                  const date = new Date(Date.UTC(e.value.getFullYear(), e.value.getMonth(), e.value.getDate()));
                  options.filterApplyCallback(date);
                  localStorage.setItem("filterDate", date.toISOString());
                  window.location.reload();
                }}
                dateFormat="dd/mm/yy"
              />
            );
          };
          const filterElement = {
            filterInputText,
            filterInputNumber,
            filterDropdown,
            filterDate,
          };

          return (
            <Column
              align={"center"}
              key={index}
              field={el.field}
              header={el.header}
              filter={el.filter}
              filterMatchMode={el.filterMode}
              showFilterMatchModes={false}
              filterPlaceholder="بحث ..."
              frozen={el.frozen}
              alignFrozen={el.alignFrozen}
              body={(rowData) => {
                let value = getValueFromNestedObject(rowData, el.field);
                if (el.tag) {
                  if (table === "members" && rowData.installment_state === "pending") return <span className="p-tag p-tag-warning">تحت التقسيط - غير مفعلة</span>;
                  let tag = getValueFromNestedObject(rowData, el.tag);
                  return <Tag value={value} severity={tag}></Tag>;
                }
                //  if (!value || value === "" || value === null) {
                //   return <Tag value="منتهي" severity="danger" />;
                // }


                if (el.dataType == "date")
                  return (
                    <div
                      style={
                        el.condition &&
                        isDifference21YearsOrMore(
                          new Date(),
                          new Date(rowData.birth_date)
                        )
                          ? {
                              background: "red",
                              color: "white",
                              borderRadius: "12px",
                            }
                          : null
                      }
                    >
                      {value
                        ? new Intl.DateTimeFormat("en-UK", el.field === "member_order_date" ? { timeZone: "UTC" } : undefined).format(
                            new Date(value)
                          )
                        : "-"}
                    </div>
                  );
                if (el.dataType == "number" && el.header=="الإجمالي") {
                
                  const rowIndex = data.findIndex(row => row.id === rowData.id);
                  
   return <div>{ totalPrices[rowIndex] + value }</div>;
                }
                
                   if (el.dataType == "number"&&  el.header!="الإجمالي")  {return <div>{value}</div>};
if(el.dataType=="price"){
  const rowIndex = data.findIndex(row => row.id === rowData.id);
  return <div>{totalPrices[rowIndex]}</div>;

}
                if (el.dataType == "string") {
                  return <div>{value}</div>;
                }

                if (el.dataType == "custom") {
                  return (
                    <div>
                      <Button
                        onClick={() => {
                          router.push(`${el.url}${rowData.id}`);
                        }}
                        severity="help"
                      >
                        {el.btnText}
                      </Button>
                    </div>
                  );
                }
                if (el.dataType == "cancel") {
                  return (
                    <div>
                      <Button
                        permission="receipts.cancel"
                        onClick={() => {
                          setCancelDialog(true);
                          setCancelID(rowData.id);
                          setCancelSerial(rowData.serial_no);
                        }}
                        severity="help"
                      >
                        {el.btnText}
                      </Button>
                    </div>
                  );
                }
              }}
              filterElement={
                el.filterElement && filterElement[el.filterElement]
              }
            />
          );
        })}
      </DataTable>
      <Dialog
        visible={cancelDialog}
        style={{ width: "32rem" }}
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
        header="إنتبه !"
        headerStyle={{ direction: "rtl" }}
        rtl={true}
        contentStyle={{ direction: "rtl" }}
        modal
        footer={
          <div style={{ textAlign: "left" }}>
            <Button
              label="نعم"
              icon="pi pi-check"
              iconPos="right"
              loading={loading}
              onClick={async () => {
                await cancelReciept(
                  cancelID,
                  getStoredUser().id,
                  `${inputValue}`
                );
          
              await reverse(cancelSerial,getStoredUser().id)
                setCancelDialog(false);
                handleReload();
              }}
            />
            <Button
              label="لا"
              icon="pi pi-times"
              iconPos="right"
              onClick={() => setCancelDialog(false)}
            />
          </div>
        }
        onHide={() => {
          setCancelDialog(false);
        }}
      >
        <div className="confirmation-content">
          <i
            className="pi pi-exclamation-triangle mr-3"
            style={{ fontSize: "2rem" }}
          />
          <span>هل تريد إلغاء الإيصال ؟</span>
          <input
            onChange={(e) => {
              inputValue = e.target.value;
            }}
            placeHolder="سبب الالغاء"
          />
        </div>
      </Dialog>
    </div>
  );
};

export default LazyTable;
