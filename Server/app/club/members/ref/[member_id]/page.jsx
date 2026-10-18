"use client";
import React from "react";
import RefMemberDetails from "@components/RefMemberDetails/RefMemberDetails";

const page = ({ params }) => {
  const { member_id } = params;

  return <RefMemberDetails member_id={member_id} />;
};

export default page;
