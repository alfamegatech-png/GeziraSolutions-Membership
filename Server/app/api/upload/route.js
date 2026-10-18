import { NextResponse, NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@app/api/db";
import { requirePrivilege } from "@lib/accessControl";

// export const config = {
//   api: {
//     bodyParser: false, // enable form data
//   },
// };

export async function POST(req, res) {
  try {
    await requirePrivilege("attachments.manage");
    const data = await req.formData();
    const file = await data.get("file");
    const id = await data.get("id");

    const bufferData = Buffer.from(await file.arrayBuffer());

    fs.writeFile(
      `public/uploads/member-photo/${id}${path.extname(file.name)}`,
      bufferData,
      (err) => {
        if (err) {
          console.error("Operation failed", { code: typeof err?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(err.code) ? err.code : "UNAVAILABLE" });
          return;
        }
      }
    );
    const query = await prisma.members.update({
      where: { id },
      data: { image_name: `${id}${path.extname(file.name)}` },
    });

    return NextResponse.json({
      status: "success",
      message: "image successfully uploaded !",
    });
  } catch (err) {
    return NextResponse.json({
      status: "error",
      message: err.message,
    }, { status: err.status || 500 });
  }
}
