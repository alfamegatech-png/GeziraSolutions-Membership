"use server";
const {
  first_time_fee_ACCOUNT,
  membership_card_fee_ACCOUNT,
  maintenance_fee_ACCOUNT,
  renew_fee_ACCOUNT,
  delay_penalty_ACCOUNT,
  swimming_ACCOUNT,
  value_added_tax_ACCOUNT,
  ERP_HOST,
  Total_Amount,
  seperate_fees_ACCOUNT,
  prev_years_fee_ACCOUNT,
  installment_ACCOUNT,
  join_fee_ACCOUNT,
  new_ref_fees_ACCOUNT,
  value_added_tax_swim_ACCOUNT,
} = process.env;
let storedCookie = "";
// import { PrismaClient as ClubPrismaClient } from "@generated/club";
// const prisma = new ClubPrismaClient();

// import { PrismaClient as ClubTheClubPrismaClient } from "@generated/clubtheclub";
// const clubTheClubPrisma = new ClubTheClubPrismaClient();
import prisma from "@app/api/db";
import { requirePrivilege, requireAnyPrivilege, requireSafe, assertSafe, tablePrivilege, scopeMemberHistory, scopeSafe, AccessError } from "@lib/accessControl";
import { decodeMemberId } from "@lib/memberLookup";
import { getPhoneLookupVariants } from "@lib/phoneLookup";
import { getSeparationRenewalContext } from "@lib/separationRenewalContext";
import { installmentContractState, assertNoPendingInstallments, isNewInstallmentReceipt, isNewInstallmentReceiptNumber } from "@lib/newMembershipInstallmentGuards";
import { getPaymentClock } from "@lib/paymentClock";
import fs from "fs";
import path from "path";
import util from "util";
import axios from "axios";
import { hostname } from "os";
import { getMembershipPriceSettingsMap } from "@components/MembershipPrices/priceSettingsActions";
const readFile = util.promisify(fs.readFile);
export async function createMemberAttachment(data, memberId) {
  await requirePrivilege("attachments.manage");
  try {
    // console.log(`Number of files being uploaded: ${data.length}`);
    // console.log(data, memberId);
    const promises = data.map(
      async ({ originalname, mimetype, size, buffer }) => {
        
        // Decode Base64 string to a buffer before sending to database
        const bufferBinary = Buffer.from(buffer, "base64");

        return prisma.member_attachments.create({
          data: {
            memberId,
            file_name: originalname,
            file_extension: mimetype,
            file_length: size,
            attachment_byte: bufferBinary, // Now correctly a Buffer object
          },
        });
      }
    );

    await Promise.all(promises);

    return {
      status: "success",
      message: `${data.length} files uploaded successfully!`,
    };
  } catch (err) {
    console.error("Error in createMemberAttachments:", { code: typeof err?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(err.code) ? err.code : "UNAVAILABLE" });
    return {
      status: "error",
      message: "An error occurred during file upload.",
    };
  }
}
export async function getMemberAttachments(memberId) {
  await requirePrivilege("attachments.view");
  try {
    const attachments = await prisma.member_attachments.findMany({
      where: { memberId: memberId },
      select: {
        id: true,
        file_name: true,
        file_extension: true,
        attachment_byte: true,
      },
    });

    if (attachments.length > 0) {
      return {
        status: "success",
        data: attachments,
        message: "Attachments fetched successfully.",
      };
    } else {
      return {
        status: "info",
        message: "No attachments found for the specified member.",
      };
    }
  } catch (err) {
    console.error("Error in getMemberAttachments:", { code: typeof err?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(err.code) ? err.code : "UNAVAILABLE" });
    return {
      status: "error",
      message: "An error occurred while fetching attachments.",
    };
  }
}
export async function deleteMember(user_id, id) {
  const access = await requirePrivilege("refs.delete");
  user_id = access.user.id;
  try {
    const query = await prisma.members_ref.update({
      where: { id },
      data: { deleted: 1 },
    });

    await createHistoryLogOnSubmit({
      user_id: user_id,
      action: "delete",
      member_id: id,
      changed_fields: ["deleted"],
      last_values: [{ field: "deleted", value: { from: 0, to: 1 } }],
    });

    return { status: "success", message: "Deleted Successfully!", data: query };
  } catch (err) {
    
    return { status: "error", message: err.message };
  }
}
export async function suspendOutdatedMembers() {
  await requirePrivilege("memberships.expire");
  const query = await prisma.memberships.updateMany({
    where: {
      // start_date: { lt: new Date(`${new Date().getFullYear()}`) },
      end_date: { lt: new Date() },

      status: { not: 2 },
    },
    data: { status: 2 },
  });

  return query.count;
}
export async function createHistoryLogOnSubmit({
  user_id,
  action,
  member_id,
  changed_fields,
  last_values,
}) {
  const access = await requireAnyPrivilege(["members.create", "members.edit", "members.suspend", "refs.create", "refs.edit", "refs.delete", "refs.separate", "receipts.cancel"]);
  user_id = access.user.id;
  try {
    const historyEntry = await prisma.history.create({
      data: {
        user_id,
        action,
        member_id,
        changed_fields,
        last_values,
      },
    });
    return historyEntry;
  } catch (error) {
    console.error("Error creating history log:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" });
    throw error;
  }
}
export async function getMemberById(id, tableName) {
  const access = await requirePrivilege(tablePrivilege(tableName));
  try {
    const member = await prisma[tableName].findUnique({
      where: { id },
    });
    if (member && tableName === "memberships") assertSafe(access, member.safe_no);
    return member;
  } catch (error) {
    console.error("Error fetching member by ID:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" });
    throw error;
  }
}
export async function cancelReciept(id, userID, Remarks) {
  const access = await requirePrivilege("receipts.cancel");
  userID = access.user.id;
  const ownedReceipt = await prisma.memberships.findUnique({ where: { id }, select: { safe_no: true } });
  if (!ownedReceipt) throw new AccessError("الإيصال غير موجود");
  assertSafe(access, ownedReceipt.safe_no);
  try {
    if (await isNewInstallmentReceipt(prisma, id)) throw new Error("إلغاء إيصال التقسيط من دورة تقسيط العضوية الجديدة فقط");
    const membershipsBeforeUpdate = await prisma.memberships.findMany({
      where: { OR: [{ id }, { related_membership: id }] },
      select: { id: true, canceled: true, status: true, remark: true },
    });
    const member = await prisma.memberships.findMany({
      where: { id: id },
      select: { member_code: true },
    });
    const Recipt = await prisma.memberships.findMany({
      where: { id: id },
      select: { installment: true },
    });
    if (Recipt[0].installment > 0) {
      throw new Error(
        "لا يمكنك حذف ايصال التقسيط من خلال برنامج العضوية برجاء الرجوع الي برنامج التقسيط"
      );
    }
    

    const memberId = await prisma.members.findUnique({
      where: { member_code: member[0].member_code },
      select: { id: true, name: true },
    });
    
    if (!membershipsBeforeUpdate.length) {
      return { status: "error", message: "No memberships found to cancel." };
    }

    const updateResult = await prisma.memberships.updateMany({
      where: { OR: [{ id }, { related_membership: id }] },
      data: { canceled: 1, status: 4, remark: Remarks },
    });

    // Loop over each membership to log the cancellation
    for (const membership of membershipsBeforeUpdate) {
      await createHistoryLogOnSubmit({
        user_id: userID,
        action: "Cancel Membership Receipt",
        member_id: memberId.id,
        changed_fields: ["canceled", "status", "remark"],
        last_values: [
          { field: "canceled", value: { from: membership.canceled, to: 1 } },
          { field: "status", value: { from: membership.status, to: 4 } },
          { field: "remark", value: { from: membership.remark, to: Remarks } },
        ],
      });
    }

    // Cancel in ERP system
    // await cancelErp(serial_no);
    

    return updateResult;
  } catch (err) {
    console.error("Error cancelling receipt:");
    return { status: "error", message: err.message };
  }
}
// export async function seperateMember(id, seperateFees, userID, safeNo) {
//   const currentDate = new Date();
//   const currentMonth = currentDate.getMonth();
//   const currentYear = currentDate.getFullYear();

//   const endDate = ()=> {
//     console.log(currentMonth)
//     if (currentMonth + 1 <= 6) {
//       return new Date(currentYear, 5, 31)
//     } else {
//       return new Date(currentYear + 1, 5, 31)
//     }
//   };

//   try {
//     const data = await prisma.members_ref.findUnique({ where: { id } });
//     const { name, sex, birth_date, remark, join_date, user_id, serial_no, member_code } = data;
//     const imageName = `${member_code}-${serial_no}.jpg`;

//     // Create new member_ref
//     const createdMember = await createMember("create", {
//       id,
//       name,
//       member_type: 5,
//       sex,
//       birth_date,
//       remark,
//       join_date,
//       user_id,
//     });

//     // Retrieve the last membership for the member_code
//     const lastMembership = await prisma.memberships.findFirst({
//       where: { member_code: member_code },
//       orderBy: { end_date: 'desc' }
//     });
// console.log(lastMembership,"lastMembership");
//     // Define new membership data possibly using details from lastMembership
//     // Make adjustments as necessary based on how you want to use the lastMembership details
//     const membershipData = await createMembership({
//       start_date: lastMembership.start_date,
//       end_date: lastMembership.end_date,
//       seperate_fees: seperateFees,
//       safe_no: safeNo,
//       user_id: userID,
//       member_code: createdMember.data.member_code,
//       total_amount: seperateFees, // Consider adjusting based on lastMembership if needed
//       secondary: lastMembership ? lastMembership.secondary : 4, // Example conditional usage
//       status: lastMembership.status,
//     });

//     const imageNewName = `${createdMember.data.member_code}.jpg`;

//     // Move the member's image file
//     await moveImage(imageName, imageNewName);

//     // Update members_ref if necessary
//     await prisma.members_ref.update({ where: { id },data:{deleted:1} });

//     return membershipData;
//   } catch (err) {
//     console.log(err.message);
//     return { status: "error", message: err.message };
//   }
// }
export async function seperateMember(id, _seperateFees, userID, _safeNo) {
  const access = await requirePrivilege("refs.separate");
  userID = access.user.id;
  try {
    id = decodeMemberId(id);
    if (!id) throw new Error("Invalid member id");
    const result = await prisma.$transaction(async (tx) => {
    const data = await tx.members_ref.findUnique({ where: { id } });
    if (!data || data.deleted !== 0) throw new Error("العضو التابع غير متاح للفصل");
    if (!Number.isInteger(data.member_code) || data.member_code <= 0) throw new Error("العضوية الأساسية غير متاحة للفصل");
    const {
      name,
      sex,
      birth_date,
      remark,
      join_date,
      user_id,
      serial_no,
      member_code,
    } = data;

    const imageName = `${member_code}-${serial_no}.jpg`;
    const source = await tx.memberships.findFirst({
      where: { member_code, canceled: 0, secondary: 0, start_date: { not: null }, end_date: { not: null } },
      orderBy: [{ end_date: "desc" }, { member_order_time: "desc" }],
      select: { end_date: true },
    });
    await assertNoPendingInstallments(tx, member_code);
    const separationContext = {
      sourceMemberCode: member_code,
      lastMembershipEndDate: source?.end_date ? new Date(source.end_date).toISOString() : null,
    };
    const maxCode = await tx.members.aggregate({ _max: { member_code: true } });
    const createdMember = await tx.members.create({ data: {
      id,
      name,
      member_type: 5,
      member_code: (maxCode._max.member_code || 0) + 1,
      sex,
      birth_date,
      remark,
      join_date,
      user_id,
    } });

    await tx.history.create({ data: {
      user_id: userID,
      action: "create_member",
      member_id: id,
      changed_fields: [
        "member_type",
        "name",
        "sex",
        "birth_date",
        "remark",
        "join_date",
        "user_id",
        "separation_renewal_context",
      ],
      last_values: [
        { field: "member_type", value: { from: null, to: 5 } },
        { field: "name", value: { from: null, to: name } },
        { field: "sex", value: { from: null, to: sex } },
        { field: "birth_date", value: { from: null, to: birth_date } },
        { field: "remark", value: { from: null, to: remark } },
        { field: "join_date", value: { from: null, to: join_date } },
        { field: "user_id", value: { from: null, to: user_id } },
        {
          field: "member_code",
          value: { from: null, to: createdMember.member_code },
        },
        { field: "separation_renewal_context", value: { from: null, to: separationContext } },
      ],
    } });

    await tx.members_ref.update({ where: { id }, data: { deleted: 1 } });
    await tx.history.create({ data: {
      user_id: userID,
      action: "delete_member",
      member_id: id,
      changed_fields: ["deleted"],
      last_values: [{ field: "deleted", value: { from: 0, to: 1 } }],
    } });
    return { member: createdMember, imageName };
    });
    await moveImage(result.imageName, `${result.member.member_code}.jpg`);
    return { status: "success", data: result.member };
  } catch (err) {
    
    return { status: "error", message: err.message };
  }
}
export async function moveImage(imageName, imageNewName) {
  await requirePrivilege("refs.separate");
  if (![imageName, imageNewName].every((name) => /^[\w-]+\.jpg$/.test(String(name)))) throw new AccessError("اسم الصورة غير صالح");
  try {
    const imagePath = `public/uploads/photos/members-ref/${imageName}`;
    const imageNewPath = `public/uploads/photos/members/${imageNewName}`;

    fs.access(imagePath, fs.constants.F_OK, (err) => {
      if (err) {
        
      } else {
        fs.rename(imagePath, imageNewPath, (moveErr) => {
          if (moveErr) {
            console.error("Error moving file:", { code: typeof moveErr?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(moveErr.code) ? moveErr.code : "UNAVAILABLE" });
          } else {
            
          }
        });
      }
    });
  } catch (err) {
    
    return { status: "error", message: err.message };
  }
}
export async function seperateDead(
  selectedMember,
  selectedRefMember,
  _seperateFees,
  _userID,
  _safeNo
) {
  const access = await requirePrivilege("refs.separate");
  selectedRefMember = { ...selectedRefMember, user_id: access.user.id };
  try {
    await assertNoPendingInstallments(prisma, selectedMember.member_code);
    const {
      id,
      name,
      sex,
      birth_date,
      remark,
      join_date,
      user_id,
      serial_no,
      member_code,
    } = selectedRefMember;

    const existingTargetMember = await prisma.members.findUnique({
      where: { id },
      select: { id: true, member_code: true },
    });
    if (existingTargetMember) {
      return {
        status: "error",
        message: "تم فصل هذا العضو من قبل أو أن رقم العضو مستخدم بالفعل",
      };
    }

    await prisma.$transaction([
      prisma.members.update({
        where: { id: selectedMember.id },
        data: {
          id,
          name,
          member_type: 5,
          sex,
          birth_date,
          remark,
          join_date,
          user_id,
        },
      }),
      prisma.members_ref.delete({ where: { id } }),
    ]);

    const imageName = `${member_code}-${serial_no}.jpg`;
    const imageNewName = `${member_code}.jpg`;
    await moveImage(imageName, imageNewName);
    return { status: "success", data: { id } };
  } catch (err) {
    console.error("Error separating member:", { code: typeof err?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(err.code) ? err.code : "UNAVAILABLE" });
    return {
      status: "error",
      message: err?.message || "تعذر فصل العضو",
    };
  }
}
export async function createMember(method, data) {
  if (!["create", "update"].includes(method)) throw new AccessError("عملية غير صالحة");
  const access = await requirePrivilege(method === "create" ? "members.create" : data.suspended !== undefined ? "members.suspend" : "members.edit");
  if (method === "update" && Object.keys(data).some((key) => !["id", "suspended", "suspended_date", "remark", "user_id"].includes(key))) await requirePrivilege("members.edit");
  data = { ...data, user_id: access.user.id };
  try {
    const { file } = data;
    delete data.file;

    if (method == "create") {
      const getMaxMemberCode = await prisma.members.aggregate({
        _max: {
          member_code: true,
        },
      });
      const maxMemberCode = getMaxMemberCode._max.member_code;

      data.member_code = maxMemberCode + 1;

      const query = await prisma.members.create({
        data,
      });
      if (file) await setImage(query.member_code, file, `members`);
      return {
        status: "success",
        message: "Created Successfully !",
        data: query,
      };
    }
    const { id } = data;
    const query = await prisma.members.update({
      where: { id },
      data,
    });
    if (file) await setImage(query.member_code, file, `members`);
    return {
      status: "success",
      message: "Updated Successfully !",
      data: query,
    };
  } catch (err) {
    
    return { status: "error", message: err.message };
  }
}
export async function createRefMember(method, data) {
  if (!["create", "update"].includes(method)) throw new AccessError("عملية غير صالحة");
  const access = await requirePrivilege(method === "create" ? "refs.create" : data.suspended !== undefined ? "members.suspend" : "refs.edit");
  if (method === "update" && Object.keys(data).some((key) => !["id", "suspended", "suspended_date", "remark", "user_id"].includes(key))) await requirePrivilege("refs.edit");
  if (method === "create" && Number(data.new_ref_fees) !== 0) {
    await requirePrivilege("memberships.subscribe");
    requireSafe(access);
    if (!Number.isFinite(Number(data.new_ref_fees)) || Number(data.new_ref_fees) < 0) throw new AccessError("رسوم التابع غير صالحة");
  }
  data = { ...data, user_id: access.user.id, safe_no: access.user.safe_no };
  try {
    const { file, member_code, new_ref_fees, safe_no, user_id } = data;
    if (method === "create") await assertNoPendingInstallments(prisma, member_code);
    delete data.file;
    delete data.new_ref_fees;
    delete data.safe_no;
    const SuspendedMember = await prisma.members.findMany({
      where: {
        member_code: member_code,
        suspended: "موقوف", // Arabic for "suspended"
      },
    });
    // console.log(member_code);

    // Check if the array is not empty, indicating we have suspended members.
    if (SuspendedMember.length > 0 && member_code !== undefined) {
      throw new Error(
        ` ${member_code}+هذا العضو موقوف حالياً، برجاء مراجعة حالة هذا العضو`
      ); // Member is currently suspended, please check this member's status
    }
    if (method == "create") {
      const getMaxSerial = await prisma.members_ref.aggregate({
        _max: {
          serial_no: true,
        },
        where: { member_code },
      });
      const maxSerial = getMaxSerial._max.serial_no;
      data.serial_no = maxSerial + 1;
      const query = await prisma.members_ref.create({
        data,
      });
      
      const now = new Date();
      const serverDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      if (Number(new_ref_fees) > 0) await createMembership({
        new_ref_fees,
        safe_no,
        user_id,
        member_code,
        total_amount: new_ref_fees,
        ref_member_id: query.id,
        secondary: 2,
        status: 1,
        member_order_date: serverDate,
        member_order_time: now,
      });
      if (file)
        await setImage(
          `${query.member_code}-${query.serial_no}`,
          file,
          `members-ref`
        );

      return {
        status: "success",
        message: "Created Successfully !",
        data: query,
      };
    }

    const { id } = data;
    const query = await prisma.members_ref.update({
      where: { id },
      data,
    });
    if (file)
      await setImage(
        `${query.member_code}-${query.serial_no}`,
        file,
        `members-ref`
      );
    return {
      status: "success",
      message: "Updated Successfully !",
      data: query,
    };
  } catch (err) {
    
    return { status: "error", message: err.message };
  }
}
export async function setImage(imageName, form, folder) {
  await requireAnyPrivilege(["attachments.manage", "members.create", "members.edit", "refs.create", "refs.edit"]);
  if (!["members", "members-ref"].includes(folder) || !/^[\w-]+$/.test(String(imageName))) throw new AccessError("مسار الصورة غير صالح");
  const file = await form.get("file");
  try {
    const bufferData = Buffer.from(await file.arrayBuffer());
    fs.writeFile(
      `public/uploads/photos/${folder}/${imageName}.jpg`,
      bufferData,
      (err) => {
        if (err) {
          console.error("Operation failed", { code: typeof err?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(err.code) ? err.code : "UNAVAILABLE" });
          return;
        }
      }
    );
    // await prisma[table].update({
    //   where: { id },
    //   data: { image_name: `${id}${path.extname(file.name)}` },
    // });

    return {
      status: "success",
      message: "image successfully uploaded !",
    };
  } catch (err) {
    return {
      status: "error",
      message: err.message,
    };
  }
}
export async function getImage(folder, imageName) {
  await requireAnyPrivilege(["members.view", "refs.view", "cards.print"]);
  const placeholder = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
  if (!["members", "members-ref"].includes(folder) || !/^[\w-]+$/.test(String(imageName))) return placeholder;
  const filePath = `public/uploads/photos/${folder}/${imageName}.jpg`;
  try {
    const image = await readFile(filePath, "base64");
    return `data:image/jpeg;base64,${image}`;
  } catch (err) {
    try {
      const image = await readFile("public/profile.jpg", "base64");
      return `data:image/jpeg;base64,${image}`;
    } catch {
      return placeholder;
    }
  }
}
export async function getMember(id) {
  const access = await requirePrivilege("members.view");
  id = decodeMemberId(id);
  if (!id) return null;
  const query = await prisma.members.findUnique({
    where: { id },
    include: {
      membership: {
        orderBy: {
          end_date: "desc",
        },
        where: { canceled: 0 },
        // take: 1,
        include: {
          rel_status: true,
          bookingLockersLinks: {
            include: {
              bookingLocker: {
                select: {
                  Id: true,
                  Price: true,
                  PaymentDate: true,
                  ReceiptNumber: true,
                },
              },
            },
          },
        },
      },
      rel_members: {
        include: { rel_ref: true },
      },
      rel_member_type: { select: { name: true, price: true } },
      rel_area: { select: { name: true } },
      rel_job: { select: { name: true } },
      rel_marital_status: { select: { name: true } },
      rel_city: { select: { name: true } },
      rel_nationality: { select: { name: true } },
      rel_qual: { select: { name: true } },

      rel_religion: { select: { name: true } },
      rel_section: { select: { name: true } },
      rel_sex: { select: { name: true } },
      rel_trans: { select: { name: true } },
    },
  });
  const separationContext = await getSeparationRenewalContext(prisma, query);
  const installment = await installmentContractState(prisma, query?.member_code);
  return query ? { ...scopeMemberHistory(access, query), ...(separationContext ? { separationRenewalContext: separationContext } : {}), ...(installment ? { newMembershipInstallment: installment } : {}) } : null;
}
export async function getRefMember(id) {
  const access = await requirePrivilege("refs.view");
  id = decodeMemberId(id);
  if (!id) return null;
  const query = await prisma.members_ref.findUnique({
    where: { id },
    include: {
      rel_member_type: { select: { name: true } },
      rel_ref: true,
      member: {
        include: {
          membership: true,
        },
      },
      rel_sex: { select: { name: true } },
    },
  });
  

  return scopeMemberHistory(access, query);
}
export async function getMembership(id) {
  const access = await requirePrivilege("receipts.view");
  const query = await prisma.memberships.findUnique({
      where: { id: String(id) },
    include: {
      member: true,
      bookingLockersLinks: {
        include: {
          bookingLocker: {
            select: {
              Id: true,
              Price: true,
              PaymentDate: true,
              ReceiptNumber: true,
            },
          },
        },
      },
    },
  });
  if (query) assertSafe(access, query.safe_no);
  return query;
}
export async function getMembershipsCreatedTodayByMemberCode(memberCode) {
  const access = await requirePrivilege("receipts.view");
  if (!Number.isInteger(memberCode) || memberCode <= 0) {
    return { status: "error", message: "Invalid member code", data: [] };
  }
  const { receiptDate } = getPaymentClock();

  try {
    const membershipsToday = await prisma.memberships.findMany({
      where: {
        AND: [
          {
            member_order_date: receiptDate,
          },
          {
            member_code: memberCode,
          },
          ...(access.privileges.includes("reports.all_safes") ? [] : [{ safe_no: scopeSafe(access) }]),
        ],
      },
      include: {
        member: {
          include: {
            rel_members: true,
          },
        },
        bookingLockersLinks: {
          include: {
            bookingLocker: {
              select: {
                Id: true,
                Price: true,
                PaymentDate: true,
                ReceiptNumber: true,
              },
            },
          },
        },
      },
    });

    // Return the query result
    
    return {
      status: "success",
      message: `Memberships for member code ${memberCode} created today fetched successfully.`,
      data: membershipsToday,
    };
  } catch (err) {
    // Log and return any error that occurs
    console.error("Operation failed");
    return { status: "error", message: err.message };
  }
}
// export async function createMembership(data) {
//   try {

//     const SuspendedMember = await prisma.members.findMany({
//       where: {
//         member_code: data.member_code,
//         suspended: "موقوف",
//       },
//     });
//     if (SuspendedMember.length > 0) {
//       throw new Error("هذا العضو موقوف حالياً، برجاء مراجعة حالة هذا العضو");
//     }

//     const query = await prisma.memberships.create({
//       data,
//     });

//     await syncERP(query);
//     // await cancelErp()
//     return {
//       status: "success",
//       message: "Created Successfully !",
//       data: query,
//     };
//   } catch (err) {
//     console.log(err.message);
//     return { status: "error", message: err.message };
//   }
// }

export async function LogIn() {
  await requireAnyPrivilege(["memberships.subscribe", "memberships.renew", "receipts.cancel"]);
  try {
    const response = await axios({
      method: "POST",
      url: `${ERP_HOST}/web/session/authenticate`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        jsonrpc: "2.0",
        params: {
          db: process.env.ERP_DB,
          login: process.env.ERP_USERNAME,
          password: process.env.ERP_PASSWORD,
        },
      },
    });

    const cookie = response.headers["set-cookie"];
    if (cookie) {
      storedCookie = cookie.join("; ");
    }

    
  } catch (error) {
    console.error("Error during authentication:  ");
  }
}
const fetchData = async () => {
  try {
    const response = await axios.get(
      `${ERP_HOST}/api/account_items_list?code=1010101`,
      {
        headers: {
          Cookie: storedCookie,
        },
      }
    );

    
  } catch (error) {
    
  }
};
async function syncERP(data) {
  try {
    let headersList = {
      Accept: "*/*",
      "Content-Type": "application/json",
      Cookie: storedCookie,
    };

    const {
      member_code,
      safe_no,
      serial_no,
      member_order_date,
      remark,
      first_time_fee,
      membership_card_fee,
      maintenance_fee,
      renew_fee,
      delay_penalty,
      swimming,
      ref_member_id,
      value_added_tax,
      total_amount,
      join_fee,
      installment,
      prev_years_fee,
      seperate_fees,
      new_ref_fees,
    } = data;
    const priceSettings = await getMembershipPriceSettingsMap();
    const Vat = 1 / (1 + Number(priceSettings.vat_rate || 0.14));
    const newSwimWithoutVat = swimming * Vat;
    const swimmingVat = swimming - newSwimWithoutVat;
    const separationAccountAmount = Number(
      data.transfer_separation_fee || data.seperate_fees || 0
    );
    let bodyContent = JSON.stringify({
      ref: `m-${serial_no}`,
      note: remark || "",
      account_items: [
        {
          account_id: await accountID(Total_Amount),
          credit: total_amount,
        },
        {
          account_id: await accountID(first_time_fee_ACCOUNT),
          debit: first_time_fee,
        },
        {
          account_id: await accountID(membership_card_fee_ACCOUNT),
          debit: membership_card_fee,
        },
        {
          account_id: await accountID(maintenance_fee_ACCOUNT),
          debit: maintenance_fee,
        },
        {
          account_id: await accountID(renew_fee_ACCOUNT),
          debit: renew_fee,
        },
        {
          account_id: await accountID(
            process.env.fellowship_fund_ACCOUNT || renew_fee_ACCOUNT
          ),
          debit: data.fellowship_fund_fee || 0,
        },
        {
          account_id: await accountID(swimming_ACCOUNT),
          debit: newSwimWithoutVat,
        },
        {
          account_id: await accountID(value_added_tax_swim_ACCOUNT),
          debit: swimmingVat,
        },
        {
          account_id: await accountID(value_added_tax_ACCOUNT),
          debit: value_added_tax,
        },
        {
          account_id: await accountID(join_fee_ACCOUNT),
          debit: join_fee,
        },
        {
          account_id: await accountID(installment_ACCOUNT),
          debit: installment,
        },
        {
          account_id: await accountID(prev_years_fee_ACCOUNT),
          debit: prev_years_fee,
        },
        {
          account_id: await accountID(delay_penalty_ACCOUNT),
          debit: Number(delay_penalty || 0) + Number(data.previous_penalties || 0),
        },
        {
          account_id: await accountID(seperate_fees_ACCOUNT),
          debit: separationAccountAmount,
        },
        {
          account_id: await accountID(new_ref_fees_ACCOUNT),
          debit: new_ref_fees,
        },
      ],
      currency: "1",
      created_date: member_order_date,
    });

    let reqOptions = {
      url: `${ERP_HOST}/journal/create/`,
      method: "POST",
      headers: headersList,
      data: bodyContent,
    };

    let response = await axios.request(reqOptions);
    if (response.data.status) {
      const query = await prisma.memberships.update({
        where: {
          id: data.id,
        },
        data: {
          is_synced: 1,
        },
      });
    }
    
  } catch (err) {
    
    return { status: "error", message: err.message };
  }
}
async function accountID(code) {
  try {
    let headersList = {
      Accept: "*/*",
      Cookie: storedCookie,
    };

    let reqOptions = {
      url: `${ERP_HOST}/api/account_items_list?code=${code}`,
      method: "GET",
      headers: headersList,
    };

    let response = await axios.request(reqOptions);
    return response.data.result[0].id;
  } catch (err) {
    
    return { status: "error", message: err.message };
  }
}
export async function cancelErp(serial_no) {
  await requirePrivilege("receipts.cancel");
  try {
    let headersList = {
      Accept: "*/*",
      Cookie: storedCookie,
    };

    // Concatenate "m-" with the serial number
    let bodyContent = JSON.stringify({
      ref: `m-${serial_no}`,
      note: `Canceled Cheques`,
    });

    let reqOptions = {
      url: `${ERP_HOST}/journal/cancel/`,
      method: "POST",
      headers: headersList,
      data: bodyContent,
    };

    let response = await axios.request(reqOptions);
    
    
    return response.data;
  } catch (err) {
    
    return { status: "error", message: err.message };
  }
}

async function login() {
  try {
    let headersList = {
      Accept: "*/*",
      "Content-Type": "application/json",
    };

    let bodyContent = JSON.stringify({
      jsonrpc: "2.0",
      params: { db: process.env.ERP_DEMO_DB, login: process.env.ERP_DEMO_USERNAME, password: process.env.ERP_DEMO_PASSWORD },
    });

    let reqOptions = {
      url: `${ERP_HOST}/web/session/authenticate`,
      method: "POST",
      headers: headersList,
      data: bodyContent,
    };

    let response = await axios.request(reqOptions);
    return response.data;
  } catch (err) {
    
    return { status: "error", message: err.message };
  }
}
async function test_login() {
  try {
    let headersList = {
      Accept: "*/*",
    };

    let reqOptions = {
      url: `${ERP_HOST}/my_services_api/ping/?message=test%20login`,
      method: "GET",
      headers: headersList,
    };

    let response = await axios.request(reqOptions);
    return response.data;
  } catch (err) {
    
    return { status: "error", message: err.message };
  }
}

export async function getMemberByMemberCode(member_code) {
  await requirePrivilege("members.view");
  if (!Number.isInteger(member_code) || member_code <= 0) return null;
  const query = await prisma.members.findFirst({
    where: {
      member_code: member_code,
    },
    include: {
      rel_member_type: { select: { name: true, price: true } },
      rel_area: { select: { name: true } },
      rel_job: { select: { name: true } },
      rel_marital_status: { select: { name: true } },
      rel_city: { select: { name: true } },
      rel_nationality: { select: { name: true } },
      rel_qual: { select: { name: true } },
      rel_religion: { select: { name: true } },
      rel_section: { select: { name: true } },
      rel_sex: { select: { name: true } },
      rel_trans: { select: { name: true } },
    },
  });

  
  return query;
}

export async function getMemberByPhoneNumber(phoneNumber) {
  await requirePrivilege("members.view");
  const variants = getPhoneLookupVariants(phoneNumber);
  if (!variants.length) return null;
  let match = await prisma.members.findFirst({
    where: { tel: { in: variants } },
    select: { id: true },
  });
  if (!match) {
    // Imported telephone fields may contain several complete numbers separated by slashes.
    const matches = await prisma.$queryRaw`
      SELECT m.id FROM public.members AS m
      WHERE EXISTS (
        SELECT 1 FROM regexp_split_to_table(
          translate(COALESCE(m.tel, ''), '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789'),
          E'[/,;،\\n\\r]+'
        ) AS phone(value)
        WHERE regexp_replace(phone.value, '[^0-9]', '', 'g') = ANY(${variants}::text[])
      )
      LIMIT 1
    `;
    match = matches[0];
  }
  return match || null;
}
export async function Invoice(transactionRequest, userId) {
  const access = await requireAnyPrivilege(["memberships.subscribe", "memberships.renew", "memberships.swim", "lockers.collect"]);
  userId = access.user.id;
  transactionRequest = { ...transactionRequest, safeNumber: String(requireSafe(access)) };
  try {
    const SafeNumber = transactionRequest.safeNumber;
    if (!SafeNumber) {
      throw new Error(
        "The employee does not have a safe number to make transactions."
      );
    }
    
    
    const TotalPrice = transactionRequest.debit?.totalPrice;
    if (typeof TotalPrice !== "number") {
      throw new Error(
        "Invalid or missing Debit object in the transaction request."
      );
    }
    if (!Array.isArray(transactionRequest.Credits)) {
      throw new Error("Credits must be an array.");
    }
    const ExistingTransaction = await prisma.transactions.findFirst({
      where: { ReceiptNumber: transactionRequest.receiptNumber },
    });
    if (ExistingTransaction) {
      throw new Error("This receipt number is already paid.");
    }

    let FilteredCredits = transactionRequest.Credits.filter(
      (credit) => credit.money && credit.money > 0
    );
    FilteredCredits = Object.values(
      FilteredCredits.reduce((creditsByAccount, credit) => {
        const accountNumberId = String(credit.accountNumberId);
        creditsByAccount[accountNumberId] = {
          accountNumberId,
          money:
            Number(creditsByAccount[accountNumberId]?.money || 0) +
            Number(credit.money || 0),
        };
        return creditsByAccount;
      }, {})
    );
    const CreditTotalPrice = FilteredCredits.reduce(
      (sum, credit) => sum + (credit.money || 0),
      0
    );
    const roundedTotalPrice = Number(TotalPrice.toFixed(2));
    const roundedCreditTotalPrice = Number(CreditTotalPrice.toFixed(2));
    if (roundedTotalPrice !== roundedCreditTotalPrice) {
      throw new Error(
        `The sum of credit does not equal the debit. debit=${roundedTotalPrice}, credits=${roundedCreditTotalPrice}`
      );
    }
    const ConvertedSafeNumber = String(SafeNumber);
    const NewTransaction = await prisma.transactions.create({
      data: {
        SafeNumber: ConvertedSafeNumber,
        ReceiptNumber: transactionRequest.receiptNumber,
        CreateByMembershipUser: userId,
        CreateAt: new Date(),
      },
    });
    const TransactionAccountNumbers = [];
    for (const Credit of FilteredCredits) {
      const AccountNumberId = parseInt(Credit.accountNumberId, 10);
      if (isNaN(AccountNumberId)) {
        throw new Error(`Invalid account number ID: ${Credit.accountNumberId}`);
      }
      const Account = await prisma.accountNumbers.findUnique({
        where: { Id: AccountNumberId },
      });
      if (!Account) {
        throw new Error(
          `Account number with ID ${AccountNumberId} does not exist.`
        );
      }
      const TransactionAccount = await prisma.transaction_AccountNumbers.create(
        {
          data: {
            TransactionId: NewTransaction.Id,
            AccountNumberId: AccountNumberId,
            Money: Credit.money,
          },
        }
      );
      TransactionAccountNumbers.push(TransactionAccount);
    }
    const InvoiceData = {
      TransactionId: NewTransaction.Id,
      SafeNumber: NewTransaction.SafeNumber,
      ReceiptNumber: NewTransaction.ReceiptNumber,
      TotalDebit: TotalPrice,
      TotalCredit: CreditTotalPrice,
      Remark: transactionRequest.remark || "",
      AccountItems: TransactionAccountNumbers.map((Account) => ({
        AccountId: Account.AccountNumberId,
        Money: Account.Money,
      })),
      CreatedAt: new Date(),
    };
    return {
      status: "success",
      message: "Transaction created successfully with local invoice generated.",
      data: InvoiceData,
    };
  } catch (error) {
    console.error("Invoice creation failed:");
    return { status: "error", message: error.message };
  }
}

export async function hasPendingLockerBooking(memberCode) {
  await requirePrivilege("members.view");
  if (!Number.isInteger(memberCode) || memberCode <= 0) {
    return { status: "error", message: "Invalid member code", data: [], totalPrice: 0 };
  }
  try {
    const unpaidLockerBookings = await prisma.bookingLockers.findMany({
      where: {
        MemberCode: memberCode,
        PaymentDate: null,
        PaymentCanceled: false,
        CancelBy: null,
        CancellationReason: null,
      },
      select: {
        Id: true,
        Name: true,
        Price: true,
        StartDateOfBooking: true,
        EndDateOfBooking: true,
      },
    });

    if (!unpaidLockerBookings || unpaidLockerBookings.length === 0) {
      return {
        status: "success",
        data: null,
        totalPrice: 0,
        message: "No pending locker bookings found.",
      };
    }

    const totalPrice = unpaidLockerBookings.reduce(
      (sum, locker) => sum + (locker.Price || 0),
      0
    );

    return {
      status: "success",
      data: unpaidLockerBookings,
      totalPrice: Number(totalPrice.toFixed(2)),
      message: "Pending locker bookings retrieved successfully.",
    };
  } catch (error) {
    console.error("Error checking for pending locker booking:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" });
    return {
      status: "error",
      data: null,
      message: "An error occurred while checking for pending locker bookings.",
    };
  }
}

// export async function createMembership(data) {
//   try {
//     const membership = await prisma.$transaction(async (tx) => {
//       const unpaidLockerBooking = await prisma.bookingLockers.findFirst({
//         where: {
//           MemberCode: data.member_code, // Use the MemberCode from the request
//           PaymentDate: null, // Check for unpaid bookings
//           PaymentCanceled: false, // Exclude canceled bookings
//           CancelBy: null,
//           CancellationReason: null, // Exclude deleted or inactive bookings
//         },
//       });

//       if (unpaidLockerBooking) {
//         const displayName =
//           unpaidLockerBooking.MemberRefName || unpaidLockerBooking.Name;
//         throw new Error(
//           `لا يمكن متابعة العملية. الحجز الخاص بقسم الدواليب بالاسم ${displayName} لم يتم سداده بعد.`
//         );
//       }

//       const createdMembership = await tx.memberships.create({
//         data,
//       });

//       var swimmingVat;
//       var SwimmingBeforVat;
//       if (data.swimming) {
//         const Vat = 100 / 114;
//         swimmingVat = data.swimming * Vat;
//         SwimmingBeforVat = data.swimming - swimmingVat;
//       }

//       const transactionRequest = {
//         safeNumber: data.safe_no,
//         receiptNumber: createdMembership.serial_no,
//         debit: {
//           totalPrice: Number(data.total_amount.toFixed(2)) || 0,
//         },
//         Credits: [
//           {
//             accountNumberId: process.env.membership_card_fee_ACCOUNT,
//             money: data.membership_card_fee || 0,
//           },
//           {
//             accountNumberId: process.env.maintenance_fee_ACCOUNT,
//             money: data.maintenance_fee || 0,
//           },
//           {
//             accountNumberId: process.env.renew_fee_ACCOUNT,
//             money: data.renew_fee || 0,
//           },
//           {
//             accountNumberId: process.env.delay_penalty_ACCOUNT,
//             money: data.delay_penalty || 0,
//           },
//           {
//             accountNumberId: process.env.swimming_ACCOUNT,
//             money: swimmingVat || 0,
//           },
//           {
//             accountNumberId: process.env.value_added_tax_ACCOUNT,
//             money: data.value_added_tax || 0,
//           },
//           {
//             accountNumberId: process.env.join_fee_ACCOUNT,
//             money: data.join_fee || 0,
//           },
//           {
//             accountNumberId: process.env.installment_ACCOUNT,
//             money: data.installment || 0,
//           },
//           {
//             accountNumberId: process.env.prev_years_fee_ACCOUNT,
//             money: data.prev_years_fee || 0,
//           },
//           {
//             accountNumberId: process.env.seperate_fees_ACCOUNT,
//             money: data.seperate_fees || 0,
//           },
//           {
//             accountNumberId: process.env.seperate_fees_ACCOUNT,
//             money: data.seperate_fees || 0,
//           },
//           {
//             accountNumberId: process.env.new_ref_fees_ACCOUNT,
//             money: data.new_ref_fees || 0,
//           },
//           {
//             accountNumberId: process.env.value_added_tax_swim_ACCOUNT,
//             money: SwimmingBeforVat || 0,
//           },
//           {
//             accountNumberId: process.env.first_time_fee_ACCOUNT,
//             money: data.first_time_fee || 0,
//           },
//         ],
//       };

//       const invoiceResult = await Invoice(transactionRequest, data.user_id);
//       const bookedLockerIds = [2, 3, 4, 5];

//       const test = await processMultipleLockerPayments(bookedLockerIds, 78, 10);
//       console.log(test);
//       if (invoiceResult.status === "error") {
//         throw new Error(`Invoice creation failed: ${invoiceResult.message}`);
//       }

//       return {
//         membership: createdMembership,
//         invoice: invoiceResult.data,
//       };
//     });

//     return {
//       status: "success",
//       message: "Membership and invoice created successfully!",
//       data: membership,
//     };
//   } catch (err) {
//     console.error("Membership creation failed:", err.message);
//     return { status: "error", message: err.message };
//   }
// }
export async function createMembership(
  data,
  bookingLockerIds,
  user_id,
  safeNumber
) {
  const access = await requirePrivilege(Number(data.swimming) > 0 ? "memberships.swim" : Number(data.join_fee) > 0 || Number(data.first_time_fee) > 0 || Number(data.new_ref_fees) > 0 || Number(data.installment) > 0 ? "memberships.subscribe" : "memberships.renew");
  data = { ...data, user_id: access.user.id, safe_no: requireSafe(access) };
  user_id = access.user.id;
  safeNumber = data.safe_no;
  try {
    const membership = await prisma.$transaction(async (tx) => {
      await assertNoPendingInstallments(tx, data.member_code);
      const unpaidLockerBooking = await tx.BookingLockers.findFirst({
        where: {
          MemberCode: data.member_code,
          PaymentDate: null,
          PaymentCanceled: false,
          CancelBy: null,
          CancellationReason: null,
        },
      });

      // Optional unpaid locker booking check:
      // if (unpaidLockerBooking) {
      //   const displayName =
      //     unpaidLockerBooking.MemberRefName || unpaidLockerBooking.Name;
      //   throw new Error(
      //     `لا يمكن متابعة العملية. الحجز الخاص بقسم الدواليب بالاسم ${displayName} لم يتم سداده بعد.`
      //   );
      // }

      const paymentClock = getPaymentClock();
      const createdMembership = await tx.memberships.create({
        data: {
          ...data,
          member_order_date: paymentClock.receiptDate,
          member_order_time: paymentClock.instant,
        },
      });

      let swimmingVat = 0;
      let SwimmingBeforVat = 0;

      if (data.swimming) {
        const priceSettings = await getMembershipPriceSettingsMap();
        const Vat = 1 / (1 + Number(priceSettings.vat_rate || 0.14));
        swimmingVat = data.swimming * Vat;
        SwimmingBeforVat = data.swimming - swimmingVat;
      }
      const separationAccountAmount = Number(
        data.transfer_separation_fee || data.seperate_fees || 0
      );

      const transactionRequest = {
        safeNumber: data.safe_no.toString(),
        receiptNumber: createdMembership.serial_no,
        debit: {
          totalPrice: Number(data.total_amount.toFixed(2)) || 0,
        },
        Credits: [
          {
            accountNumberId: process.env.membership_card_fee_ACCOUNT,
            money: data.membership_card_fee || 0,
          },
          {
            accountNumberId: process.env.maintenance_fee_ACCOUNT,
            money: data.maintenance_fee || 0,
          },
          {
            accountNumberId: process.env.renew_fee_ACCOUNT,
            money: data.renew_fee || 0,
          },
          {
            accountNumberId:
              process.env.fellowship_fund_ACCOUNT ||
              process.env.renew_fee_ACCOUNT,
            money: data.fellowship_fund_fee || 0,
          },
          {
            accountNumberId: process.env.delay_penalty_ACCOUNT,
            money:
              Number(data.delay_penalty || 0) +
              Number(data.previous_penalties || 0),
          },
          {
            accountNumberId: process.env.swimming_ACCOUNT,
            money: swimmingVat || 0,
          },
          {
            accountNumberId: process.env.value_added_tax_ACCOUNT,
            money: data.value_added_tax || 0,
          },
          {
            accountNumberId: process.env.join_fee_ACCOUNT,
            money: data.join_fee || 0,
          },
          {
            accountNumberId: process.env.installment_ACCOUNT,
            money: data.installment || 0,
          },
          {
            accountNumberId: process.env.prev_years_fee_ACCOUNT,
            money: data.prev_years_fee || 0,
          },
          {
            accountNumberId: process.env.seperate_fees_ACCOUNT,
            money: separationAccountAmount,
          },
          {
            accountNumberId: process.env.new_ref_fees_ACCOUNT,
            money: data.new_ref_fees || 0,
          },
          {
            accountNumberId: process.env.value_added_tax_swim_ACCOUNT,
            money: SwimmingBeforVat || 0,
          },
          {
            accountNumberId: process.env.first_time_fee_ACCOUNT,
            money: data.first_time_fee || 0,
          },
        ],
      };

      const invoiceResult = await InvoiceWithTransaction(
        transactionRequest,
        data.user_id,
        tx,
        paymentClock.instant
      );

      if (invoiceResult.status === "error") {
        throw new Error(`Invoice creation failed: ${invoiceResult.message}`);
      }

      if (
        Array.isArray(bookingLockerIds) && bookingLockerIds.length > 0
      ) {
        const lockersPaymentResult = await processMultipleLockerPayments(
          bookingLockerIds,
          user_id,
          safeNumber,
          createdMembership.id,
          tx,
          paymentClock.instant
        );

        if (lockersPaymentResult.status === "error") {
          throw new Error(lockersPaymentResult.message);
        }
      }

      return {
        membership: createdMembership,
        invoice: invoiceResult.data,
      };
    });

    return {
      status: "success",
      message:
        "Membership, invoices, and (if applicable) locker payments created successfully!",
      data: membership,
    };
  } catch (err) {
    console.error("Membership creation failed:");
    return { status: "error", message: err.message };
  }
}

export async function createMembershipseperate(data) {
  const access = await requirePrivilege("memberships.subscribe");
  data = { ...data, user_id: access.user.id, safe_no: requireSafe(access) };
  try {
    // await LogIn()
    // await accountID("1010101")
    const SuspendedMember = await prisma.members.findMany({
      where: {
        member_code: data.member_code,
        suspended: "موقوف", // Arabic for "suspended"
      },
    });
    // Check if the array is not empty, indicating we have suspended members.
    if (SuspendedMember.length > 0) {
      throw new Error("هذا العضو موقوف حالياً، برجاء مراجعة حالة هذا العضو"); // Member is currently suspended, please check this member's status
    }

    const query = await prisma.memberships.create({
      data,
    });
    

    // await syncERP(query);
    // await cancelErp()
    return {
      status: "success",
      message: "Created Successfully !",
      data: query,
    };
  } catch (err) {
    
    return { status: "error", message: err.message };
  }
}

export async function reverse(ReceiptNumber, userId) {
  const access = await requirePrivilege("receipts.cancel");
  userId = access.user.id;
  try {
    if (await isNewInstallmentReceiptNumber(prisma, ReceiptNumber)) throw new Error("عكس قيد التقسيط من دورة تقسيط العضوية الجديدة فقط");
    if (!ReceiptNumber || ReceiptNumber <= 0) {
      throw new Error("Please provide a valid receipt number.");
    }

    const transaction = await prisma.transactions.findFirst({
      where: { ReceiptNumber, Canceled: false },
    });

    if (!transaction) {
      throw new Error("Transaction not found or already reversed.");
    }
    assertSafe(access, transaction.SafeNumber);

    const updatedTransaction = await prisma.transactions.update({
      where: { Id: transaction.Id },
      data: {
        Canceled: true,
        CancelByMembershipUser: userId,
        CancelAt: new Date(),
      },
    });

    return {
      status: "success",
      message: "Transaction reversed successfully.",
      data: updatedTransaction,
    };
  } catch (err) {
    console.error("Reverse failed:");
    return { status: "error", message: err.message };
  }
}

function getSafeNumberFromContext() {
  // Placeholder for fetching safe number from the context or request
  return "12345"; // Example safe number
}

function getUserIdFromContext() {
  // Placeholder for fetching user ID from the context or request
  return "1"; // Example user ID
}

export async function processMultipleLockerPayments(
  bookedLockerIds,
  userId,
  safeNumber,
  membershipId,
  tx,
  paymentInstant = new Date()
) {
  const access = await requirePrivilege("lockers.collect");
  userId = access.user.id;
  safeNumber = requireSafe(access);
  if (!Array.isArray(bookedLockerIds) || bookedLockerIds.length === 0) {
    throw new Error("At least one booking locker ID is required.");
  }

  if (!safeNumber) {
    throw new Error("Safe number is required to process payments.");
  }

  if (!userId) {
    throw new Error("User ID is required to process payments.");
  }

  const transactionRequests = [];

  for (const bookedLockerId of bookedLockerIds) {
    if (!bookedLockerId || bookedLockerId <= 0) {
      throw new Error(`Invalid booking locker ID: ${bookedLockerId}`);
    }

    const bookingLocker = await tx.BookingLockers.findFirst({
      where: { Id: bookedLockerId },
    });

    if (!bookingLocker) {
      throw new Error(`Booking locker not found for ID: ${bookedLockerId}`);
    }

    if (bookingLocker.PaymentDate) {
      throw new Error(
        `Locker ID ${bookedLockerId} payment has already been completed.`
      );
    }

    const paymentDate = paymentInstant;

    await tx.BookingLockers.update({
      where: { Id: bookedLockerId },
      data: {
        PaymentDate: paymentDate,
        SafeNumber: safeNumber.toString(),
        UserId: parseInt(userId, 10),
      },
    });

    await tx.MembershipBookingLocker.create({
      data: {
        membershipId: membershipId,
        bookingLockerId: bookedLockerId,
      },
    });

    transactionRequests.push({
      safeNumber: safeNumber.toString(),
      receiptNumber: bookingLocker.ReceiptNumber,
      debit: {
        totalPrice: bookingLocker.Price,
      },
      Credits: [
        {
          accountNumberId: process.env.Tax,
          money: bookingLocker.Tax,
        },
        {
          accountNumberId: process.env.Locker,
          money: bookingLocker.PriceWithoutTax,
        },
      ],
    });
  }

  for (const request of transactionRequests) {
    
    
    const invoiceResult = await InvoiceWithTransaction(
      request,
      userId.toString(),
      tx,
      paymentInstant
    );

    if (invoiceResult.status !== "success") {
      throw new Error(
        `Invoice generation failed for receipt ${request.receiptNumber}: ${invoiceResult.message}`
      );
    }
  }

  return {
    status: "success",
    message: "All booking locker payments and invoices processed successfully.",
  };
}

export async function InvoiceWithTransaction(transactionRequest, userId, tx, paymentInstant = new Date()) {
  const access = await requireAnyPrivilege(["memberships.subscribe", "memberships.renew", "memberships.swim", "lockers.collect", "installments.collect_deposit", "installments.collect"]);
  userId = access.user.id;
  transactionRequest = { ...transactionRequest, safeNumber: String(requireSafe(access)) };
  try {
    const SafeNumber = transactionRequest.safeNumber;
    if (!SafeNumber) {
      throw new Error("Safe number is required for transaction.");
    }

    const TotalPrice = transactionRequest.debit?.totalPrice;
    if (typeof TotalPrice !== "number") {
      throw new Error(
        "Invalid or missing Debit object in the transaction request."
      );
    }

    if (!Array.isArray(transactionRequest.Credits)) {
      throw new Error("Credits must be an array.");
    }

    const ExistingTransaction = await tx.transactions.findFirst({
      where: { ReceiptNumber: transactionRequest.receiptNumber },
    });

    if (ExistingTransaction) {
      throw new Error(
        `Receipt number ${transactionRequest.receiptNumber} is already paid.`
      );
    }

    let FilteredCredits = transactionRequest.Credits.filter(
      (credit) => credit.money && credit.money > 0
    );
    FilteredCredits = Object.values(
      FilteredCredits.reduce((creditsByAccount, credit) => {
        const accountNumberId = String(credit.accountNumberId);
        creditsByAccount[accountNumberId] = {
          accountNumberId,
          money:
            Number(creditsByAccount[accountNumberId]?.money || 0) +
            Number(credit.money || 0),
        };
        return creditsByAccount;
      }, {})
    );

    const CreditTotalPrice = FilteredCredits.reduce(
      (sum, credit) => sum + (credit.money || 0),
      0
    );

    const roundedTotalPrice = Number(TotalPrice.toFixed(2));
    const roundedCreditTotalPrice = Number(CreditTotalPrice.toFixed(2));
    if (roundedTotalPrice !== roundedCreditTotalPrice) {
      throw new Error(
        `The sum of credits does not equal the debit. debit=${roundedTotalPrice}, credits=${roundedCreditTotalPrice}`
      );
    }

    const NewTransaction = await tx.transactions.create({
      data: {
        SafeNumber: SafeNumber,
        ReceiptNumber: transactionRequest.receiptNumber,
        CreateByMembershipUser: userId,
        CreateAt: paymentInstant,
      },
    });

    const TransactionAccountNumbers = [];

    for (const Credit of FilteredCredits) {
      const AccountNumberId = parseInt(Credit.accountNumberId, 10);
      if (isNaN(AccountNumberId)) {
        throw new Error(`Invalid account number ID: ${Credit.accountNumberId}`);
      }

      const Account = await tx.accountNumbers.findUnique({
        where: { Id: AccountNumberId },
      });

      if (!Account) {
        throw new Error(
          `Account number with ID ${AccountNumberId} does not exist.`
        );
      }

      const TransactionAccount = await tx.transaction_AccountNumbers.create({
        data: {
          TransactionId: NewTransaction.Id,
          AccountNumberId: AccountNumberId,
          Money: Credit.money,
        },
      });

      TransactionAccountNumbers.push(TransactionAccount);
    }

    const InvoiceData = {
      TransactionId: NewTransaction.Id,
      SafeNumber: NewTransaction.SafeNumber,
      ReceiptNumber: NewTransaction.ReceiptNumber,
      TotalDebit: TotalPrice,
      TotalCredit: CreditTotalPrice,
      Remark: transactionRequest.remark || "",
      AccountItems: TransactionAccountNumbers.map((Account) => ({
        AccountId: Account.AccountNumberId,
        Money: Account.Money,
      })),
      CreatedAt: NewTransaction.CreateAt,
    };

    return {
      status: "success",
      message: "Transaction created successfully within transaction.",
      data: InvoiceData,
    };
  } catch (error) {
    console.error("Invoice creation (transaction) failed:");
    return { status: "error", message: error.message };
  }
}

export async function calculateMemberRefAge(id) {
  await requirePrivilege("refs.view");
  try {
    const member = await prisma.members_ref.findUnique({
      where: { id },
      select: { birth_date: true },
    });

    if (!member || !member.birth_date) {
      throw new Error("Member not found or birth date not available");
    }

    const birthDate = new Date(member.birth_date);
    const currentDate = new Date();

    let age = currentDate.getFullYear() - birthDate.getFullYear();

    if (
      currentDate.getMonth() < birthDate.getMonth() ||
      (currentDate.getMonth() === birthDate.getMonth() &&
        currentDate.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return {
      status: "success",
      message: "Age calculated successfully",
      data: { age },
    };
  } catch (err) {
    console.error("Error calculating age:");
    return { status: "error", message: err.message };
  }
}
