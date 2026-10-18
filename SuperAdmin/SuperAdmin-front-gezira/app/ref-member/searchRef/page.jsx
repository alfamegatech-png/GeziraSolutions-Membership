"use client"
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field } from 'formik';
import { Container, Row, Col } from 'react-bootstrap';
import Table from 'react-bootstrap/Table';
import { searchRef } from '@/app/state-management/slices/ref-member';

export default function SreactRef() {
  const { refMembers, searchValue, isRef, isNotRef } = useSelector(state => state.refMember)
  const dispatch = useDispatch()

  const validMemberCode = (value) => {
    let error;
    if (!value) error = "هذا الحقل مطلوب"
    return error;
  }

  return <>
    <div>
      <Container>
        <Row>
          <Col>
            {isNotRef && (<div>
              <div className="w-50 mx-auto mt-5" role="alert">
                <div className="bg-red-500 text-white text-xl font-bold rounded-t px-4 py-2">
                  انتبه!
                </div>
                <div className="border border-t-0 border-red-400 rounded-b bg-red-100 px-4 py-3 text-red-700">
                  <p className="text-xl">لا يوجد اعضاء تابعين لرقم العضوية</p>
                </div>
              </div>
            </div>)}
          </Col>
        </Row>
      </Container>
      <Container>
        <Row>
          <Col>
            <Formik
              initialValues={searchValue}
              onSubmit={(values, {resetForm}) => {
              dispatch(searchRef(values.member_code))
              resetForm({ member_code: 0 })
              }}
            >
              {({ errors, touched, values }) => (
                <Form className="d-flex flex-column justify-content-center align-items-center mt-5 rounded py-2 w-50 border mx-auto">
                  <div className="grid gap-2 mb-6 md:grid-cols-1 w-75">
                    <label htmlFor="member_code" className="block mt-2 text-xl font-bold text-gray-500 dark:text-white">رقم العضوية
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
                  </div>
                  <button type="submit" className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded-full w-50">بحث</button>
                </Form>
              )}
            </Formik>
          </Col>
        </Row>
        {isRef && (
          <Table className="mt-5" striped bordered hover>
            <thead>
              <tr>
                <th>#</th>
                <th>رقم العضوية</th>
                <th>الاسم</th>
                <th>النوع</th>
              </tr>
            </thead>
            <tbody>
              {refMembers.map((ref, idx) => {
                return (
                  <tr key={idx}>
                    <td className='text-xl'>{ref.serial_no}</td>
                    <td className='text-xl'>{ref.member_code}</td>
                    <td className='text-xl'>{ref.name}</td>
                    {ref.ref === 1 && <td className='text-xl'>والد</td>}
                    {ref.ref === 2 && <td className='text-xl'>والدة</td>}
                    {ref.ref === 3 && <td className='text-xl'>زوجة</td>}
                    {ref.ref === 4 && <td className='text-xl'>زوج</td>}
                    {ref.ref === 5 && <td className='text-xl'>ابن</td>}
                    {ref.ref === 7 && <td className='text-xl'>ابنة</td>}
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Container>
    </div>
  </>
}
