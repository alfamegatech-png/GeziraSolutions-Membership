import React, { useEffect, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { getMemberSearchOptions } from "./memberSearchOptions";

export default function MemberSearchFilters({ filters, onApply }) {
  const nationality = filters?.nationality?.value ?? null;
  const job = filters?.job?.value ?? null;
  const memberType = filters?.member_type?.value ?? null;
  const memberCode = filters?.member_code?.value ?? "";
  const [draft, setDraft] = useState({ nationality, job, member_type: memberType, member_code: memberCode });
  const [options, setOptions] = useState({ nationalities: [], jobs: [], memberTypes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    setDraft({ nationality, job, member_type: memberType, member_code: memberCode });
  }, [nationality, job, memberType, memberCode]);
  useEffect(() => {
    let active = true;
    getMemberSearchOptions().then((data) => { if (active) setOptions(data); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const fields = [
    ["nationality", "الجنسية", options.nationalities],
    ["job", "الوظيفة", options.jobs],
    ["member_type", "نوع العضوية", options.memberTypes],
  ];
  return (
    <form className="member-search-filters" aria-label="فلاتر بحث الأعضاء" dir="rtl"
      onSubmit={(event) => { event.preventDefault(); onApply(draft); }}>
      {fields.map(([field, label, items]) => (
        <div className="member-top-filter" key={field}>
          <label htmlFor={`member-search-${field}`}>{label}</label>
          <Dropdown
            inputId={`member-search-${field}`}
            value={draft[field]}
            options={items.map((item) => ({ ...item, label: `${item.name} (${item.code})` }))}
            optionLabel="label"
            optionValue="code"
            filter
            showClear
            loading={loading}
            disabled={loading || error}
            placeholder="الكل"
            emptyMessage="لا توجد خيارات"
            emptyFilterMessage="لا توجد نتائج"
            onChange={(event) => setDraft((previous) => ({ ...previous, [field]: event.value ?? null }))}
          />
        </div>
      ))}
      <div className="member-top-filter-actions">
        <Button type="submit" label="بحث" icon="pi pi-search" />
        <Button type="button" label="مسح الفلاتر" icon="pi pi-filter-slash" outlined
          onClick={() => {
            setDraft({ nationality: null, job: null, member_type: null, member_code: "" });
            onApply({}, true);
          }} />
      </div>
      {error && <p role="alert">تعذر تحميل خيارات البحث. أعد تحميل الصفحة للمحاولة مرة أخرى.</p>}
    </form>
  );
}
