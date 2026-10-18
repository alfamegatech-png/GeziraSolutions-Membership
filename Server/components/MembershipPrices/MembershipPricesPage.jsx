"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AccessButton as Button } from "@components/Access/AccessButton";
import { Card } from "primereact/card";
import { InputNumber } from "primereact/inputnumber";
import { Toast } from "primereact/toast";
import {
  fetchMembershipPricesData,
  saveMembershipPricesData,
} from "./priceSettingsClient";

function PriceRow({ label, hint, value, onChange, disabled }) {
  return (
    <div className="grid align-items-center border-bottom-1 surface-border py-3 gap-2">
      <div className="col-12 md:col-5">
        <div className="font-bold">{label}</div>
        {hint && <small className="text-600">{hint}</small>}
      </div>
      <div className="col-12 md:col-3">
        <span className="text-700">{value ?? "بدون سعر"}</span>
      </div>
      <div className="col-12 md:col-4">
        <InputNumber
          value={value}
          onValueChange={(event) => onChange(event.value)}
          minFractionDigits={0}
          maxFractionDigits={4}
          className="w-full"
          inputClassName="w-full"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

const MembershipPricesPage = () => {
  const toast = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fixedSettings, setFixedSettings] = useState([]);
  const [memberTypes, setMemberTypes] = useState([]);
  const [refTypes, setRefTypes] = useState([]);

  const groupedFixedSettings = useMemo(() => {
    return fixedSettings.reduce((groups, item) => {
      const category = item.category || "إعدادات";
      return { ...groups, [category]: [...(groups[category] || []), item] };
    }, {});
  }, [fixedSettings]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchMembershipPricesData();
      setFixedSettings(data.fixedSettings);
      setMemberTypes(data.memberTypes);
      setRefTypes(data.refTypes);
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "خطأ",
        detail: "تعذر تحميل الأسعار",
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateFixedValue = (key, value) => {
    setFixedSettings((items) =>
      items.map((item) => (item.key === key ? { ...item, value } : item))
    );
  };

  const updateMemberTypeValue = (id, value) => {
    setMemberTypes((items) =>
      items.map((item) => (item.id === id ? { ...item, price: value } : item))
    );
  };

  const updateRefTypeValue = (id, value) => {
    setRefTypes((items) =>
      items.map((item) => (item.id === id ? { ...item, price: value } : item))
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveMembershipPricesData({
        fixedSettings: fixedSettings.map((item) => ({
          key: item.key,
          value: item.value,
        })),
        memberTypes: memberTypes.map((item) => ({
          id: item.id,
          value: item.price,
        })),
        refTypes: refTypes.map((item) => ({
          id: item.id,
          value: item.price,
        })),
      });

      toast.current?.show({
        severity: "success",
        summary: "تم",
        detail: "تم حفظ أسعار العضوية",
        life: 3000,
      });
      await loadData();
    } catch (error) {
      toast.current?.show({
        severity: "error",
        summary: "خطأ",
        detail: "تعذر حفظ الأسعار",
        life: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4" dir="rtl">
      <Toast ref={toast} />
      <div className="flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="m-0">تعديل اسعار العضويه</h2>
          <p className="text-600 mt-2 mb-0">
            الأسعار التي يتم إدخالها يدويًا في شاشات العمليات غير موجودة هنا.
          </p>
        </div>
        <Button permission="prices.edit"
          label="حفظ"
          icon="pi pi-save"
          loading={saving}
          onClick={save}
          disabled={loading}
        />
      </div>

      <Card title="أسعار أنواع العضوية" className="mb-4">
        {memberTypes.map((item) => (
          <PriceRow
            key={item.id}
            label={item.name}
            hint={`Code: ${item.code}`}
            value={item.price}
            onChange={(value) => updateMemberTypeValue(item.id, value)}
          />
        ))}
      </Card>

      <Card title="أسعار صلات التابعين" className="mb-4">
        {refTypes.map((item) => (
          <PriceRow
            key={item.id}
            label={item.name}
            hint={`${item.member_type} - Code: ${item.code}`}
            value={item.price}
            onChange={(value) => updateRefTypeValue(item.id, value)}
          />
        ))}
      </Card>

      {Object.entries(groupedFixedSettings).map(([category, items]) => (
        <Card title={category} className="mb-4" key={category}>
          {items.map((item) => (
            <PriceRow
              key={item.key}
              label={item.label}
              hint={item.key}
              value={item.value}
              onChange={(value) => updateFixedValue(item.key, value)}
            />
          ))}
        </Card>
      ))}
    </div>
  );
};

export default MembershipPricesPage;
