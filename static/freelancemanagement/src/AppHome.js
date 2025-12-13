import React, { useRef, useReducer, useEffect, useState } from "react";
import { invoke } from "@forge/bridge";
import AddResume from "./AddResume";
import UpdateResume from "./UpdateResume";
import UpdateAction from "./UpdateAction";
import ReputationCatalog from "./ReputationCatalog";
import AssignReputation from "./AssignReputation";
import AddReferrer from "./AddReferrer";
import MyInvitation from "./MyInvitation";
import "./AppHome.css";

function useForceUpdate() {
  return useReducer(() => ({}), {})[1];
}

export default function AppHome() {
  const forceUpdate = useForceUpdate();
  const userRole = useRef(null);

  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);

  const pages = useRef({
    main: true,
    addResume: false,
    updateResume: false,
    updateAction: false,
    reputationCatalog: false,
    assignReputation: false,
    addReferrer: false,
    myInvitation: false,
  });

  const switchPage = (page) => {
    const role = userRole.current;
    const adminOnly = [
      "addResume",
      "updateResume",
      "updateAction",
      "reputationCatalog",
      "assignReputation",
      "addReferrer",
    ];
    if (role === "user" && adminOnly.includes(page)) return;

    Object.keys(pages.current).forEach((k) => (pages.current[k] = false));
    pages.current[page] = true;
    forceUpdate();
  };

  const [selectedResume, setSelectedResume] = useState(null);

  const updateResume = (resumeData) => {
    setSelectedResume(resumeData);
    switchPage("updateResume");
  };

  // ----------------------------
  // Check user role
  // ----------------------------
  useEffect(() => {
    const check = async () => {
      try {
        const res = await invoke("checkuser");
        userRole.current = res?.role || "user";
      } catch (err) {
        userRole.current = "user";
        console.log("err", err);
      }
      forceUpdate();
    };
    check();
  }, []);

  // ----------------------------
  // Fetch freelancers
  // ----------------------------
useEffect(() => {
  const fetchFreelancers = async () => {
    setLoading(true);
    try {
      const resumes = await invoke("getalldatafrontend");

      const enrichedFreelancers = resumes.map((resume) => ({
        id: resume.resume_id,
        name: `${resume.first_name} ${resume.last_name}`,
        photo: resume.photo || "./photos/default.png",
        skills: resume.skills,
        reputation: resume.reputation || 0,
        referrer: resume.referrer || "",
        issues: resume.issues || [],
      }));

      setFreelancers(enrichedFreelancers);
    } catch (err) {
      console.error("Error fetching freelancers:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchFreelancers();
}, []);

  // ----------------------------
  // MainPage
  // ----------------------------
  const MainPage = () => {
    const role = userRole.current;

    if (loading) return <div className="homecontainer">Loading freelancers...</div>;

    return (
      <div className="homecontainer">
        <div className="hometop-menu">
          {(role === "admin" || role === "manager") && (
            <>
              <div className="homemenu-btn-wrapper">
                <button className="homemenu-btn">Resume ▼</button>
                <div className="homesubmenu">
                  <button className="addresume-btn" onClick={() => switchPage("addResume")}>Add Resume</button>
                  <button className="updateresume-btn" onClick={() => switchPage("updateResume")}>Update Resume</button>
                </div>
              </div>

              <div className="homemenu-btn-wrapper">
                <button className="homemenu-btn">Reputation ▼</button>
                <div className="homesubmenu">
                  <button className="reputationcatalog-btn" onClick={() => switchPage("reputationCatalog")}>
                    Reputation Catalog
                  </button>
                  <button className="assignreputation-btn" onClick={() => switchPage("assignReputation")}>
                    Assign Reputation
                  </button>
                </div>
              </div>

              <div className="homemenu-btn-wrapper">
                <button className="homemenu-btn">Referrer ▼</button>
                <div className="homesubmenu">
                  <button className="addreferrer-btn" onClick={() => switchPage("addReferrer")}>Add Referrer</button>
                </div>
              </div>
            </>
          )}

          <div className="homemenu-btn-wrapper">
            <button className="myinvitation-btn" onClick={() => switchPage("myInvitation")}>
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

                {item.issues.length > 0 && (
                  <div className="homeissues">
                    <strong>Deals:</strong>
                    <ul>
                      {item.issues.map((iss, idx) => (
                        <li key={idx}>
                          {iss.issue_key}: {iss.summary}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 🔴 INTENTIONALLY EMPTY — NO BUTTONS ON FREELANCER CARD */}
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
      {pages.current.updateResume && (
        <UpdateResume
          goBackU={() => switchPage("main")}
          onSelectResumeForUpdate={(resumeData) => {
            setSelectedResume(resumeData);
            switchPage("updateAction");
          }}
        />
      )}
      {pages.current.updateAction && (
        <UpdateAction goBackUA={() => switchPage("updateResume")} resumeData={selectedResume} />
      )}
      {pages.current.reputationCatalog && (
        <ReputationCatalog goBackRC={() => switchPage("main")} />
      )}
      {pages.current.assignReputation && (
        <AssignReputation goBackAR={() => switchPage("main")} />
      )}
      {pages.current.addReferrer && <AddReferrer goBackAR={() => switchPage("main")} />}
      {pages.current.myInvitation && <MyInvitation goBackMI={() => switchPage("main")} />}
    </>
  );
}
