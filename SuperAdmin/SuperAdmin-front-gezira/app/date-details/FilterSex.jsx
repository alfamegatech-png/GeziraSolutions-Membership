import React from "react";

const FilterSex = ({ groupId, handleSexChange, selectedSex }) => {
  return (
    <div className="mt-2">
      <label htmlFor={`sex-${groupId}`} className="block text-sm font-medium text-gray-700">
        الجنس
      </label>
      <select
        id={`sex-${groupId}`}
        value={selectedSex || ""}
        onChange={(e) => handleSexChange(groupId, e.target.value)}
        className="w-full p-2 mt-1 border border-gray-300 rounded-md"
      >
        <option value="" disabled hidden>
          اختر الجنس
        </option>
        <option value="1">ذكر</option>
        <option value="2">أنثى</option>
        <option value="1,2">الكل</option>
      </select>
    </div>
  );
};

export default FilterSex;
