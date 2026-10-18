import React, { useEffect, useRef, useState } from "react";
import { InputText } from "primereact/inputtext";
import { formatMemberDate, parseMemberDate } from "./memberDateInput";
import "./memberFilters.css";

export default function MemberDateFilter({ options, label }) {
  const [draft, setDraft] = useState(() => formatMemberDate(options.value));
  const [invalid, setInvalid] = useState(false);
  const applied = useRef(formatMemberDate(options.value));
  useEffect(() => {
    const value = formatMemberDate(options.value);
    applied.current = value;
    setDraft(value);
    setInvalid(false);
  }, [options.value]);
  const applyDate = (text) => {
    const date = parseMemberDate(text);
    if (date === undefined) { setInvalid(true); return; }
    const formatted = formatMemberDate(date);
    setDraft(formatted);
    setInvalid(false);
    if (formatted !== applied.current) {
      applied.current = formatted;
      options.filterApplyCallback(date);
    }
  };
  return (
    <span className="member-date-filter">
      <InputText
        aria-label={`بحث ${label}`}
        aria-invalid={invalid}
        title={invalid ? "تاريخ غير صحيح" : label}
        placeholder="يوم/شهر/سنة"
        value={draft}
        maxLength={10}
        inputMode="numeric"
        autoComplete="off"
        onChange={(event) => {
          setDraft(event.target.value);
          setInvalid(false);
          if (!event.target.value) applyDate("");
        }}
        onBlur={(event) => applyDate(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.nativeEvent?.isComposing) return;
          event.preventDefault();
          event.stopPropagation();
          applyDate(event.currentTarget.value);
        }}
      />
    </span>
  );
}
