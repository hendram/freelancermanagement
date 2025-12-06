// Updated AppHome.js with role-based access control
import React, { useRef, useReducer, useEffect } from "react";
import { invoke } from "@forge/bridge";
import AddResume from "./AddResume";
import UpdateResume from "./UpdateResume";
import UpdateAction from "./UpdateAction";
import ReputationCatalog from "./ReputationCatalog";
import AssignReputation from "./AssignReputation";
import AddReferrer from "./AddReferrer";
import UpdateReferrer from "./UpdateReferrer";
import MyInvitation from "./MyInvitation";
import "./AppHome.css";

function useForceUpdate() {
  return useReducer(() => ({}), {})[1];
}

export default function AppHome() {
  const forceUpdate = useForceUpdate();

  const userRole = useRef(null); // "admin" | "manager" | "user"

  useEffect(() => {
    const check = async () => {
      try {
        const res = await invoke("checkuser");
        console.log("res", res);
        userRole.current = res?.role || "user";
      } catch (err) {
        userRole.current = "user";
        console.log("err", err);
      }
      forceUpdate();
    };
    check();
  }, []);

  const pages = useRef({
    main: true,
    addResume: false,
    updateResume: false,
    updateAction: false,
    reputationCatalog: false,
    assignReputation: false,
    addReferrer: false,
    updateReferrer: false,
    myInvitation: false,
  });

  const switchPage = (page) => {
    const role = userRole.current;

    const adminOnly = ["addResume", "updateResume", "updateAction", "reputationCatalog", "assignReputation", "addReferrer", "updateReferrer"];

    if (role === "user" && adminOnly.includes(page)) {
      return; // block access
    }

    Object.keys(pages.current).forEach((k) => (pages.current[k] = false));
    pages.current[page] = true;
    forceUpdate();
  };

  const selectedResumeRef = useRef(null);
  const updateResume = (resumeData) => {
    selectedResumeRef.current = resumeData;
    switchPage("updateResume");
  };

  const freelancers = [
    { id: 1, name: "John Smith", photo: "./photos/johnsmith.png", skills: "React, Node.js", reputation: 4.8, referrer: "Alice" },
    { id: 2, name: "Maria Tan", photo: "./photos/mariatan.png", skills: "Python, FastAPI", reputation: 4.6, referrer: "Kevin" },
    { id: 3, name: "Ahmed Noor", photo: "./photos/ahmednoor.png", skills: "Golang, DevOps", reputation: 4.9, referrer: "Sarah" },
  ];

  const MainPage = () => {
    const role = userRole.current;

    return (
      <div className="homecontainer">
        <h1 className="hometitle">Freelancer Candidates</h1>

        <div className="hometop-menu">
          {(role === "admin" || role === "manager") && (
            <>
              <div className="homemenu-btn-wrapper">
                <button className="homemenu-btn">Resume ▼</button>
                <div className="homesubmenu">
                  <button onClick={() => switchPage("addResume")}>Add Resume</button>
                  <button onClick={() => switchPage("updateResume")}>Update Resume</button>
                </div>
              </div>

              <div className="homemenu-btn-wrapper">
                <button className="homemenu-btn">Reputation ▼</button>
                <div className="homesubmenu">
                  <button onClick={() => switchPage("reputationCatalog")}>Reputation Catalog</button>
                  <button onClick={() => switchPage("assignReputation")}>Assign Reputation</button>
                </div>
              </div>

              <div className="homemenu-btn-wrapper">
                <button className="homemenu-btn">Referrer ▼</button>
                <div className="homesubmenu">
                  <button onClick={() => switchPage("addReferrer")}>Add Referrer</button>
                  <button onClick={() => switchPage("updateReferrer")}>Update Referrer</button>
                </div>
              </div>
            </>
          )}

          <div className="homemenu-btn-wrapper">
            <button className="homemenu-btn" onClick={() => switchPage("myInvitation")}>
              My Invitation
            </button>
          </div>
        </div>

        <div className="homelist">
          {freelancers.map((item) => (
            <div key={item.id} className="homecard">
              <img src={item.photo} className="homephoto" alt="avatar" />
              <div className="homeinfo">
                <h2>{item.name}</h2>
                <p>{item.skills}</p>
              </div>

              <div className="homeactions">
                {(role === "admin" || role === "manager") && (
                  <button className="homebtn_resume" onClick={() => updateResume(item)}>Resume</button>
                )}

                {(role === "admin" || role === "manager") && (
                  <button className="homebtn_rep" onClick={() => switchPage("assignReputation")}>
                    Reputation ({item.reputation})
                  </button>
                )}

                {(role === "admin" || role === "manager") && (
                  <button className="homebtn_ref" onClick={() => switchPage("updateReferrer")}>
                    Referrer: {item.referrer}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {pages.current.main && <MainPage />}
      {pages.current.addResume && <AddResume goBack={() => switchPage("main")} />}
      {pages.current.updateResume && <UpdateResume goBackU={() => switchPage("main")} />}
      {pages.current.updateAction && <UpdateAction goBackUA={() => switchPage("updateResume")} resumeData={selectedResumeRef.current} />}
      {pages.current.reputationCatalog && <ReputationCatalog goBackRC={() => switchPage("main")} />}
      {pages.current.assignReputation && <AssignReputation goBackAR={() => switchPage("main")} />}
      {pages.current.addReferrer && <AddReferrer goBackAR={() => switchPage("main")} />}
      {pages.current.updateReferrer && <UpdateReferrer goBackUR={() => switchPage("main")} />}
      {pages.current.myInvitation && <MyInvitation goBackMI={() => switchPage("main")} />}
    </>
  );
}
