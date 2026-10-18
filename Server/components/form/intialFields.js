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

    required: true,
    disabled: false,
    hidden: false,
  },
  {
    id: "member_code",
    name: "رقم العضوية",
    fieldType: "input",
    dataType: "text",

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

    accept: ".png,.jpg",
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
    id: "birth_place",
    name: "محل الولادة",
    fieldType: "input",
    dataType: "text",
  },
  {
    id: "nationality",
    name: "الجنسية",
    fieldType: "combo",
    lookup: true,

    dataType: "number",
    required: true,
  },
  {
    id: "national_id",
    name: "الرقم القومي",
    fieldType: "input",
    dataType: "text",

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
    id: "city",
    name: "city",
    fieldType: "combo",
    lookup: true,
    dataType: "number",
    required: true,
  },
  {
    id: "area",
    name: "المنطقة",
    fieldType: "combo",
    lookup: true,
    dataType: "number",
    required: true,
  },

  {
    id: "qual",
    name: "المؤهل الدراسي",
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
    dataType: "number",
  },
  {
    id: "tel",
    name: "رقم الهاتف",
    fieldType: "input",
    dataType: "text",
    required: true,
  },
  {
    id: "address",
    name: "العنوان",
    fieldType: "input",
    dataType: "text",
    required: true,
  },
  {
    id: "job",
    name: "الوظيفة",
    fieldType: "combo",
    lookup: true,
    dataType: "number",
    required: true,
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

    required: true,
  },
  {
    id: "religion",
    name: "الديانة",
    fieldType: "combo",
    lookup: true,
    dataType: "number",
    required: true,
  },
  {
    id: "start_date",
    name: "تاريخ البدء",
    fieldType: "input",
    dataType: "date",

    required: true,
  },
  {
    id: "end_date",
    name: "تاريخ الإنتهاء",
    fieldType: "input",
    dataType: "date",

    required: true,
  },
  ////////////////////////////
  {
    id: "section",
    name: "section",
    fieldType: "combo",
    lookup: true,
    dataType: "number",
    required: true,
  },

  {
    id: "trans",
    name: "trans",
    fieldType: "combo",
    lookup: true,
    dataType: "number",
    required: true,
  },

  ////////////////////////////
  {
    id: "remark",
    name: "ملاحظات",
    fieldType: "input",
    dataType: "text",
    required: false,
  },
  {
    id: "related_member_id",
    name: "related_member_id",
    fieldType: "input",
    dataType: "text",
    required: false,
    disabled: true,
    hidden: true,
  },
];
