"use client";

import { useEffect } from "react";
import { useRouter } from 'next/navigation';
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const currentURL = new URL(window.location.href);
    

    // const dataFromURL = path.query.data;
    const dataFromURL = currentURL.search;
    
    // Extract the data portion from the query string
const dataString = dataFromURL.split('=')[1];

// URL decode the data string and parse it into an object
const decodedData = JSON.parse(decodeURIComponent(dataString));


    if (decodedData) {
      
      const { id, fullname, safe_no } = decodedData;
      localStorage.setItem(
        "clubUser",
        JSON.stringify({ id, fullname, safe_no })
        
      );

    } else {
      toast.current.show({
        severity: "error",
        summary: "خطأ",
        detail: "خطأ في اسم المستخدم أو كلمة المرور",
        life: 3000,
      });
    }
  }, []); 

  return (
    <div className="h-96">
      <h1 className="mx-auto text-4xl">Loading... Please Wait</h1>
    </div>
  );
}

