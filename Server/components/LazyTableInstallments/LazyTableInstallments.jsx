import { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { useRouter } from "next/navigation";
import { Dialog } from "primereact/dialog";
import Report from "./Report.jsx";
import { cancelReciept } from "@components/Members/member";
import { Tooltip } from "primereact/tooltip";
import { getInstallmentData } from "./LazyTableInstallments.js";



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


const LazyTableInstallments = ({
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
  const [installmentsData, setData] = useState(null);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelID, setCancelID] = useState("");

  const [lazyState, setlazyState] = useState({
    first: 0,
    rows,
    page: 0,
    filters,
  });

  // useEffect(() => {
  //   console.log(table, JSON.stringify(data));
  // }, [data]); 

  useEffect(() => {
    loadLazyData();
  }, [lazyState]);

  const loadLazyData = async () => {
    setLoading(true);
    const data = await getInstallmentData(table, lazyState, orderBy, include, filter);
    setTotalRecords(data?.length);
    const itemsPerPage = 10; 
    // const startIndex = (lazyState.page) * itemsPerPage;

    const obj = data?.slice(lazyState.first, lazyState.first+10 );
    setData(obj);
    setLoading(false);
  };

  const onPage = (event) => {
    setlazyState(event);
  };

  const onFilter = (event) => {
    event["first"] = 0;

    setlazyState(event);
  };

  const exportReport = async (type) => {
    setLoading(true);
    const response = await fetch(`../api/${type}`, {
      method: "POST",
      body: JSON.stringify({
        table,
        lazyState,
        orderBy,
        include,
        filter,
        columns,
      }),
    });

    if (response.ok) {
      const buffer = await response.arrayBuffer();
      saveAsReportFile(buffer, table, type);
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
  const header = (
    <div className="flex align-items-center justify-content-end gap-2">
      {exportName && (
        <>
          <Button
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
          <Report
            lazyState={lazyState}
            orderBy={orderBy}
            filter={filter}
            include={include}
          />
        ) : (
          tableHeader
        )}
      </div>
    </div>
  );

  return (
    <div className="card">
      <DataTable
        dir="rtl"
        value={installmentsData}
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
        className="text-red"
      >
        {columns.map((el, index) => {
          ///////////////////////////////////////////////////filters type/////////////////////////////////////////
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
            return (
              <Calendar
                placeholder="بحث ..."
                onChange={(e) => {
                  const date = e.value;
                  date.setDate(date.getDate() + 1);
                  options.filterApplyCallback(date);
                }}
                // dateFormat="dd/mm/yy"
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
          /////////////////////////////////////////////////////////////////////////////////////////////
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
                  let tag = getValueFromNestedObject(rowData, el.tag);
                  return <Tag value={value} severity={tag}></Tag>;
                }

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
                        ? new Intl.DateTimeFormat("en-UK").format(
                            new Date(value)
                          )
                        : "-"}
                    </div>
                  );
                if (el.dataType == "number") return <div>{value}</div>;

                if (el.dataType == "string") {
                  return <div>{value}</div>;
                }

                if (el.dataType == "custom") {
                  return (
                    <div>
                      <Button
                        onClick={() => {
                          
                          router.push(`${el.url}${rowData.account_id}`);
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
                        onClick={() => {
                          setCancelDialog(true);
                          setCancelID(rowData.id);
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
                await cancelReciept(cancelID);
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
        </div>
      </Dialog>
    </div>
  );
};

export default LazyTableInstallments;
