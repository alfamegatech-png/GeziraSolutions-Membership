"use client"
import { Formik, Form, Field } from 'formik';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addMem, addedUser, notAddedUser } from '@/app/state-management/slices/member';
import { Container, Row, Col } from 'react-bootstrap';

export default function AddMember() {
    const { member, isAdded, isNotAdded } = useSelector(state => state.member)
    const dispatch = useDispatch();

    const validMemberCode = (value) => {
        let error;
        if (!value) error = "هذا الحقل مطلوب"
        return error;
    }
    const validMemberName = (value) => {
        let error;
        if (!value) error = "هذا الحقل مطلوب"
        return error;
    }
    // const validNationalId =(value)=>{
    //     let error;
    //     if (!value) error = "هذا الحقل مطلوب"
    //     return error;
    // }
    // const validMaritalStatus =(value)=>{
    //     let error;
    //     if (!value) error = "هذا الحقل مطلوب"
    //     return error;
    // }

    useEffect(() => {
        setTimeout(() => {
            dispatch(addedUser())
            dispatch(notAddedUser())
        }, 3500)
    }, [isAdded, isNotAdded])

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
                                    <p>تم إضافة العضو بنجاح</p>
                                </div>
                            </div>
                        </div>)}
                        {isNotAdded && (<div>
                            <div className="w-50 mx-auto mt-5" role="alert">
                                <div className="bg-red-500 text-white font-bold rounded-t px-4 py-2">
                                    فشل
                                </div>
                                <div className="border border-t-0 border-red-400 rounded-b bg-red-100 px-4 py-3 text-red-700">
                                    <p>هذا العضو موجود بالفعل.</p>
                                </div>
                            </div>
                        </div>)}
                    </Col>
                </Row>
            </Container>
            <Formik
                initialValues={member}
                onSubmit={(member, { resetForm }) => {
                    dispatch(addMem(member))
                    resetForm({
                        values: {
                            member_code: '',
                            name: '',
                            member_type: 1,
                        },
                    })
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
                                value={values.member_code } />
                            {errors.member_code && touched.member_code && (
                                <div className={`warning mb-2 text-danger fw-semibold w-100 `}>
                                    {errors.member_code}
                                </div>
                            )}

                            <label htmlFor="name" className="block mt-2 text-xl font-bold text-gray-500 dark:text-white">الأسم
                                <span className="text-danger"> * </span>
                            </label>
                            <Field
                                type="text" name="name" id="name"
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="الاسم"
                                validate={validMemberName}
                                validateOnChange={true}
                                value={values.name} />
                            {errors.name && touched.name && (
                                <div className={`warning mb-2 text-danger fw-semibold w-100 `}>
                                    {errors.name}
                                </div>
                            )}

                            {/* <label htmlFor="national_id" className="block mt-2 text-xl font-bold text-gray-500 dark:text-white">الرقم القومي
                            <span className="text-danger"> * </span>
                        </label>
                        <Field 
                            type="text" name="national_id" id="national_id"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                            placeholder="الرقم القومي"
                            validate={validNationalId}
                            validateOnChange={true}
                            value={values.national_id}/>
                        {errors.national_id && touched.national_id && (
                            <div className={`warning mb-2 text-danger fw-semibold w-100 `}>
                                {errors.national_id}
                            </div>
                        )} */}

                            {/* <label htmlFor="marital_status" className="block mt-2 text-xl font-bold text-gray-500 dark:text-white">الحالة الاجتماعية
                            <span className="text-danger"> * </span>
                        </label>
                        <Field 
                            as="select" name="marital_status" id="marital_status" 
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                            validate={validMaritalStatus}
                            value={values.marital_status}>
                            <option value="0">---</option>
                            <option value="1">أعزب</option>
                            <option value="2">متزوج</option>
                            <option value="3">أرمل</option>
                            <option value="4">مطلق</option>
                        </Field>
                        {errors.marital_status && touched.marital_status && (
                            <div className={`warning mb-2 text-danger fw-semibold w-100 `}>
                                {errors.marital_status}
                            </div>
                        )} */}
                        </div>
                        <button type="submit" className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded-full w-50">اضافة العضو</button>
                    </Form>
                )}
            </Formik>
        </div>
    </>
}
