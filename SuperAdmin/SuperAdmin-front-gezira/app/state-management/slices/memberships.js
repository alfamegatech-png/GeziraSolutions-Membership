import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import Swal from "sweetalert2";

const _baseURL = `http://10.1.1.115:5000/api/AddMemberShips`;

export const addMembership = createAsyncThunk(
  "add-membership",
  async (data) => {
    Object.keys(data).forEach((k) => data[k] == "" && delete data[k]);
    const membership = {
      membershipData: data,
    };
    console.log(membership);
    let res;
    let err;
    await axios
      .post(_baseURL, membership)
      .then((response) => {
        res = response;
        console.log(res);
        if (res.status === 201) {
          Swal.fire("تم الاشتراك بنجاح");
        }
      })
      .catch((error) => {
        err = error.response;
        console.log(err);
        const message =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "تعذر الاتصال بالسيرفر";

        if (message === "Duplicate name with the same member_code found") {
          Swal.fire("هذا العضو موجود مسبقا");
        } else if (message === "member_code not found") {
          Swal.fire("هذا العضو غير موجود");
        } else if (message === "Invoice creation failed: This receipt number is already paid.") {
          Swal.fire("رقم الايصال مدفوع من قبل");
        } else {
          Swal.fire("حدث خطأ", message, "error");
        }
      });
    if (res) return { data: res.data };
    else if (err) return { response: err.data };
  }
);

const membershipsSlice = createSlice({
  name: "memberships-slice",
  initialState: {
    memberships: {
      start_date: "",
      end_date: "",
      status: "",
      remark: "",
      member_code: "",
      member_order_date: "",
      delay_penalty: "",
      previous_penalties: "",
      maintenance_fee: "",
      membership_card_fee: "",
      fellowship_fund_fee: "",
      transfer_separation_fee: "",
      renew_fee: "",
      renew_years: "",
      total_amount: "",
      value_added_tax: "",
      is_synced: "",
      safe_no: 0,
      serial_no: "",
      user_id: "",
      swimming: "",
      first_time_fee: "",
      join_fee: "",
      form_no: "",
      canceled: "",
      secondary: "",
      related_membership: "",
      installment: "",
      new_ref_fees: "",
      prev_years_fee: "",
      ref_member_id: "",
      seperate_fees: "",
    },
    isAdded: false,
    isNotAdded: false,
  },
  reducers: {
    addedMembership: (state) => {
      state.isAdded = false;
    },
    notAddedMembership: (state) => {
      state.isNotAdded = false;
    },
  },
  extraReducers: {
    [addMembership.pending]: (state, action) => {},
    [addMembership.fulfilled]: (state, action) => {
      if (action.payload?.data?.message === "Success") {
        state.isAdded = true;
      } else if (
        action.payload?.response?.error ===
          "Invalid member_code: Member not found" ||
        action.payload?.response?.error === "Internal Server Error"
      ) {
        state.isNotAdded = true;
      }
    },
    [addMembership.rejected]: (state, action) => {},
  },
});

export const { addedMembership, notAddedMembership } = membershipsSlice.actions;
export default membershipsSlice.reducer;
