"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import style from "./page.module.css";
const FollowMemeber = () => {
  const [numberFollowers, setNumberFollower] = useState("");
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `http://10.1.1.115:5000/api/familiesMembersWithEndDate?includeMemberRef=true`
      );
      console.log(response.data);
      setNumberFollower(response.data);
      setError("");
    } catch (error) {
      setNumberFollower(null);
      setError("error choice");
      console.log(error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      {numberFollowers && (
        <table className={style.tableStyle}>
          <thead>
            <tr>
              <th>عدد العضويات العائلية</th>
              <th>عدد الأعضاء التابعين</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{numberFollowers.familiesMembers}</td>
              <td>{numberFollowers.familiesMembersRefCount}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
};
export default FollowMemeber;
