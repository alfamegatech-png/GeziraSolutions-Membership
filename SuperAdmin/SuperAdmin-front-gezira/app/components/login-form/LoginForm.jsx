"use client"
import { loginUser, userValidation } from '@/app/state-management/slices/login';
import { Formik, Form, Field } from 'formik';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export default function LoginForm() {
    const { user, notValidUser, isLogged ,isHotelLogin} = useSelector(state => state.login)
    const dispatch = useDispatch();
    const router = useRouter();

    useEffect(() => {
        let verify = localStorage.getItem('token')
        if (verify) {
            router.push('/')
        }
      
    }, [])

    useEffect(() => {
        if (isLogged) router.push('/')
    }, [isLogged])
    useEffect(() => {
        if (isHotelLogin) router.push('/accounts')
    }, [isHotelLogin])

    useEffect(() => {
        setTimeout(() => {
            dispatch(userValidation())
        }, 3500)
    }, [notValidUser])

    return <>
        <div className="d-flex flex-column align-items-center text-center">
            {notValidUser && <div className="alert alert-danger mt-4 w-80" role="alert">
                Invalid Email or Password
            </div>}
            <Formik
                initialValues={user}
                onSubmit={(values) => {
                    dispatch(loginUser(values))
                }}
            >
                {(errors, touched) => (
                    <Form>
                        <Field
                            type="text"
                            id="uEmail"
                            name="email"
                            placeholder="الايميل"
                            validate={() => { console.log('validate email') }}
                            className="my-3 py-2 ps-3 w-80 fs-4 rounded-1 bg-green-200"
                            autoComplete="username"
                        />
                        <Field
                            type="password"
                            id="uPassword"
                            name="password"
                            placeholder="الرقم السري"
                            validate={() => { console.log('validate password') }}
                            className="my-3 py-2 ps-3 w-80 fs-4 rounded-1 bg-green-200"
                            autoComplete="current-password"
                        />
                        <button type="submit" 
                        // style={{ backgroundColor: "#365D3E" }}
                        className='btn btn-success bg-[#15803D] hover:bg-[#166534] w-80 fs-4 my-4'>تسجيل الدخول</button>
                    </Form>
                )}
            </Formik>
        </div>
    </>
}
