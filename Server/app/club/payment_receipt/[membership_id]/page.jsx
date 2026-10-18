"use server";
import PaymentReceipt from "@components/MemberDetails/PaymentReceipt";
import { getMembership } from "@components/Members/member";
import React from "react";

const PaymentReceiptPage = async ({ params }) => {
  const { membership_id } = params;
  const membership = await getMembership(membership_id);

  return <PaymentReceipt membership={membership} />;
};

export default PaymentReceiptPage;
