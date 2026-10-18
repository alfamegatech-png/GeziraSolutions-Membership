"use client";
import axios from "axios";
import React, { useEffect, useState } from "react";
import "./fontawesome";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";

export default function Prices() {
  //States
  const [openCreate, setOpenCreate] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [getData, setGetData] = useState([]);
  const [trigger, setTrigger] = useState(0);
  const [idForEdit, setIdForEdit] = useState(null);
  const [createData, setCreateData] = useState({
    name: "",
    minAge: null,
    maxAge: null,
    price: "",
  });
  const [updateData, setUpdateData] = useState({
    name: "",
    minAge: null,
    maxAge: null,
    price: "",
  });

  //Effects
  useEffect(() => {
    async function getAllData() {
      try {
        const res = await axios.get("http://10.1.1.115:5000/api/GetPricingRule");
        setGetData(res.data.pricingRules);
        console.log(res.data.pricingRules);
      } catch (error) {
        console.log(error);
        if (error.response.data.error === "Not Found Any PricingRules") {
          setGetData([]);
        }
      }
    }
    getAllData();
  }, [trigger]);

  //Functions
  async function CreateAPI() {
    if (openCreate) {
      try {
        const response = await axios.post(
          "http://10.1.1.115:5000/api/AddPricingRule",
          createData
        );
        if (response.status === 201) {
          setCreateData({
            name: "",
            minAge: null,
            maxAge: null,
            price: "",
          });

          Swal.fire({
            icon: "success",
            title: "تمت الإضافة",
            showConfirmButton: false,
            timer: 1500,
          });
          setTrigger((old) => old + 1);
        }
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: error.response.data.error,
          showConfirmButton: false,
          timer: 1500,
        });
      }
    }
  }
  async function handleDelete(id) {
    try {
      const confirmed = await Swal.fire({
        title: "هل تريد الحذف",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: " نعم",
        cancelButtonText: "لا",
      });

      if (confirmed.isConfirmed) {
        const response = await axios.delete(
          `http://10.1.1.115:5000/api/DeletePricingRule/${id}`
        );
        if (response.status === 200) {
          Swal.fire({
            title: "تم الحذف!",
            text: "تم الحذف بنجاح",
            icon: "success",
            confirmButtonColor: "#28a745",
            confirmButtonText: "حسنًا",
          });
          setTrigger((old) => old + 1);
        }
      }
    } catch (error) {
      console.error(error);
      Swal.fire("خطأ!", "هناك خطأ ما اثناء الحذف.", "error");
    }
  }
  function handleUpdate(el) {
    setOpenUpdate(true);
    setIdForEdit(el.id);
    setUpdateData({
      name: el.name,
      minAge: el.minAge,
      maxAge: el.maxAge,
      price: el.price,
    });
  }
  async function callUpdateApi() {
    try {
      const response = await axios.put(
        `http://10.1.1.115:5000/api/UpdatePricingRule/${idForEdit}`,
        updateData
      );
      console.log(createData);
      console.log(updateData);

      if (response.status === 200) {
        console.log(createData);

        setOpenUpdate(false);
        Swal.fire({
          icon: "success",
          title: "تم التعديل",
          showConfirmButton: false,
          timer: 1500,
        });
        setTrigger((old) => old + 1);
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: error,
        showConfirmButton: false,
        timer: 1500,
      });
    }
  }

  return (
    <div className="min-h-[calc(100vh-84px)]  ">
      <div className="w-[80%] mx-auto flex flex-col ">
        <CreatePanal
          CreateAPI={CreateAPI}
          createData={createData}
          setCreateData={setCreateData}
          openCreate={openCreate}
          setOpenCreate={setOpenCreate}
        />
        <TableForData
          handleUpdate={handleUpdate}
          setIdForEdit={setIdForEdit}
          handleDelete={handleDelete}
          getData={getData}
        />
        {openUpdate ? (
          <EditDiv
            callUpdateApi={callUpdateApi}
            setUpdateData={setUpdateData}
            updateData={updateData}
            idForEdit={idForEdit}
          />
        ) : (
          ""
        )}
      </div>
    </div>
  );
}

function CreatePanal({
  openCreate,
  setOpenCreate,
  setCreateData,
  createData,
  CreateAPI,
}) {
  return (
    <div className="flex items-center justify-between text-lg mt-16">
      <button
        onClick={() => {
          setOpenCreate(true);
          CreateAPI();
        }}
        className="bg-green-500 border-1 border-transparent text-black px-4 rounded-md tracking-wide py-2"
      >
        {openCreate ? "تم" : "إضافة"}
      </button>
      <div
        style={
          openCreate
            ? { maxWidth: "100%", opacity: 1 }
            : { maxWidth: "0%", opacity: 0 }
        }
        className={`flex flex-row-reverse items-center overflow-hidden duration-300 gap-5 transition-all ease-in-out`}
      >
        <FontAwesomeIcon
          onClick={() => setOpenCreate(false)}
          className="text-red-500 cursor-pointer w-6 h-6 border-red-200 p-1"
          icon={"xmark"}
        />
        <div className="flex gap-2 overflow-hidden items-center">
          <label className="max-h-[46px]" htmlFor="price">
            النسبة المئوية
          </label>
          <input
            onChange={(e) =>
              setCreateData((old) => ({ ...old, price: e.target.value }))
            }
            value={createData.price}
            className="focus:outline-none border-1 p-2 rounded-md bg-green-300 text-black border-transparent focus:border-black"
            type="number"
            name="price"
            id="price"
          />
        </div>
        <div className="flex gap-2 overflow-hidden items-center">
          <label className="max-h-[46px]" htmlFor="maxAge">
            أقصي عمر
          </label>
          <input
            onChange={(e) =>
              setCreateData((old) => ({ ...old, maxAge: e.target.value }))
            }
            value={createData.maxAge}
            className="focus:outline-none border-1 p-2 rounded-md bg-green-300 text-black border-transparent focus:border-black"
            type="number"
            name="maxAge"
            id="maxAge"
          />
        </div>
        <div className="flex gap-2 overflow-hidden items-center">
          <label className="max-h-[46px]" htmlFor="minAge">
            أقل عمر
          </label>
          <input
            onChange={(e) =>
              setCreateData((old) => ({ ...old, minAge: e.target.value }))
            }
            value={createData.minAge}
            className="focus:outline-none border-1 p-2 rounded-md bg-green-300 text-black border-transparent focus:border-black"
            type="number"
            name="minAge"
            id="minAge"
          />
        </div>
        <div className="flex gap-2 overflow-hidden items-center">
          <label className="max-h-[46px]" htmlFor="relation">
            نوع العلاقة
          </label>
          <input
            onChange={(e) =>
              setCreateData((old) => ({ ...old, name: e.target.value }))
            }
            value={createData.name}
            className="focus:outline-none border-1 p-2 rounded-md bg-green-300 text-black border-transparent focus:border-black"
            type="text"
            id="relation"
          />
        </div>
      </div>
    </div>
  );
}

function TableForData({ getData, handleDelete, handleUpdate }) {
  return (
    <table className="my-20 w-full mx-auto ">
      <thead>
        <tr className="text-green-600">
          <th className="border-black border p-2">ID</th>
          <th className="border-black border p-2">نوع العلاقة</th>
          <th className="border-black border p-2">أقل عمر</th>
          <th className="border-black border p-2">أقصي عمر</th>
          <th className="border-black border p-2">النسبة المئوية</th>
        </tr>
      </thead>
      <tbody>
        {getData.length
          ? getData.map(function (el, i) {
              return (
                <tr className="relative" key={i}>
                  <th className="border-black border p-2">{el.id}</th>
                  <th className="border-black border p-2">{el.name}</th>
                  <th className="border-black border p-2">{el.minAge}</th>
                  <th className="border-black border p-2">{el.maxAge}</th>
                  <th className="border-black border p-2">{el.price}</th>
                  <th className="flex absolute top-0 py-2 -right-16 items-center gap-3">
                    <FontAwesomeIcon
                      onClick={() => handleDelete(el.id)}
                      className="text-red-500 cursor-pointer text-xl "
                      icon={"trash"}
                    />
                    <FontAwesomeIcon
                      onClick={() => handleUpdate(el)}
                      className="text-blue-500 cursor-pointer text-lg "
                      icon={"pen"}
                    />
                  </th>
                </tr>
              );
            })
          : ""}
      </tbody>
    </table>
  );
}

function EditDiv({ idForEdit, updateData, setUpdateData, callUpdateApi }) {
  return (
    <table className="w-full mb-16">
      <thead>
        <tr className="text-green-600">
          <th className="border border-black p-2">ID</th>
          <th className="border border-black p-2">نوع العلاقة</th>
          <th className="border border-black p-2">أقل عمر</th>
          <th className="border border-black p-2">أقصي عمر</th>
          <th className="border border-black p-2">النسبة المئوية</th>
        </tr>
      </thead>
      <tbody>
        <tr className="text-black relative">
          <th className="border border-black p-2">{idForEdit}</th>
          <th className="border border-black">
            <input
              onChange={(e) =>
                setUpdateData((old) => ({ ...old, name: e.target.value }))
              }
              value={updateData.name}
              className="w-full bg-green-100 p-2"
              type="text"
            />
          </th>
          <th className="border border-black">
            <input
              onChange={(e) =>
                setUpdateData((old) => ({ ...old, minAge: e.target.value }))
              }
              value={updateData.minAge}
              className="w-full bg-green-100 p-2"
              type="number"
              name=""
              id=""
            />
          </th>
          <th className="border border-black">
            <input
              onChange={(e) =>
                setUpdateData((old) => ({ ...old, maxAge: e.target.value }))
              }
              value={updateData.maxAge}
              className="w-full bg-green-100 p-2"
              type="number"
              name=""
              id=""
            />
          </th>
          <th className="border border-black">
            <input
              onChange={(e) =>
                setUpdateData((old) => ({ ...old, price: e.target.value }))
              }
              value={updateData.price}
              className="w-full bg-green-100 p-2"
              type="number"
              name=""
              id=""
            />
          </th>
          <th className="flex absolute top-0 py-2 -right-10 items-center gap-3">
            <FontAwesomeIcon
              onClick={() => callUpdateApi()}
              className="text-green-500 cursor-pointer text-lg "
              icon={"check"}
            />
          </th>
        </tr>
      </tbody>
    </table>
  );
}
