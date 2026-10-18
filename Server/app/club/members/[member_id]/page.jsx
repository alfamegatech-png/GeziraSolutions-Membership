"use client";
import React from "react";
import MemberDetails from "@components/MemberDetails/MemberDetails";

const page = ({ params }) => {

  const { member_id } = params;

  return <MemberDetails member_id={member_id} />;
};

export default page;
