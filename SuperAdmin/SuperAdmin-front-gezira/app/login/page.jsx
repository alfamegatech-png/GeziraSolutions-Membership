import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import style from './page.module.css';
import LoginForm from '../components/login-form/LoginForm';


export default function Login() {
    return <>
        <Container>
            <Row>
                <Col>
                    <Container fluid className={`${style.formBg} d-flex justify-content-center align-items-center`}>
                        <div className={`${style.formCrd} bg-green-100 d-flex flex-column justify-content-start`}>
                            <div className={`${style.crdHead} text-center py-4`}>
                                <h3 className="m-0 fw-semibold">تسجيل الدخول</h3>
                            </div>
                            <LoginForm />
                        </div>
                    </Container>
                </Col>
            </Row>
        </Container>
    </>
}
