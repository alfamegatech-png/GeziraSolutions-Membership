"use client";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import ReactToPrint from "react-to-print";
import { IconButton } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import style from "./page.module.css";
import FilterComponent from "./FilterComponent";
import Swal from "sweetalert2";
import FilterRef from "./FilterRef";

const DateComponent = () => {
  const [responseData, setResponseData] = useState({
    members: [],
    members_ref: [],
  });
  const [memberTypeFilter, setMemberTypeFilter] = useState([]);
  const [filterArrayMemberType, setFilterArrayMemberType] = useState([]);
  const [openMemberGroupIndex, setOpenMemberGroupIndex] = useState(null); // Separate state
  const [objectToPostCOUNT, setObjectToPostCOUNT] = useState({});
  const [memberRefFilter, setMemberRefFilter] = useState([]);
  const [filterArrayMemberRef, setFilterArrayMemberRef] = useState([]);
  const [openRefGroupIndex, setOpenRefGroupIndex] = useState(null); // Separate state
  const componentRef = useRef(null);

  useEffect(() => {
    if (filterArrayMemberType.length || filterArrayMemberRef.length) {
      const dataToPost = [
        {
          modelName: "members",
          model: "members",
          filters: [
            ...filterArrayMemberType.map((el) => {
              const filterObject = { member_type: el.member_type };
              if (el.sex) {
                filterObject.sex = el.sex;
              }
              return filterObject;
            }),
          ],
        },
        {
          modelName: "members_ref",
          model: "members_ref",
          filters: [
            ...filterArrayMemberRef.map((el) => {
              const filterObject = { ref: el.ref, member_type: [2] };
              return filterObject;
            }),
          ],
        },
      ];
      setObjectToPostCOUNT(dataToPost);
    } else {
      setObjectToPostCOUNT([]);
    }
  }, [filterArrayMemberType, filterArrayMemberRef]);

  useEffect(() => {
    async function getFilters() {
      const res = await axios.get("http://10.1.1.115:5000/api/GetAllMemberType");
      setMemberTypeFilter(res.data.rows.rows);
    }
    getFilters();
  }, []);

  useEffect(() => {
    async function getRefFilters() {
      const res = await axios.get("http://10.1.1.115:5000/api/GetAlllookup_ref");
      setMemberRefFilter(res.data.rows.rows);
    }
    getRefFilters();
  }, []);

  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
  }, []);

  useEffect(() => {
    fetchData();
  }, [objectToPostCOUNT]);

  const fetchData = async () => {
    if (!objectToPostCOUNT.length) {
      setResponseData({ members: [], members_ref: [] });
      return;
    }

    try {
      const response = await axios.post(
        "http://10.1.1.115:5000/api/countMembers",
        objectToPostCOUNT
      );

      const membersCounts =
        response.data.results.find((result) => result.model === "members")
          ?.counts || [];
      const membersRefCounts =
        response.data.results.find((result) => result.model === "members_ref")
          ?.counts || [];

      setResponseData({
        members: membersCounts,
        members_ref: membersRefCounts,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleAddNewGroup = (newGroupName) => {
    const newGroup = {
      id: new Date().getTime(),
      name: newGroupName,
      member_type: [],
    };
    setFilterArrayMemberType([...filterArrayMemberType, newGroup]);
  };

  const handleAddNewRefGroup = (newGroupName) => {
    const newGroup = {
      id: Date.now(),
      ref: [],
      member_type: [],
      sex: [],
      name: newGroupName || "",
    };
    setFilterArrayMemberRef((prev) => [...prev, newGroup]);
  };

  const handleMemberGroupClick = (index) => {
    setOpenMemberGroupIndex(openMemberGroupIndex === index ? null : index);
  };

  const handleRefGroupClick = (index) => {
    setOpenRefGroupIndex(openRefGroupIndex === index ? null : index);
  };

  const handleCheckboxChange = (
    groupId,
    memberIdOrList,
    isSelectAll = false
  ) => {
    setFilterArrayMemberType((old) =>
      old.map((group) => {
        if (group.id === groupId) {
          if (isSelectAll) {
            return {
              ...group,
              member_type: memberIdOrList,
            };
          }
          const isSelected = group.member_type.includes(memberIdOrList);
          return {
            ...group,
            member_type: isSelected
              ? group.member_type.filter((id) => id !== memberIdOrList)
              : [...group.member_type, memberIdOrList],
          };
        }
        return group;
      })
    );
  };

  const handleRefCheckboxChange = (
    groupId,
    refCodeOrList,
    isSelectAll = false
  ) => {
    setFilterArrayMemberRef((old) =>
      old.map((group) => {
        if (group.id === groupId) {
          if (isSelectAll) {
            return {
              ...group,
              ref: refCodeOrList,
            };
          }
          const isSelected = group.ref.includes(refCodeOrList);
          return {
            ...group,
            ref: isSelected
              ? group.ref.filter((code) => code !== refCodeOrList)
              : [...group.ref, refCodeOrList],
          };
        }
        return group;
      })
    );
  };

  const handleDeleteGroup = (groupId) => {
    setFilterArrayMemberType((old) =>
      old.filter((group) => group.id !== groupId)
    );
  };

  const handleDeleteRefGroup = (groupId) => {
    setFilterArrayMemberRef((old) =>
      old.filter((group) => group.id !== groupId)
    );
  };

  const handleSexChange = (groupId, sex) => {
    setFilterArrayMemberType((old) =>
      old.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            sex: sex === "1,2" ? [1, 2] : [sex],
          };
        }
        return group;
      })
    );
  };

  const handleRefSexChange = (groupId, sex) => {
    setFilterArrayMemberRef((old) =>
      old.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            sex: sex === "1,2" ? [1, 2] : [sex],
          };
        }
        return group;
      })
    );
  };

  return (
    <div className="flex flex-col ">
      <div className={style.headStyle}>إحصائيات الاعضاء</div>
      <div className="flex w-full  gap-4 p-4">
        <div className="flex flex-col  gap-3">
          <FilterComponent
            handleGroupClick={handleMemberGroupClick}
            handleAddNewGroup={handleAddNewGroup}
            filterArrayMemberType={filterArrayMemberType}
            openGroupIndex={openMemberGroupIndex}
            memberTypeFilter={memberTypeFilter}
            handleCheckboxChange={handleCheckboxChange}
            handleDeleteGroup={handleDeleteGroup}
            handleSexChange={handleSexChange}
          />
          <FilterRef
            handleGroupClick={handleRefGroupClick}
            handleAddNewRefGroup={handleAddNewRefGroup}
            filterArrayMemberRef={filterArrayMemberRef}
            openGroupIndex={openRefGroupIndex}
            memberRefFilter={memberRefFilter}
            handleRefCheckboxChange={handleRefCheckboxChange}
            handleDeleteRefGroup={handleDeleteRefGroup}
            handleRefSexChange={handleRefSexChange}
          />
          <div className="flex flex-col gap-2"></div>
        </div>
        <div className="flex-1">
          <div className="w-full mt-10">
            <div
              className="flex gap-5 justify-center"
              dir="rtl"
              ref={componentRef}
            >
              {responseData.members.length > 0 && (
                <div className="mb-10 w-[45%]">
                  <table className={style.styleTable}>
                    <thead className={style.tableStyle}>
                      <tr>
                        <th className="bg-green-600">المجموعة</th>
                        <th className="bg-green-600">الإحصائيات</th>
                      </tr>
                    </thead>
                    <tbody className={style.textTable}>
                      {responseData.members.map((el, i) => (
                        <tr key={i}>
                          <td className="border p-2">
                            {filterArrayMemberType[i]?.name
                              ? filterArrayMemberType[i].name
                              : "مجموعة"}
                          </td>
                          <td className="border p-2">{el.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {responseData.members_ref.length > 0 && (
                <div className="w-[45%]">
                  <table className={style.styleTable}>
                    <thead className={style.tableStyle}>
                      <tr className="text-white">
                        <th className="bg-indigo-600">المجموعة</th>
                        <th className="bg-indigo-600">الإحصائيات</th>
                      </tr>
                    </thead>
                    <tbody className={style.textTable}>
                      {responseData.members_ref.map((el, i) => (
                        <tr key={i}>
                          <td className="border p-2">
                            {filterArrayMemberRef[i]?.name
                              ? filterArrayMemberRef[i].name
                              : "مجموعة"}
                          </td>
                          <td className="border p-2">{el.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateComponent;
