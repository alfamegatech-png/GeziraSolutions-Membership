import React, { useEffect, useState } from "react";
import { getOptions } from "./options";

const Field = ({
  id,
  name,
  value,
  onChange,
  isFormFieldInvalid,
  getFormErrorMessage,
  fieldType,
  dataType,
  disabled,
  required,
  hidden,
  accept,
  lookup,
  compound,
  comboOptions,
}) => {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    (async () => {
      if (fieldType == "combo" && lookup)
        setOptions(await getOptions(`lookup_${id}`));
      if (fieldType == "combo" && comboOptions) setOptions(comboOptions);
    })();
  }, []);
  return (
    <div className="flex flex-column gap-2" dir="rtl">
      <label htmlFor={id} hidden={hidden}>
        {name}
        {required && <span style={{ color: "red" }}>*</span>}
      </label>
      {fieldType == "input" && (
        <input
          id={id}
          name={id}
          disabled={disabled}
          hidden={hidden}
          required={required}
          value={
            dataType == "date"
              ? new Date(value).toJSON()?.substring(0, 10)
              : value
          }
          onChange={onChange}
          accept={accept}
          type={dataType}
        />
      )}
      {fieldType == "combo" && (
        <select
          id={id}
          name={id}
          disabled={disabled}
          hidden={hidden}
          required={required}
          value={value}
          onChange={onChange}
          accept={accept}
          type={dataType}
        >
          <option value={null}>أختر {name}</option>
          {options.map((el) =>
            compound ? (
              <option key={el.code} value={el.code}>
                {el.name} {el.code}
              </option>
            ) : (
              <option key={el.code} value={el.code}>
                {el.name}
              </option>
            )
          )}
        </select>
      )}

      {hidden != true && getFormErrorMessage(id)}
    </div>
  );
};

export default Field;
