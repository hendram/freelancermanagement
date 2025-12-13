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
  const userRole = useRef(null); // "admin" | "manager" | "user"

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

  // ----------------------------
  // Selected resume for update
  // ----------------------------
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
  // Fetch freelancers dynamically
  // ----------------------------
  useEffect(() => {
    const fetchFreelancers = async () => {
      setLoading(true);
      try {
        const resumes = await invoke("getalldatafrontend"); // returns array of resumes
        const enrichedFreelancers = [];

        for (let resume of resumes) {
          const { resume_id, first_name, last_name, skills, photo, reputation } = resume;

          // get invitations for this resume
          const invitations = await invoke("getinvitations", { resumeId: resume_id });
          const dealYesInvitations = (invitations?.data || []).filter((i) => i.deal_yes);

          // get issues for each deal_yes invitation
          const issuesData = [];
          for (let inv of dealYesInvitations) {
            const issue = await invoke("getissue", { issueId: inv.issue_id });
            if (issue) {
              issuesData.push({
                issue_key: issue.issue_key,
                summary: issue.summary,
              });
            }
          }

          enrichedFreelancers.push({
            id: resume_id,
            name: `${first_name} ${last_name}`,
            photo: photo || "./photos/default.png",
            skills,
            reputation: reputation || 0,
            referrer: resume.referrer || "",
            issues: issuesData,
          });
        }

        setFreelancers(enrichedFreelancers);
      } catch (err) {
        console.error("Error fetching freelancers:", err);
      }
      setLoading(false);
    };

    fetchFreelancers();
  }, []);

  // ----------------------------
  // MainPage component
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

              <div className="homeactions">
                {(role === "admin" || role === "manager") && (
                  <button className="homebtn_resume" onClick={() => updateResume(item)}>
                    Resume
                  </button>
                )}

                {(role === "admin" || role === "manager") && (
                  <button className="homebtn_rep" onClick={() => switchPage("assignReputation")}>
                    Reputation ({item.reputation})
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
      {pages.current.reputationCatalog && <ReputationCatalog goBackRC={() => switchPage("main")} />}
      {pages.current.assignReputation && <AssignReputation goBackAR={() => switchPage("main")} />}
      {pages.current.addReferrer && <AddReferrer goBackAR={() => switchPage("main")} />}
      {pages.current.myInvitation && <MyInvitation goBackMI={() => switchPage("main")} />}
    </>
  );
}
