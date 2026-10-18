import { useEffect, useState, forwardRef } from "react";
import { jwtDecode } from "jwt-decode";
import writtenNumber from "written-number";

const PaymentReciept = forwardRef(({ stored }, ref) => {
  

  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().split("T")[0]; // Format the date

  const [isPrinting, setIsPrinting] = useState(false);
  const [paymentdate, setPaymentDate] = useState("");
  const [startdate, setStartDate] = useState("");
  const [enddate, setEndDate] = useState("");

  //////////////////convert number to string words///////////////////////////////////////////////

  ////////////////////////////// JWT Decoding ////////////////////////////////

  ////////////////////////////// Fetch Booking Data ////////////////////////////////

  useEffect(() => {
    const getBookingByMember = async () => {
      try {
        const response = await fetch(
          `http://localhost:5156/api/BookingLocker/GetBookingLockersByMembercodeAndRole?memberCode=${storedValue[0]?.memberCode}`,
          {
            headers: {
              "Content-Type": "application/json; charset=UTF-8",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const result = await response.json();
        
        const lastBooking = result.data[result.data.length - 1];
        setPaymentDate(lastBooking.paymentDate);
        setEndDate(lastBooking.endDateOfBooking);
        setStartDate(lastBooking.startDateOfBooking);
      } catch (error) {
        // Handle network or other errors
        console.error("Error fetching data:", { code: typeof error?.code === "string" && /^[A-Z][A-Z0-9_]{1,24}$/.test(error.code) ? error.code : "UNAVAILABLE" });
      }
    };

    getBookingByMember();
  }, []);

  ////////////////////////////// Print Handling ////////////////////////////////

  ////////////////////////////// Number Extraction ////////////////////////////////
  function extractDecimalPart(number) {
    const numberString = number.toString();
    const decimalPosition = numberString.indexOf(".");
    if (decimalPosition !== -1) {
      const decimalPart = numberString.substring(decimalPosition);
      return parseFloat(decimalPart);
    } else {
      return 0;
    }
  }

  const originalFloatNumber = 123.456;
  const decimalPart = extractDecimalPart(originalFloatNumber);

  var str = String(decimalPart);
  var st = str.substring(2);
  const s = Number(st);

  function eArabic(x) {
    return x.toLocaleString("ar-EG");
  }

  var float = eArabic(s);

  ////////////////////////////// Number to Arabic Words ////////////////////////////////
  function decimalToArabicWords(decimal) {
    const fraction = decimal * 100;
    return writtenNumber(fraction, { lang: "ar" }) + " قرشا ";
  }

  function numberToArabicWords(number) {
    const wholePart = Math.floor(number);
    const decimalPart = number - wholePart;

    let arabicWords = writtenNumber(wholePart, { lang: "ar" }) + " جنيها ";
    if (decimalPart > 0) {
      arabicWords += " و" + decimalToArabicWords(decimalPart);
    }
    arabicWords += "فقط لا غير";
    return arabicWords;
  }

  ////////////////////////////// Local Storage Retrieval ////////////////////////////////
  const storedValue = stored;
  

  const val = storedValue?.price * (100 / 114);
  const total = storedValue?.price - val;
  const totalAll = storedValue?.price + total;

  var tafqet = numberToArabicWords(storedValue?.price?.toFixed(2));

  return (
    <div  ref={ref} className="bg-gray-100 p-8 rounded-lg shadow-lg">
      <div>
        <hr className="border-gray-300 mb-6" />
        <p className="text-left text-gray-600 mb-4">{formattedDate}</p>
        <h1 className="text-center text-2xl font-bold mb-6">
          <span className="border-b-4 border-black pb-2">إيصال سداد متنوع</span>
        </h1>

        <div className="flex flex-wrap justify-end gap-6">
          <h6 className="text-gray-800">
            رقم الإيصال
            <span className="ml-3 border border-gray-800 px-4 py-2 rounded-md bg-gray-50">
              {storedValue?.receiptNumber}
            </span>
          </h6>

          <h6 className="text-gray-800">
            تاريخ الايصال
            <span className="ml-3 border border-gray-800 px-4 py-2 rounded-md bg-gray-50">
              {storedValue?.startDateOfBooking}
            </span>
          </h6>

          <h6 className="text-gray-800">
            خزينة رقم
            <span className="ml-3 border border-gray-800 px-4 py-2 rounded-md bg-gray-50">
              {user.SafeNum}
            </span>
          </h6>
        </div>

        <div className="flex flex-wrap justify-end gap-6 mt-8">
          <h6 className="text-gray-800">
            الأسم
            <span className="ml-3 border border-gray-800 px-4 py-2 rounded-md bg-gray-50">
              {storedValue?.name}
            </span>
          </h6>

          <h6 className="text-gray-800">
            رقم العضوية
            <span className="ml-3 border border-gray-800 px-4 py-2 rounded-md bg-gray-50">
              {storedValue?.memberCode}
            </span>
          </h6>

          <h6 className="text-gray-800">
            نوع الايجار
            <span className="ml-3 border border-gray-800 px-4 py-2 rounded-md bg-gray-50">
              دولاب
            </span>
          </h6>
        </div>

        <div className="flex flex-wrap justify-end gap-6 mt-8">
          <h6 className="text-gray-800">
            من تاريخ
            <span className="ml-3 border border-gray-800 px-6 py-2 rounded-md bg-gray-50">
              {storedValue?.startDateOfBooking}
            </span>
          </h6>

          <h6 className="text-gray-800">
            الي تاريخ
            <span className="ml-3 border border-gray-800 px-6 py-2 rounded-md bg-gray-50">
              {storedValue?.endDateOfBooking}
            </span>
          </h6>

          <h6 className="text-gray-800">
            قيمة الايجار
            <span className="ml-3 border border-gray-800 px-4 py-2 rounded-md bg-gray-50">
              {val.toFixed(2)}
            </span>
          </h6>
        </div>

        <div className="flex flex-wrap justify-end gap-6 mt-8">
          <h6 className="text-gray-800">
            ضريبة
            <span className="ml-3 border border-gray-800 px-4 py-2 rounded-md bg-gray-50">
              {total.toFixed(2)}
            </span>
          </h6>

          <h6 className="text-gray-800">
            الإجمالي
            <span className="ml-3 border border-gray-800 px-4 py-2 rounded-md bg-gray-50">
              {storedValue?.price}
            </span>
          </h6>

          <h6 className="text-gray-800">
            نقدا /شيك
            <span className="ml-3 border border-gray-800 px-4 py-2 rounded-md bg-gray-50">
              نقدا
            </span>
          </h6>
        </div>

        <div className="flex flex-wrap justify-end gap-6 mt-8">
          <h6 className="text-gray-800">
            رقم الشيك
            <span className="ml-3 border border-gray-800 px-4 py-2 rounded-md bg-gray-50">
              {storedValue?.receiptNumber}
            </span>
          </h6>

          <h6 className="text-gray-800">
            فقط وقدره
            <span className="ml-3 border border-gray-800 px-4 py-2 rounded-md bg-gray-50">
              {tafqet}
            </span>
          </h6>
        </div>
      </div>

      <hr className="border-gray-300 my-6" />

      <div className="flex justify-end">
        <h6 className="text-gray-800 text-lg">
          أمين الخزينة
          <p className="mt-2 text-gray-600">{user.unique_name}</p>
        </h6>
      </div>
    </div>
  );
});

export default PaymentReciept;
