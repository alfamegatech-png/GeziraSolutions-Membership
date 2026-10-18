import {
  degrees,
  PDFDocument,
  rgb,
  StandardFonts,
  PDFOperator,
  PDFFont,
} from "pdf-lib";
import { att_font } from "./font";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";
import prisma from "@app/api/db";
import { requirePrivilege } from "@lib/accessControl";

import util from "util";
import { getImage } from "@components/Members/member";
import { boldd } from "./bold";
import { arialFont } from "./base64Img";
import { base64Pdf } from "./base64PDF";

const readFile = util.promisify(fs.readFile);
export async function GET(request) {
  try { await requirePrivilege("cards.print"); } catch (error) { return Response.json({ message: error.status ? error.message : "تعذر التحقق من الصلاحيات" }, { status: error.status || 503 }); }
  // return new Response("hghgh");
  

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const ref = searchParams.get("ref");
  const textSize = parseInt(searchParams.get("textSize")) || 42;

  

  // const existingPdfBytes = await readFile("public/cardFinal.pdf", (err) => {
  //   console.log("Error", err);
  // });

  const existingPdfBytes = Uint8Array.from(
    atob(base64Pdf), 
    (char) => char.charCodeAt(0)
  );

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  pdfDoc.setLanguage("ar-eg");

  // Embed the Helvetica font
  const TimesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  pdfDoc.registerFontkit(fontkit);

  const arabic = await pdfDoc.embedFont(arialFont);

  const pages = pdfDoc.getPages();
  const page = pages[0];

  const query = await prisma[ref ? "members_ref" : "members"].findUnique({
    where: { id },
    // include: { rel_member_type: { select: { name: true } } },
    include: ref
      ? { rel_ref: { select: { name: true, code: true, member_type: true } } }
      : { rel_member_type: { select: { name: true, code: true } } },
  });

  function wrapText(text, font, fontSize, maxWidth) {
    const words = `الاسم : ${text}`.split(" ");
    const lines = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth < maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
  }

  if (query) {
    

    let {
      member_code,
      serial_no,
      name,
      image_name,
      member_type,
      rel_ref,
      rel_member_type,
    } = query;

    async function embedType(folder, imageName) {
      const imageBase64 = await getImage(folder, imageName);
      const base64Data = imageBase64.slice(imageBase64.indexOf(",") + 1);
      const imageBuffer = await Buffer.from(base64Data, "base64");
      return imageBase64.startsWith("data:image/png;")
        ? await pdfDoc.embedPng(imageBuffer)
        : await pdfDoc.embedJpg(imageBuffer);
    }
    const image1 = await embedType("members", member_code);

    if (ref) {
      const query = await prisma.members.findUnique({
        where: {
          member_code,
        },
      });

      const image2 = await embedType(
        "members-ref",
        `${member_code}-${serial_no}`
      );

      renderImages(image2, image1);
    } else {
      renderImages(image1, image1);
    }
    function renderImages(first, second) {
      page.drawImage(first, {
        x: 78.7, //112
        y: 170,
        width: 174.2,
        height: 279.1,
      });
      page.drawImage(second, {
        x: 266.5,
        y: 170,
        width: 62.5,
        height: 80.2,
      });
    }
    const label1 = name;
    const label2 = `رقم العضوية: `;

    // const label3 =rel_member_type.name;
    const label3 = rel_ref?.name ? rel_ref.member_type : rel_member_type?.name;

    const labels = [label1, label2, label3];

    // labels.forEach((el, index) => {
    //   page.drawText(el, {
    //     x: 540 - arabic.widthOfTextAtSize(el, textSize),
    //     y: 400 - (index - 1) * 27,
    //     size: textSize,

    //     font: arabic,
    //     color: rgb(0, 0, 0),
    //     rotate: degrees(0),
    //   });
    // });

    async function renderLabel1(label1, arabic, page) {
      const lines = wrapText(label1, arabic, textSize, 600);

      let yPosition = 380;

      for (const line of lines) {
        page.drawText(line, {
          x: 905 - arabic.widthOfTextAtSize(line, textSize),
          y: yPosition,
          size: textSize,
          font: arabic,
          color: rgb(0, 0, 0),
          rotate: degrees(0),
        });
        yPosition -= textSize * 1.2;
      }
    }
    await renderLabel1(label1, arabic, page);
    page.drawText(`نوع العضوية : ${label3}`, {
      x: 905 - arabic.widthOfTextAtSize(`نوع العضوية : ${label3}`, textSize),
      y: 180,
      size: textSize,
      font: arabic,
      color: rgb(0, 0, 0),
      rotate: degrees(0),
    });
    

    page.drawText(
      `رقم العضوية : ${String(member_code)?.split("").reverse().join("")}`,
      {
        x:
          905 -
          arabic.widthOfTextAtSize(
            `رقم العضوية : ${String(member_code)}`,
            textSize
          ),
        y: 250,
        size: textSize,
        font: arabic,
        color: rgb(0, 0, 0),
        rotate: degrees(0),
      }
    );
    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
      },
    });
  }
  return new Response("No such member");
}

// import { degrees, PDFDocument, rgb, StandardFonts, PDFOperator, PDFFont } from "pdf-lib";
// import { att_font } from "./font";
// import fontkit from "@pdf-lib/fontkit";
// import fs from "fs";
// import path from "path";
// import prisma from "@app/api/db";
// import util from "util";
// import { getImage } from "@components/Members/member";
// import { boldd } from "./bold";

// const readFile = util.promisify(fs.readFile);

// export async function GET(request) {
//   const { searchParams } = new URL(request.url);
//   const id = searchParams.get("id");
//   const ref = searchParams.get("ref");

//   const existingPdfBytes = await readFile("public/card.pdf");
//   const Vazirmatn = await readFile("public/NotoSansArabic_Condensed-Black.ttf");

//   const pdfDoc = await PDFDocument.load(existingPdfBytes);
//   pdfDoc.setLanguage("ar-eg");

//   // Embed the Helvetica font
//   const TimesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
//   const TimesRoman1 = await pdfDoc.embedFont(StandardFonts.Courier);
//   pdfDoc.registerFontkit(fontkit);

//   const arabic = await pdfDoc.embedFont(att_font);

//   const pages = pdfDoc.getPages();
//   const page = pages[0];

//   const query = await prisma[ref ? "members_ref" : "members"].findUnique({
//     where: { id },
//     include: { rel_member_type: { select: { name: true } } },
//   });

//   if (query) {
//     const {
//       member_code,
//       serial_no,
//       name,
//       image_name,
//       member_type,
//       rel_member_type,
//     } = query;

//     async function embedType(folder, imageName) {
//       const imageBase64 = await getImage(folder, imageName);
//       const base64Data = imageBase64.replace(data:image/jpeg;base64,, "");
//       const imageBuffer = Buffer.from(base64Data, "base64");
//       return await pdfDoc.embedJpg(imageBuffer);
//     }

//     const image1 = await embedType("members", member_code);

//     if (ref) {
//       const query = await prisma.members.findUnique({
//         where: { member_code },
//       });
//       const image2 = await embedType("members-ref", ${member_code}-${serial_no});
//       renderImages(image2, image1);
//     } else {
//       renderImages(image1, image1);
//     }

//     function renderImages(first, second) {
//       page.drawImage(first, { x: 112, y: 143, width: 175, height: 279.5 });
//       page.drawImage(second, { x: 306.5, y: 143, width: 62.5, height: 80 });
//     }

//     const label1 = name;
//     const label2 = `رقم العضوية: `;
//     const label3 = rel_member_type.name;

//     const labels = [label1, label2, label3];
//     const textSize = 25;
//     const MAX_WIDTH = 400;

//     function wrapText(text, font, fontSize, maxWidth) {
//       const words = text.split(" ");
//       const lines = [];
//       let currentLine = "";

//       for (const word of words) {
//         const testLine = currentLine ? ${currentLine} ${word} : word;
//         const testWidth = font.widthOfTextAtSize(testLine, fontSize);

//         if (testWidth < maxWidth) {
//           currentLine = testLine;
//         } else {
//           if (currentLine) lines.push(currentLine);
//           currentLine = word;
//         }
//       }
//       if (currentLine) lines.push(currentLine);

//       return lines;
//     }

//     async function renderLabel1(label1, arabic, page) {
//       const fontSize = 25;
//       const lines = wrapText(label1, arabic, fontSize, MAX_WIDTH);

//       let yPosition = 343;

//       for (const line of lines) {
//         page.drawText(line, {
//           x: 760 - arabic.widthOfTextAtSize(line, fontSize),
//           y: yPosition,
//           size: fontSize,
//           font: arabic,
//           color: rgb(0, 0, 0),
//           rotate: degrees(0),
//         });
//         yPosition -= fontSize * 1.2;
//       }

//     }

//     async function renderLabels() {
//       page.drawText(label3, {
//         x: 692 - arabic.widthOfTextAtSize(label3, textSize),
//         y: 157,
//         size: textSize,
//         font: arabic,
//         color: rgb(0, 0, 0),
//         rotate: degrees(0),
//       });

//       page.drawText(String(member_code), {
//         x: 700 - arabic.widthOfTextAtSize(String(member_code), textSize),
//         y: 245,
//         size: textSize,
//         font: arabic,
//         color: rgb(0, 0, 0),
//         rotate: degrees(0),
//       });
//       const pdfBytes = await pdfDoc.save();
//     }

//     async function renderLabel3(label3, arabic, page) {
//       const fontSize = 25;
//       const lines = wrapText(label3, arabic, fontSize, MAX_WIDTH);
//       let yPosition = 270; // Start position for label3 (adjusted for spacing)

//       for (const line of lines) {
//         page.drawText(line, {
//           x: 760 - arabic.widthOfTextAtSize(line, fontSize),
//           y: yPosition,
//           size: fontSize,
//           font: arabic,
//           color: rgb(0, 0, 0),
//           rotate: degrees(0),
//         });
//         yPosition -= fontSize * 1.2;
//       }
//     }

//     await renderLabel1(label1, arabic, page);
//     await renderLabels()

//     return new Response(await pdfDoc.save(), {
//       headers: { "Content-Type": "application/pdf" },
//     });
//   }

//   return new Response("No such member");
// }
