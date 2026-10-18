"use client";
import React from "react";
import InstallmentMemberDetails from "@components/InstallmentMemberDetails/InstallmentMemberDetails";
const page = ({ params }) => {

  const { account_id } = params;

  return <InstallmentMemberDetails account_id={account_id} />;
};

export default page;
