import { configureStore } from "@reduxjs/toolkit";
import loginSlice from "./slices/login";
import memberSlice from './slices/member';
import refMemberSlice from './slices/ref-member';
import membershipSlice from './slices/memberships';

const store = configureStore({
    reducer: {
        login: loginSlice,
        member: memberSlice,
        refMember: refMemberSlice, 
        memberships: membershipSlice,
    }
})

export default store;