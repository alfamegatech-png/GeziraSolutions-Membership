export const intialFields = [
  {
    id: "id",
    name: "id",
    fieldType: "input",
    dataType: "text",

    required: false,
    disabled: false,
    hidden: true,
  },
  // {
  //   id: "member_type",
  //   name: "نوع العضوية",
  //   fieldType: "combo",
  //   dataType: "number",

  //   compound: true,
  //   // comboOptions: [
  //   //   { code: 2, name: "عضو تابع" },
  //   //   { code: 6, name: "تابع لعضو عامل" },
  //   //   { code: 26, name: "تابع ذو احتياجات خاصه" },
  //   // ],
  //   lookup: true,
  //   required: true,
  //   disabled: false,
  //   hidden: false,
  // },
  {
    id: "member_code",
    name: "رقم العضوية",
    fieldType: "input",
    dataType: "number",
    disabled: true,
    required: true,
  },
  {
    id: "name",
    name: "الاسم",
    fieldType: "input",
    dataType: "text",
    required: true,
  },
  {
    id: "image",
    name: "الصورة الشخصية",
    fieldType: "input",
    dataType: "file",

    accept: ".jpg",
    required: false,
  },
  {
    id: "birth_date",
    name: "تاريخ الميلاد",
    fieldType: "input",
    dataType: "date",

    required: true,
  },

  {
    id: "sex",
    name: "الجنس",
    fieldType: "combo",
    lookup: true,
    dataType: "number",
    required: true,
  },

  {
    id: "ref",
    name: "صلة القرابة",
    fieldType: "combo",
    lookup: true,
    required: true,
    dataType: "number",
  },
  {
    id: "serial_no",
    name: "ترتيبه",
    fieldType: "input",
    required: false,
    disabled: true,
    dataType: "number",
  },
  {
    id: "join_date",
    name: "تاريخ الإلتحاق",
    fieldType: "input",
    dataType: "date",
    required: true,
  },
];
