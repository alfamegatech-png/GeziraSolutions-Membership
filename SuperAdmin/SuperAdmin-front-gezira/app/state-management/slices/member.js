import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import Swal from "sweetalert2";

const _baseURL = `http://10.1.1.115:5000/api/insert-member`;
export const addMem = createAsyncThunk("addMem", async (member) => {
  let res;
  let err;
  await axios
    .post(_baseURL, member)
    .then((response) => {
      res = response;
    })
    .catch((error) => {
      err = error.response;
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "تعذر الاتصال بالسيرفر";

      if (message === "member_code already exists") {
        Swal.fire("هذا العضو موجود بالفعل");
      } else {
        Swal.fire("فشل إضافة العضو", message, "error");
      }
    });
  if (res) return { data: res.data };
  else if (err) return { response: err.data };
});

const memberSlice = createSlice({
  name: "addMember-slice",
  initialState: {
    member: {
      member_code: 0,
      name: "",
      // national_id: "",
      // marital_status: undefined,
      member_type: 1,
    },
    isAdded: false,
    isNotAdded: false,
  },
  reducers: {
    addedUser: (state) => {
      state.isAdded = false;
    },
    notAddedUser: (state) => {
      state.isNotAdded = false;
    },
  },
  extraReducers: {
    [addMem.pending]: (state, action) => {},
    [addMem.fulfilled]: (state, action) => {
      if (
        action.payload?.data?.message === "Member data inserted successfully"
      ) {
        state.isAdded = true;
      } else if (
        action.payload?.response?.error === "member_code already exists"
      ) {
        state.isNotAdded = true;
      }
    },
    [addMem.rejected]: (state, action) => {},
  },
});

export const { addedUser, notAddedUser } = memberSlice.actions;
export default memberSlice.reducer;
