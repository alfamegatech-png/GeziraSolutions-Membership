"use client"
import React, { useState, useEffect } from "react";
// import {api}  from "@/api_url/apiFunctions";
import { Col, Container, Row } from "react-bootstrap"
import axios from 'axios';
import { API_URL, authenticateUser, postAllData } from '@/api_url/apiFunctions'
function Accounts() {
  let [Data, setData] = useState([]);
  let [loading, setLoading] = useState(false);
  let [postData, setPostData] = useState([]);
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  let [date, setDate] = useState('')
  let [time, setTime] = useState('')
  // get data
  const fetchData = async () => {
    await axios.get('http://localhost:5149/api/OrderPaymentDetail/GetLastData')
      .then(function (response) {
        setData(response.data.data);
        setLoading(true);
        setIsButtonVisible(true)
        response.data.data.forEach((item) => {
          const newPostDataItem = {
            ref: " Hotel " + item.idOrderPaymentDetail,
            note: "post hotel data  ",
            account_items: [
              {
                account_id:3886,
                debit: item.amount,
              },
              {
                account_id:3902,
                credit: item.amount,
              }
            ],
            currency: "1",
            created_date: item.dateAdd,
          };

          setPostData((prevData) => [...prevData, newPostDataItem]);
        });
      

      }
      )
      .catch(function (error) {
        console.log('Error fetching data:', error.message);

      });

  };

  // get last date
  const fetchDate = async () => {
    try {
      const response = await axios.get('http://localhost:5149/api/LastRetrivalTime/Get/2');
      const retriveTime = response.data.data.retriveTime;
      const formattedDate = retriveTime.slice(0, 10);
      const formattedTime = retriveTime.slice(11, 16);
      setDate(formattedDate);
      setTime(formattedTime);
      setLoading(false);
      setIsButtonVisible(false)
      console.log(response)
    } catch (error) {
      console.log('Error fetching data:', error);

    }
  };
  //handelClick
  const handelClick = () => {
    postAllData(postData)
    setIsButtonVisible(false)
  }
  const onload=async ()=>{
    await  authenticateUser()
    await fetchDate()
    await fetchData()
  }
  useEffect(() => {
onload()
  }, [])

  return (

    <Container>
      <Row>
        <Col>
          <div className="text-success text-center">
            <h2 className="my-4"> تم اخر تحقق من البيانات في تاريخ : {date} <p> الساعه :{time}</p> </h2>
            <Row>
              <Col className="d-flex justify-content-center align-items-center">
           {  (loading && isButtonVisible) ? (<button className="w-25 bg-green-700 hover:bg-green-800 text-white font-bold py-2 text-decoration-none px-4 rounded-full mx-2" onClick={() => { handelClick() }}> ارسال البيانات</button>):''}

              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    </Container>

  )
}

export default Accounts
