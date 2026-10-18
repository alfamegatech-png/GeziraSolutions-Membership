"use client"
import { Formik, Form, Field } from 'formik';
import { useEffect, useRef,useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addMembership, addedMembership, notAddedMembership } from '@/app/state-management/slices/memberships';
import { Container, Row, Col } from 'react-bootstrap';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';


export default function SwimmingMemberships() {
  const [decoded, setDecoded] = useState(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Ensure code runs only on the client side
      const token = localStorage.getItem('token');
      if (token) {
        setDecoded(jwtDecode(token));
      }
    }
  }, []);
  const dropdownStyle = {
    backgroundColor: 'white',
    color: "black",
    border: "2px solid black",
    borderRadius: "5px",

    // Set your desired background color here
    // Add more styles as needed
  };
  const dropdownOptions = [
    { value: '1', label: 'نشط' },
    { value: '2', label: 'منتهي' },
    { value: '3', label: 'متوقف' },
  ];
  const { memberships, isAdded, isNotAdded } = useSelector(state => state.memberships);
  const dispatch = useDispatch();
  useEffect(() => {
    setTimeout(() => {
      dispatch(addedMembership())
      dispatch(notAddedMembership())
    }, 3500)
  }, [isAdded, isNotAdded])

  const totalRef = useRef()
  console.log(totalRef.current);

  const validMemberCode = (value) => { let error; if (!value) return error = "هذا الحقل مطلوب" }
  const validateMemberOrderDate = (value) => { let error; if (!value) return error = "هذا الحقل مطلوب" }
  const validateStartDate = (value) => { let error; if (!value) return error = "هذا الحقل مطلوب" }
  const validateEndDate = (value) => { let error; if (!value) return error = "هذا الحقل مطلوب" }
  const validateSerialNo = (value) => { let error; if (!value) return error = "هذا الحقل مطلوب" }
  const validateFormNo = (value) => { let error; if (!value) return error = "هذا الحقل مطلوب" }
  const validateVAT = (value) => { let error; if (!value) return error = "هذا الحقل مطلوب" }
  const validateSwimming = (value) => { let error; if (!value) return error = "هذا الحقل مطلوب" }
  const validateTotalAmount = (value) => { let error; if (!value) return error = "هذا الحقل مطلوب" }
  const validateStatus = (value) => { let error; if (!value) return error = "هذا الحقل مطلوب" }

  return <>
    <div>
      <Container>
        <Row>
          <Col>
            {isAdded && (<div>
              <div className="w-50 mx-auto mt-5" role="alert">
                <div className="bg-green-500 text-white font-bold rounded-t px-4 py-2">
                  نجاح
                </div>
                <div className="border border-t-0 border-green-400 rounded-b bg-green-100 px-4 py-3 text-green-700">
                  <p>تم الاشتراك بنجاح</p>
                </div>
              </div>
            </div>)}
            {isNotAdded && (<div>
              <div className="w-50 mx-auto mt-5" role="alert">
                <div className="bg-red-500 text-white font-bold rounded-t px-4 py-2">
                  فشل
                </div>
                <div className="border border-t-0 border-red-400 rounded-b bg-red-100 px-4 py-3 text-red-700">
                  <p>فشل بعملية الاضافة برجاء الفحص واعادة المحاولة</p>
                </div>
              </div>
            </div>)}
          </Col>
        </Row>
      </Container>
      <Formik
        initialValues={memberships}
        onSubmit={(formMembership, { resetForm }) => {
          if (!decoded?.id) {
            Swal.fire("فشل بعملية الاضافة", "برجاء تسجيل الدخول مرة أخرى", "error");
            return;
          }

          const valueAddedTax = Number(formMembership.value_added_tax || 0);
          const swimming = Number(formMembership.swimming || 0);
          dispatch(addMembership({
            ...formMembership,
            total_amount: valueAddedTax + swimming,
            userId: decoded.id,
            value_added_tax: valueAddedTax,
            swimming,
          }))
          resetForm({
            values: {
              ...memberships,
              member_code: 0,
              member_order_date: '',
              start_date: '',
              end_date: '',
              serial_no: 0,
              form_no: 0,
              swimming: '',
              value_added_tax: 0,
              total_amount: 0,
              remark: '',
              status: '',
            },
          })
        }}
      >
        {({ errors, touched, values }) => (
          <Form className="d-flex flex-column justify-content-center align-items-center mt-5 rounded py-2 w-50 border mx-auto">
            <div className="grid gap-2 mb-6 md:grid-cols-1 w-75">

              <label htmlFor="member_code" className="block mt-2 text-xl font-bold text-gray-500 dark:text-black">رقم العضوية
                <span className="text-danger"> * </span>
              </label>
              <Field
                type="text" name="member_code" id="member_code"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="رقم العضوية"
                validate={validMemberCode}
                validateOnChange={true}
                value={values.member_code ||0} />
              {errors.member_code && touched.member_code && (
                <div className={`warning mb-2 text-danger fw-semibold w-100 `}>
                  {errors.member_code}
                </div>
              )}

              <label htmlFor="member_order_date" className="block mt-2 text-xl font-bold text-gray-500 dark:text-black">تاريخ الاشتراك
                <span className="text-danger"> * </span>
              </label>
              <Field
                type="date" name="member_order_date" id="member_order_date"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="تاريخ الاشتراك"
                validate={validateMemberOrderDate}
                validateOnChange={true}
                value={values.member_order_date} />
              {errors.member_order_date && touched.member_order_date && (
                <div className={`warning mb-2 text-danger fw-semibold w-100 `}>
                  {errors.member_order_date}
                </div>
              )}

              <label htmlFor="start_date" className="block mt-2 text-xl font-bold text-gray-500 dark:text-black">تاريخ البدء
                <span className="text-danger"> * </span>
              </label>
              <Field
                type="date" name="start_date" id="start_date"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="تاريخ البدء"
                validate={validateStartDate}
                validateOnChange={true}
                value={values.start_date} />
              {errors.start_date && touched.start_date && (
                <div className={`warning mb-2 text-danger fw-semibold w-100 `}>
                  {errors.start_date}
                </div>
              )}

              <label htmlFor="end_date" className="block mt-2 text-xl font-bold text-gray-500 dark:text-black">تاريخ الانتهاء
                <span className="text-danger"> * </span>
              </label>
              <Field
                type="date" name="end_date" id="end_date"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="تاريخ الانتهاء"
                validate={validateEndDate}
                validateOnChange={true}
                value={values.end_date} />
              {errors.end_date && touched.end_date && (
                <div className={`warning mb-2 text-danger fw-semibold w-100 `}>
                  {errors.end_date}
                </div>
              )}

              <label htmlFor="form_no" className="block mt-2 text-xl font-bold text-gray-500 dark:text-black">رقم الاستمارة
                <span className="text-danger"> * </span>
              </label>
              <Field
                type="text" name="form_no" id="form_no"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="رقم الاستمارة"
                validate={validateFormNo}
                validateOnChange={true}
                value={values.form_no || 0} />
              {errors.form_no && touched.form_no && (
                <div className={`warning mb-2 text-danger fw-semibold w-100 `}>
                  {errors.form_no}
                </div>
              )}
              <label htmlFor="serial_no" className="block mt-2 text-xl font-bold text-gray-500 dark:text-black">رقم الايصال
                <span className="text-danger"> * </span>
              </label>
              <Field
                type="text" name="serial_no" id="serial_no"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="رقم الايصال"
                validate={validateSerialNo}
                validateOnChange={true}
                value={values.serial_no ||0} />
              {errors.serial_no && touched.serial_no && (
                <div className={`warning mb-2 text-danger fw-semibold w-100 `}>
                  {errors.serial_no}
                </div>
              )}

              <label htmlFor="swimming" className="block mt-2 text-xl font-bold text-gray-500 dark:text-black">رسم اشتراك السباحة
                <span className="text-danger"> * </span>
              </label>
              <Field
                type="text" name="swimming" id="swimming"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="رسم اشتراك السباحة"
                validate={validateSwimming}
                validateOnChange={true}
                value={(values.swimming) || 0} />
              {errors.swimming && touched.swimming && (
                <div className={`warning mb-2 text-danger fw-semibold w-100 `}>
                  {errors.swimming}
                </div>
              )}

              <label htmlFor="value_added_tax" className="block mt-2 text-xl font-bold text-gray-500 dark:text-black">ضريبة القيمة المضافة
                <span className="text-danger"> * </span>
              </label>
              <Field
                type="text" name="value_added_tax" id="value_added_tax"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="ضريبة القيمة المضافة"
                validate={validateVAT}
                validateOnChange={true}
                value={(values.value_added_tax) || 0} />
              {errors.value_added_tax && touched.value_added_tax && (
                <div className={`warning mb-2 text-danger fw-semibold w-100 `}>
                  {errors.value_added_tax}
                </div>
              )}

              <label htmlFor="total_amount" className="block mt-2 text-xl font-bold text-gray-500 dark:text-black">الاجمالي العام
                <span className="text-danger"> * </span>
              </label>
              <input
               required
               disabled
                ref={totalRef}
                type="text" name="total_amount" id="total_amount"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="الاجمالي العام"
                // validate={validateTotalAmount || 0}
                // validateOnChange={true}
                value={Number(values.value_added_tax) + Number(values.swimming) || 0} />
              {/* {errors.total_amount && touched.total_amount && (
                <div className={`warning mb-2 text-danger fw-semibold w-100 `}>
                  {errors.total_amount}
                </div>
              )} */}

              <label htmlFor="remark" className="block mt-2 text-xl font-bold text-gray-500 dark:text-black">ملاحظات</label>
              <Field
                type="text" name="remark" id="remark"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="ملاحظات"
                validateOnChange={true}
                value={values.remark} />
              {errors.remark && touched.remark && (
                <div className={`warning mb-2 text-danger fw-semibold w-100 `}>
                  {errors.remark}
                </div>
              )}

              <Field
                as="select"
                id="status"
                name="status"
                style={dropdownStyle} // Apply styles here
                required
              >
                <option value="" label="الحالة" />
                {dropdownOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Field>


            </div>
            <button type="submit" className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded-full w-50">
              تجديد اشتراك السباحة
            </button>
          </Form>
        )}
      </Formik>
    </div>
  </>
}
