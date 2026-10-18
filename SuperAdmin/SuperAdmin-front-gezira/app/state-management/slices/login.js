import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
const _baseURL = `http://10.1.1.115:5000/api/login`;
export const loginUser = createAsyncThunk("login", async (userData) => {
  let res;
  let err;
  await axios
    .post(_baseURL, userData)
    .then((response) => {
      res = response;
      console.log(res);
    })
    .catch((error) => {
      err = error;
      console.log(err);
    });

  if (res) return { data: res.data };
  else if (err) return { response: err };
});

const loginSlice = createSlice({
  name: "login-slice",
  initialState: {
    user: {
      email: "",
      password: "",
    },
    isLogged: false,
    isLoading: false,
    // isHotelLogin:false,
    notValidUser: undefined,
  },
  reducers: {
    userLoggedout: (state) => {
      state.isLogged = false;
    },
    userLoggedin: (state) => {
      state.isLogged = true;
    },
    // userHotelLoggedin:(state)=>{
    //     state.isHotelLogin=true
    // },
    userValidation: (state) => {
      state.notValidUser = undefined;
    },
  },
  extraReducers: {
    [loginUser.pending]: (state, action) => {},
    [loginUser.fulfilled]: (state, action) => {
      if (action.payload.data?.message === "Successfully logged in") {
        console.log(action.payload.data);
        localStorage.setItem("token", action.payload.data.token);
        state.isLogged = true;

        // } else if  (action.payload.data?.message === "Successfully logged in" && action.payload.data?.email === "Hotel@hotel.com") {
        //     console.log(action.payload.data)
        //     localStorage.setItem("token", action.payload.data.token)
        //     state.isHotelLogin = true;
      } else if (
        action.payload.response?.error === "Invalid Email or Password"
      ) {
        state.notValidUser = true;
      }
    },
    [loginUser.rejected]: (state, action) => {},
  },
});

export const { userLoggedout, userLoggedin, userValidation } =
  loginSlice.actions;
export default loginSlice.reducer;
