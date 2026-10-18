"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

//State Management
import store from './state-management/store';
import { Provider } from 'react-redux';

//Components
import Header from './components/navbar/Header'


export default function Main({ children }) {
    const { push } = useRouter();

    useEffect(() => {
        let verify = localStorage.getItem('token')
        if (!verify) {
            push('/login')
        }
    }, [])


    return <>
        <Provider store={store}>
            <Header />
            {children}
        </Provider>
    </>
}
