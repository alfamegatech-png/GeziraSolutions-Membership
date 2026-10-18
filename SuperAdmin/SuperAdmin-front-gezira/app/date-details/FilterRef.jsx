import React, { useState } from "react";
import FilterSex from "./FilterSex";

const FilterRef = ({
  handleAddNewRefGroup,
  filterArrayMemberRef,
  handleGroupClick,
  openGroupIndex,
  memberRefFilter,
  handleRefCheckboxChange,
  handleDeleteRefGroup,
}) => {
  const [newGroupName, setNewGroupName] = useState("");

  const handleSelectAllChange = (groupId, isChecked) => {
    const allMemberRefs = memberRefFilter.map(ref => ref.code);
    const isAllSelected = filterArrayMemberRef.find(group => group.id === groupId)?.ref.length === memberRefFilter.length;
    const newMemberRefs = isChecked
      ? allMemberRefs
      : [];

    handleRefCheckboxChange(groupId, newMemberRefs, true);
  };

  const handleAddGroupClick = () => {
    if (newGroupName.trim() !== "") {
      handleAddNewRefGroup(newGroupName);
      setNewGroupName("");
    }
  };

  return (
    <div className="flex flex-col max-w-xs p-2 bg-white border border-gray-300 rounded-lg shadow-md">
      <div className="flex gap-1 items-center mb-3">
        <input
          type="text"
          placeholder="اسم المجموعة"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-l-lg"
        />
        <button
          onClick={handleAddGroupClick}
          className="p-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
        >
          إضافة
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {filterArrayMemberRef.length > 0 ? (
          filterArrayMemberRef.map((group, index) => (
            <div key={group.id} className="p-2 border border-gray-300 rounded-lg shadow-sm">
              <div
                className="flex items-center justify-between p-1 bg-indigo-400 rounded-full cursor-pointer"
                onClick={() => handleGroupClick(index)}
              >
                <span>{group.name || `مجموعة ${index + 1}`}</span>
                <span>{openGroupIndex === index ? "▲" : "▼"}</span>
              </div>
              {openGroupIndex === index && (
                <div className="mt-2">
                  <div className="mt-2">
                    <div className="flex items-center mt-1">
                      <input
                        type="checkbox"
                        id={`select-all-${group.id}`}
                        checked={group.ref.length === memberRefFilter.length}
                        onChange={(e) => handleSelectAllChange(group.id, e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor={`select-all-${group.id}`}>اختر الكل</label>
                    </div>
                    <div className="mt-2">
                      {memberRefFilter.length > 0 ? (
                        memberRefFilter.map((memberRef) => (
                          <div key={memberRef.code} className="flex items-center mt-1">
                            <input
                              type="checkbox"
                              id={memberRef.code}
                              checked={group.ref ? group.ref.includes(memberRef.code) : false}
                              onChange={() => handleRefCheckboxChange(group.id, memberRef.code)}
                              className="mr-2"
                            />
                            <label htmlFor={memberRef.code}>{memberRef.name}</label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">لا يوجد بيانات</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={() => handleDeleteRefGroup(group.id)}
                className="w-full py-1 mt-2 text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors duration-200"
              >
                حذف
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">لم يتم اضافة مجموعات حتي الان</p>
        )}
      </div>
    </div>
  );
};

export default FilterRef;
