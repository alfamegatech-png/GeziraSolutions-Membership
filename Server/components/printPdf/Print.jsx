import React, { useState, useRef, useEffect } from "react";

import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";

import "./Print.styles.css";

const Print = ({ newDialog, toggleNewDialog, url, }) => {
  const [loading, setLoading] = useState(true);
  return (
    <Dialog
      visible={newDialog}
      style={{ width: "64rem" }}
      breakpoints={{ "960px": "75vw", "641px": "90vw" }}
      header="كارنيه العضو"
      headerStyle={{ direction: "rtl" }}
      rtl={true}
      modal
      onHide={() => {
        toggleNewDialog();
        setLoading(true);
      }}
    >
      {loading && (
        <div className="card flex justify-content-center">
          <ProgressSpinner
            pt={{
              spinner: { style: { animationDuration: "1s" } },
              circle: {
                style: { stroke: "#4e261c", strokeWidth: 3, animation: "none" },
              },
            }}
          ></ProgressSpinner>
        </div>
      )}
      <iframe
        src={url}
        style={{ display: loading ? "none" : "block" }}
        onLoad={() => {
          setLoading(false);
        }}
        className="pdf"
      >
        <div>No online PDF viewer installed</div>
      </iframe>
    </Dialog>
  );
};

export default Print;
