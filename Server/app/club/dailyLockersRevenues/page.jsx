"use client";
import React, { useEffect, useRef, useState } from "react";
import Filters from "./Components/Filters";
import axios from "@node_modules/axios";
import { jwtDecode } from "jwt-decode";
import CustomPaginations from "./Components/CustomPaginations";
import Table from "./Components/Table";
import { useReactToPrint } from "@node_modules/react-to-print/lib";
import './pagePRINT.css'

function filterByDateRange(data, startDate, endDate) {
  const start = new Date(startDate + "T00:00:00.000Z");
  const end = new Date(endDate + "T23:59:59.999Z");

  return data.filter((item) => {
    const itemDate = new Date(item.paymentDate);
    return itemDate >= start && itemDate <= end;
  });
}

export default function page() {
  const [dates, setDates] = useState({
    start: "",
    end: "",
  });
  

  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    onBeforePrint: () => setIsPrinting(true),
    onAfterPrint: () => setIsPrinting(false),
  });

  const [data, setData] = useState([]);
  const [pageNumber, setPageNumber] = useState(0);
  const [decodedData, setDecodedData] = useState({});
  const [count, setCount] = useState(null);
  const [total, setTotal] = useState(null);
  const [printing, setIsPrinting] = useState(false);

  

  

  useEffect(() => {
    if (typeof window !== "undefined") {
      const lockerToken = localStorage.getItem("lockerToken");
      if (lockerToken) {
        try {
          setDecodedData(jwtDecode(lockerToken));
        } catch {
          setDecodedData({});
        }
      }
    }
  }, []);
  
  
  useEffect(() => {
    if (dates.end && dates.start) {
      setTotal(
        filterByDateRange(data, dates.start, dates.end).reduce(
          (a, b) => a + Number(b.price),
          0
        )
      );
    }
  }, [dates.start, dates.end, data]);

  useEffect(() => {
    async function getData() {
      try {
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("lockerToken");
          const response = await axios.post(
            `http://localhost:5156/api/BookingLocker/Filter?PageNumber=${pageNumber}&PageSize=999999999`,
            [
              {
                propertyName: "userId",
                propertyValue: decodedData?.nameid,
                range: false,
              },
            ],
            {
              headers: {
                "Content-Type": "application/json; charset=UTF-8",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          
          setData(response.data?.data?.map((el) => el.data));
          setCount(response.data.data[0].count);
        }
      } catch (error) {
        
        setData([]);
        setCount(null);
      }
    }
  
    if (decodedData.nameid) {
      getData();
    }
  }, [decodedData.nameid, pageNumber]);
  
  return (
    <div className="py-5 flex flex-col gap-5" dir="rtl">
      <Filters print={handlePrint} setDates={setDates} />
      <div ref={componentRef} className="px-5">
        {total && <p className="my-3 font-bold text-lg">الاجمالي : {total}</p>}
        <Table
          data={
            printing
              ? data
              : filterByDateRange(data, dates.start, dates.end).slice(
                  pageNumber * 10,
                  (pageNumber + 1) * 10
                )
          }
        />
      </div>
      {dates.start && dates.end && (
        <CustomPaginations
          count={count}
          pageNumber={pageNumber}
          pageSize={10}
          setPageNumber={setPageNumber}
        />
      )}
    </div>
  );
}
