"use client"
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderOpen, faUser, faUsers } from '@fortawesome/free-solid-svg-icons';


export default function Home() {

  const { push } = useRouter();

  useEffect(() => {
      let verify = localStorage.getItem('token')
      if (!verify) {
          push('/login')
      }
  }, [])

  return <>
    <Container>
      {/* <Row className="homePage h-100 d-felx justify-content-center align-items-center">
        <Col className="text-center">
          <div className="max-w-sm my-4 p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
            <Link href="/member" style={{ textDecoration: 'none' }}>
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">العضو العامل</h5>
            </Link>
            <p className="mt-2 mb-4 font-normal text-gray-700 dark:text-gray-400">
              <FontAwesomeIcon className="text-3xl text-gray-600" icon={faUser} />
            </p>
            <Link href="/member" className="inline-flex items-center px-3 py-2 text-xl text-decoration-none font-medium text-center text-white bg-green-700 rounded-lg hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
              ذهاب الي 
              <svg className="w-4 h-4 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10" style={{ transform: 'rotate(180deg)' }} >
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
              </svg>
            </Link>
          </div>
        </Col>
        <Col className="text-center">
          <div className="max-w-sm my-4 p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
            <Link href="/ref-member" style={{ textDecoration: 'none' }}>
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">العضو التابع</h5>
            </Link>
            <p className="mt-2 mb-4 font-normal text-gray-700 dark:text-gray-400">
              <FontAwesomeIcon className="text-3xl text-gray-600" icon={faUsers} />
            </p>
            <Link href="/ref-member" className="inline-flex items-center px-3 py-2 text-xl text-decoration-none font-medium text-center text-white bg-green-700 rounded-lg hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
              ذهاب الي 
              <svg className="w-4 h-4 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10" style={{ transform: 'rotate(180deg)' }} >
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
              </svg>
            </Link>
          </div>
        </Col>
        <Col className="text-center">
          <div className="max-w-sm my-4 p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
            <Link href="/memberships" style={{ textDecoration: 'none' }}>
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">التسجيلات</h5>
            </Link>
            <p className="mt-2 mb-4 font-normal text-gray-700 dark:text-gray-400">
              <FontAwesomeIcon className="text-3xl text-gray-600" icon={faFolderOpen} />
            </p>
            <Link href="/memberships" className="inline-flex items-center px-3 py-2 text-xl text-decoration-none font-medium text-center text-white bg-green-700 rounded-lg hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
              ذهاب الي 
              <svg className="w-4 h-4 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10" style={{ transform: 'rotate(180deg)' }} >
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
              </svg>
            </Link>
          </div>
        </Col>
      </Row> */}
    </Container>
  </>
}
