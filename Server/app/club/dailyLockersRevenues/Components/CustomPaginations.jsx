"use client";

import React, { useEffect, useState } from "react";

export default function CustomPaginations({
  count,
  pageNumber,
  setPageNumber,
  pageSize,
}) {
  const [valid1, setValid1] = useState(true);
  const [valid2, setValid2] = useState(true);

  useEffect(() => {
    if (+pageNumber + 1 < +count / (pageSize || 15)) {
      setValid1(true);
    } else {
      setValid1(false);
    }
    if (+pageNumber > 0) {
      setValid2(true);
    } else {
      setValid2(false);
    }
  }, [count, pageNumber, pageSize]);

  function handleMove(type) {
    if (type === "next" && count) {
      if (valid1) {
        setPageNumber((old) => old + 1);
      }
    }
    if (type === "prev" && count) {
      if (valid2) {
        setPageNumber((old) => old - 1);
      }
    }
  }
  return (
    <div
      className={`flex justify-center 
               text-blue-500
             gap-[20px] mt-[40px] flex-row-reverse items-center`}
    >
      <p
        className={`h-[40px] w-[40px] 
                        : border-[1px] border-gray-500
                 m-0 flex justify-center items-center rounded-md `}
      >
        {pageNumber + 1}
      </p>
      <div className={`flex flex-row-reverse items-center gap-2 `}>
        <i
          onClick={() => handleMove("prev")}
          className={`pi pi-chevron-right border-[1px] text-2xl 
                         rotate-180
                     border-gray-500 ${
                       valid2
                         ? `cursor-pointer text-blue-500`
                         : "cursor-not-allowed text-gray-400"
                     } `}
        ></i>

        <i
          onClick={() => handleMove("next")}
          className={`pi pi-chevron-left border-[1px] text-2xl 
                        rotate-180
                    border-gray-500 ${
                      valid1
                        ? `cursor-pointer text-blue-500`
                        : "cursor-not-allowed text-gray-400"
                    } `}
        ></i>
      </div>
      <p
        className={`h-[40px] w-[40px] 
                        border-[1px] border-gray-500
                 m-0 flex justify-center items-center rounded-md  `}
      >
        {Math.ceil(count / (pageSize || 15)) || 1}
      </p>
    </div>
  );
}
