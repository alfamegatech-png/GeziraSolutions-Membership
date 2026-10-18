"use client";

import Members from "../components/Members/Members";
import MemberDetails from "../components/MemberDetails/MemberDetails";
import { useState, useEffect } from "react";

export default function Home() {
  const [selectedMember, setSelectedMember] = useState();

  return (
    <div className="content">
      {selectedMember?.id ? (
        <MemberDetails
          setSelectedMember={setSelectedMember}
          selectedMember={selectedMember}
        />
      ) : (
        <Members setSelectedMember={setSelectedMember} />
      )}
    </div>
  );
}
