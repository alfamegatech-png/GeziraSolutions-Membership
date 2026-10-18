import Link from "next/link"
import { Col, Container, Row } from "react-bootstrap"

export default function MembershipsLayout({children}) {
    return <>
            <div>
                <Container>
                    <Row>
                        <Col>
                            <div className="text-success text-center">
                                <h2 className="my-4">صفحة الاشتراكات</h2>
                                <Row>
                                    <Col className="d-flex justify-content-center align-items-center">
                                        <Link href="/memberships/new-memberships" className="w-25 bg-green-700 hover:bg-green-800 text-white font-bold py-2 text-decoration-none px-4 rounded-full mx-2">اشتراك عضوية</Link>
                                        <Link href="/memberships/renew-memberships" className="w-25 bg-green-700 hover:bg-green-800 text-white font-bold py-2 text-decoration-none px-4 rounded-full mx-2">تجديد عضوية</Link>
                                        <Link href="/memberships/swimming-memberships" className="w-25 bg-green-700 hover:bg-green-800 text-white font-bold py-2 text-decoration-none px-4 rounded-full mx-2">اشتراك السباحة</Link>
                                        {/* <Link href="#" className="w-25 bg-green-700 hover:bg-green-800 text-white font-bold py-2 text-decoration-none px-4 rounded-full mx-2">بحث</Link> */}
                                    </Col>
                                </Row>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
            {children}
        </>
    }
