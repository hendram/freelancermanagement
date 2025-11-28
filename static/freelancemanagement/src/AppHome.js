import React, { useRef, useReducer } from "react";
import AddResume from "./AddResume";
import UpdateResume from "./UpdateResume";
import UpdateAction from "./UpdateAction";
import ReputationCatalog from "./ReputationCatalog";
import AssignReputation from "./AssignReputation";
import AddReferrer from "./AddReferrer";
import UpdateReferrer from "./UpdateReferrer";
import "./AppHome.css";

// forceUpdate helper
function useForceUpdate() {
  return useReducer(() => ({}), {})[1];
}

export default function AppHome() {
  const forceUpdate = useForceUpdate();

  // ---------------------------
  // PAGE STATE USING ONLY useRef
  // ---------------------------
  const pages = useRef({
    main: true,
    addResume: false,
    updateResume: false,
    updateAction: false, // added
    reputationCatalog: false,
    assignReputation: false,
    addReferrer: false,
    updateReferrer: false,
  });

  const switchPage = (page) => {
    Object.keys(pages.current).forEach((k) => {
      pages.current[k] = false;
    });
    pages.current[page] = true;
    forceUpdate();
  };

  // ---------------------------
  // SELECTED RESUME FOR UPDATE
  // ---------------------------
  const selectedResumeRef = useRef(null);

  const updateResume = (resumeData) => {
    selectedResumeRef.current = resumeData; // store selected resume
    switchPage("updateResume");
  };

  // ---------------------------
  // SAMPLE DATA
  // ---------------------------
  const freelancers = [
    { id: 1, name: "John Smith", photo: "./photos/johnsmith.png", skills: "React, Node.js", reputation: 4.8, referrer: "Alice" },
    { id: 2, name: "Maria Tan", photo: "./photos/mariatan.png", skills: "Python, FastAPI", reputation: 4.6, referrer: "Kevin" },
    { id: 3, name: "Ahmed Noor", photo: "./photos/ahmednoor.png", skills: "Golang, DevOps", reputation: 4.9, referrer: "Sarah" },
  ];

  // ---------------------------
  // MAIN PAGE UI (HIDDEN when another page shows)
  // ---------------------------
  const MainPage = () => (
    <div className="container">
      <h1 className="title">Freelancer Candidates</h1>

      {/* ----------------- TOP MENU ----------------- */}
      <div className="top-menu">
        <div className="menu-row">

          {/* RESUME */}
          <div className="menu-btn-wrapper">
            <button className="resume-btn">Resume ▼</button>
            <div className="submenu">
              <button onClick={() => switchPage("addResume")}>Add Resume</button>
              <button onClick={() => switchPage("updateResume")}>Update Resume</button>
            </div>
          </div>

          {/* REPUTATION */}
          <div className="menu-btn-wrapper">
            <button className="menu-btn">Reputation ▼</button>
            <div className="submenu">
              <button onClick={() => switchPage("reputationcatalog")}> Reputation Catalog</button>
              <button onClick={() => switchPage("assignreputation")}>Assign Reputation</button>
            </div>
          </div>

          {/* REFERRER */}
          <div className="menu-btn-wrapper">
            <button className="menu-btn">Referrer ▼</button>
            <div className="submenu">
              <button onClick={() => switchPage("addReferrer")}>Add Referrer</button>
              <button onClick={() => switchPage("updateReferrer")}>Update Referrer</button>
            </div>
          </div>

        </div>
      </div>

      {/* FREELANCER CARDS */}
      <div className="list">
        {freelancers.map((item) => (
          <div key={item.id} className="card">
            <img src={item.photo} className="photo" alt="avatar" />
            <div className="info">
              <h2>{item.name}</h2>
              <p>{item.skills}</p>
            </div>
            <div className="actions">
              <button
                className="btn_resume"
                onClick={() => updateResume(item)}
              >
                Resume
              </button>

              <button className="btn_rep" onClick={() => switchPage("assignReputation")}>
                Reputation ({item.reputation})
              </button>

              <button className="btn_ref" onClick={() => switchPage("updateReferrer")}>
                Referrer: {item.referrer}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ---------------------------
  // PAGE RENDER LOGIC
  // ---------------------------
  return (
    <>
      {pages.current.main && <MainPage />}

      {pages.current.addResume && (
        <AddResume goBack={() => switchPage("main")} />
      )}

      {pages.current.updateResume && (
        <UpdateResume
          goBackU={() => switchPage("main")}
          onSelectResumeForUpdate={(resume) => {
            selectedResumeRef.current = resume; // store the resume to update
            switchPage("updateAction");         // switch to UpdateAction page
          }}
        />
      )}

      {pages.current.updateAction && (
        <UpdateAction
          goBackUA={() => switchPage("updateResume")}
          resumeData={selectedResumeRef.current}
        />
      )}

      {pages.current.reputationCatalog && (
        <ReputationCatalog goBackRC={() => switchPage("main")} />
      )}

      {pages.current.assignReputation && (
        <AssignReputation goBackAR={() => switchPage("main")} />
      )}

      {pages.current.addReferrer && (
        <AddReferrer goBack={() => switchPage("main")} />
      )}

      {pages.current.updateReferrer && (
        <UpdateReferrer goBack={() => switchPage("main")} />
      )}
    </>
  );
}
