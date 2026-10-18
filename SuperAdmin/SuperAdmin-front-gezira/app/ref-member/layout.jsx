"use client"
import Link from "next/link"
import { Col, Container, Row } from "react-bootstrap"

export default function RefMemberLayout({ children }) {
    return <>
        <Container>
            <Row>
                <Col>
                    <div className="text-success text-center">
                        <h2 className="my-4">صفحة العضو التابع</h2>
                        <Row>
                            <Col className="d-flex justify-content-center align-items-center">
                                <Link href="/ref-member/searchRef" className="w-25 bg-green-700 hover:bg-green-800 text-white font-bold py-2 text-decoration-none px-4 rounded-full mx-2">بحث</Link>
                                <Link href="/ref-member/addRef" className="w-25 bg-green-700 hover:bg-green-800 text-white font-bold py-2 text-decoration-none px-4 rounded-full mx-2">أضافة</Link>
                                {/* <Link href="#" className="w-25 bg-green-700 hover:bg-green-800 text-white font-bold py-2 text-decoration-none px-4 rounded-full mx-2">مسح</Link> */}
                                {/* <Link href="#" className="w-25 bg-green-700 hover:bg-green-800 text-white font-bold py-2 text-decoration-none px-4 rounded-full mx-2">تعديل</Link> */}
                            </Col>
                        </Row>
                    </div>
                </Col>
            </Row>
        </Container>
        <div>{children}</div>
    </>
}