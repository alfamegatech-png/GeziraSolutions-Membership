import React, { useState } from "react";
import FilterSex from "./FilterSex";

const FilterComponent = ({
  handleAddNewGroup,
  filterArrayMemberType,
  handleGroupClick,
  openGroupIndex,
  memberTypeFilter,
  handleCheckboxChange,
  handleDeleteGroup,
  handleSexChange,
}) => {
  
  const [newGroupName, setNewGroupName] = useState("");

  const handleSelectAllChange = (groupId, isChecked) => {
    const allMemberTypes = memberTypeFilter.map(type => type.code);
    const isAllSelected = filterArrayMemberType.find(group => group.id === groupId)?.member_type.length === memberTypeFilter.length;
    const newMemberTypes = isChecked
      ? allMemberTypes
      : [];

    handleCheckboxChange(groupId, newMemberTypes, true);
  };

  const handleAddGroupClick = () => {
    if (newGroupName.trim() !== "") {
      handleAddNewGroup(newGroupName);
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
          className="p-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors duration-200"
        >
          إضافة
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {filterArrayMemberType.length > 0 ? (
          filterArrayMemberType.map((group, index) => (
            <div key={group.id} className="p-2 border border-gray-300 rounded-lg shadow-sm">
              <div
                className="flex items-center justify-between p-1 bg-green-400 rounded-full cursor-pointer"
                onClick={() => handleGroupClick(index)}
              >
                <span>{group.name || `مجموعة ${index + 1}`}</span>
                <span>{openGroupIndex === index ? "▲" : "▼"}</span>
              </div>
              {openGroupIndex === index && (
                <div className="mt-2">
                  <FilterSex groupId={group.id} handleSexChange={handleSexChange} selectedSex={group.sex} />
                  <div className="mt-2">
                    <div className="flex items-center mt-1">
                      <input
                        type="checkbox"
                        id={`select-all-${group.id}`}
                        checked={group.member_type.length === memberTypeFilter.length}
                        onChange={(e) => handleSelectAllChange(group.id, e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor={`select-all-${group.id}`}>اختر الكل</label>
                    </div>
                    {memberTypeFilter.length > 0 ? (
                      memberTypeFilter.map((memberType) => (
                        <div key={memberType.code} className="flex items-center mt-1">
                          <input
                            type="checkbox"
                            id={memberType.code}
                            checked={group.member_type.includes(memberType.code)}
                            onChange={() => handleCheckboxChange(group.id, memberType.code)}
                            className="mr-2"
                          />
                          <label htmlFor={memberType.code}>{memberType.name}</label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">لا يوجد بيانات</p>
                    )}
                  </div>
                </div>
              )}
              <button
                onClick={() => handleDeleteGroup(group.id)}
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

export default FilterComponent;
