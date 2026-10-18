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
  {
    id: "member_type",
    name: "نوع العضوية",
    fieldType: "combo",
    dataType: "number",

    compound: true,
    lookup: true,
    required: false,
    disabled: false,
    hidden: false,
  },
  {
    id: "member_code",
    name: "رقم العضوية",
    fieldType: "input",
    dataType: "text",
    disabled: true,
    required: false,
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

    accept: ".png,.jpg",
    required: false,
  },
  {
    id: "birth_date",
    name: "تاريخ الميلاد",
    fieldType: "input",
    dataType: "date",

    required: false,
  },
  {
    id: "birth_place",
    name: "محل الميلاد",
    fieldType: "input",
    dataType: "text",
  },
  {
    id: "nationality",
    name: "الجنسية",
    fieldType: "combo",
    lookup: true,

    dataType: "number",
    required: false,
  },
  {
    id: "national_id",
    name: "الرقم القومي",
    fieldType: "input",
    dataType: "text",

    required: false,
  },
  {
    id: "sex",
    name: "الجنس",
    fieldType: "combo",
    lookup: true,
    dataType: "number",
    required: false,
  },
  {
    id: "city",
    name: "المدينة",
    fieldType: "combo",
    lookup: true,
    dataType: "number",
    required: false,
  },
  {
    id: "area",
    name: "المنطقة",
    fieldType: "combo",
    lookup: true,
    dataType: "number",
    required: false,
  },

  {
    id: "qual",
    name: "المؤهل الدراسي",
    fieldType: "combo",
    lookup: true,
    dataType: "number",
    required: false,
  },

  {
    id: "tel",
    name: "رقم الهاتف",
    fieldType: "input",
    dataType: "text",
    required: false,
  },
  {
    id: "address",
    name: "العنوان",
    fieldType: "input",
    dataType: "text",
    required: false,
  },
  {
    id: "job",
    name: "الوظيفة",
    fieldType: "combo",
    lookup: true,
    dataType: "number",
    required: false,
  },
  {
    id: "job_address",
    name: "عنوان العمل",
    fieldType: "input",
    dataType: "text",

    required: false,
  },
  {
    id: "job_tel",
    name: "هاتف العمل",
    fieldType: "input",
    dataType: "text",
    required: false,
  },
  {
    id: "marital_status",
    name: "الحالة الإجتماعية",
    fieldType: "combo",
    lookup: true,
    dataType: "number",

    required: false,
  },
  {
    id: "religion",
    name: "الديانة",
    fieldType: "combo",
    lookup: true,
    dataType: "number",
    required: false,
  },

  ////////////////////////////
  {
    id: "section",
    name: "القطاع",
    fieldType: "combo",
    lookup: true,
    dataType: "number",
    required: false,
  },
  {
    id: "join_date",
    name: "تاريخ الإلتحاق",
    fieldType: "input",
    dataType: "date",
    required: true,
  },

  // {
  //   id: "trans",
  //   name: "trans",
  //   fieldType: "combo",
  //   lookup: true,
  //   dataType: "number",
  //   required: false,
  // },

  ////////////////////////////
  {
    id: "remark",
    name: "ملاحظات",
    fieldType: "input",
    dataType: "text",
    required: false,
  },
];
