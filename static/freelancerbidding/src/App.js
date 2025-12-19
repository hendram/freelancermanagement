import React, { useState } from "react";
import InnerApp from "./InnerApp";

export default function App() {
  const [issueKey, setIssueKey] = useState(null);

  return (
    <InnerApp
      key={issueKey || "no-issue"}
      setIssueKey={setIssueKey}
    />
  );
}
