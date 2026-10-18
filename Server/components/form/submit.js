
import { getStoredUser } from "@lib/browserStorage";
import {  createHistoryLogOnSubmit, createMember, createRefMember, getMemberById } from "@components/Members/member";

export default async (table, method, data, utils) => {
  const { fields, setLoading, toast, toggle, handleReload, setSelectedImage, selectedImage, router } = utils;
  
  setLoading(true);
  const data2Send = {};
  let originalData = {};
  
  // Fetch original data for update operations
  if (method === "update" && data.id) {
    originalData = await getMemberById(data.id, table); // Assuming this function exists and works correctly
  }

  fields
    .filter((field) => field.dataType !== "file")
    .forEach((field) => {
      if (field.dataType === "number" && isNaN(data[field.id])) {
        data2Send[field.id] = null;
      } else if (field.dataType === "date") {
        data2Send[field.id] = data[field.id] ? new Date(data[field.id]).toISOString() : null;
      } else if (field.dataType === "number") {
        data2Send[field.id] = data[field.id] ? Number(data[field.id]) : null;
      } else {
        data2Send[field.id] = data[field.id];
      }
    });

  if (selectedImage) {
    const formData = new FormData();
    formData.append("file", selectedImage);
    data2Send.file = formData;
  }

  let res;
  if (table === "members_ref") res = await createRefMember(method, data2Send);
  if (table === "members") res = await createMember(method, data2Send);

  setLoading(false);

  toast.current.show({
    severity: res.status,
    summary: res.status,
    detail: res.message,
    life: 3000,
  });

  // Log history if operation is successful
  if (res.status === "success") {
    const userId = getStoredUser().id; // Assuming you store user data like this
    const changes = {}; // Placeholder for detecting changes

    fields.forEach(field => {
      if (originalData[field.id] !== data2Send[field.id]) {
        changes[field.id] = { from: originalData[field.id], to: data2Send[field.id] };
      }
    });

    // Create a history log
    // changes = changes.replace(/\\/g, '');

    await createHistoryLogOnSubmit({
    user_id: userId,
    action: method,
    member_id: data2Send.id || res.data.id,
    changed_fields: Object.keys(changes),
    last_values: Object.entries(changes).map(([key, value]) => ({ field: key, value })),
});


    if (method === "update") {
      window.location.reload();
    } else if (method === "create") {
      router.push(`${table === "members_ref" ? "club/members/ref" : "club/members"}/${res.data.id}`);
    }
    setSelectedImage();
    toggle();
    handleReload();
  }
};
