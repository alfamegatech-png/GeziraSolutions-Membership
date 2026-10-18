import { getData } from "@components/LazyTable/LazyTable";
import { requirePrivilege } from "@lib/accessControl";
const ExcelJS = require("exceljs");
export async function POST(request) {
  try { await requirePrivilege("reports.export"); } catch (error) { return Response.json({ message: error.status ? error.message : "تعذر التحقق من الصلاحيات" }, { status: error.status || 503 }); }
  // Create a new workbook

  const req = await request.json();
  const { table, lazyState, orderBy, include, filter } = req;

  const { data } = await getData(
    table,
    lazyState,
    orderBy,
    include,
    filter,
    undefined,
    true
  );

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet 1");
  const data2Excel = JSON.parse(data);
  //   Add headers
  worksheet.columns = Object.keys(data2Excel[0]).map((property) => ({
    header: property,
    key: property,
    width: 10,
  }));

  data2Excel.forEach((row) => {
    worksheet.addRow(row);
  });

  //   // Generate a unique filename
    // const filename = `data_${Date.now()}.xlsx`; 

  //   // Save the workbook to a file

  return new Response(await workbook.xlsx.writeBuffer(), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    },
  });
}
