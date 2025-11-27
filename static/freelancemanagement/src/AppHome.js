import React, { useState } from "react";
import AddResume from "./AddResume"; // should only include the form/content
import UpdateResume from "./UpdateResume";
import "./AppHome.css";

const freelancers = [
  { id: 1, name: "John Smith", photo: "./photos/johnsmith.png", skills: "React, Node.js", reputation: 4.8, referrer: "Alice" },
  { id: 2, name: "Maria Tan", photo: "./photos/mariatan.png", skills: "Python, FastAPI", reputation: 4.6, referrer: "Kevin" },
  { id: 3, name: "Ahmed Noor", photo: "./photos/ahmednoor.png", skills: "Golang, DevOps", reputation: 4.9, referrer: "Sarah" },
];

export default function AppHome() {
  const [submenuResumeVisible, setSubmenuResumeVisible] = useState(false);
  const [showAddResume, setShowAddResume] = useState(false);
  const [showUpdateResume, setShowUpdateResume] = useState(false);
const [submenuRepVisible, setSubmenuRepVisible] = useState(false);
const [submenuRefVisible, setSubmenuRefVisible] = useState(false);

  const handleAddResume = () => setShowAddResume(true);
  const handleUpdateResume = () => setShowUpdateResume(true);
  
  const handleCloseAddResume = () => setShowAddResume(false);
  const handleCloseUpdateResume = () => setShowUpdateResume(false);


return (
  <div className="container">
    <h1 className="title">Freelancer Candidates</h1>

    {/* 🔥 Top Menu */}
    <div className="top-menu">
      <div className="menu-row">

        {/* --- Resume Menu --- */}
        <div
          className="menu-btn-wrapper"
          onMouseEnter={() => setSubmenuResumeVisible(true)}
          onMouseLeave={() => setSubmenuResumeVisible(false)}
        >
          <button className="resume-btn">Resume</button>

          {submenuResumeVisible && (
            <div className="submenu">
              <button className="add-resume-btn" onClick={handleAddResume} >
                Add Resume
              </button>
              <button className="update-resume-btn" onClick={handleUpdateResume} >
                Update Resume
              </button>
            </div>
          )}
        </div>

        {/* --- Reputation Menu --- */}
        <div
          className="menu-btn-wrapper"
          onMouseEnter={() => setSubmenuRepVisible(true)}
          onMouseLeave={() => setSubmenuRepVisible(false)}
        >
          <button className="menu-btn">Reputation</button>

          {submenuRepVisible && (
            <div className="submenu">
              <button className="add-rep-btn">
                Add Reputation
              </button>
              <button className="update-rep-btn">
                Update Reputation
              </button>
            </div>
          )}
        </div>

        {/* --- Referrer Menu --- */}
        <div
          className="menu-btn-wrapper"
          onMouseEnter={() => setSubmenuRefVisible(true)}
          onMouseLeave={() => setSubmenuRefVisible(false)}
        >
          <button className="menu-btn">Referrer</button>

          {submenuRefVisible && (
            <div className="submenu">
              <button className="ref-points-btn">
                Referrer Points
              </button>
              <button className="ref-profile-btn">
                Referrer Profile
              </button>
            </div>
          )}
        </div>

      </div>
    </div>

    {/* AddResume Panel inside same page */}
    {showAddResume && (
      <div className="add-resume-panel">
        <AddResume goBack={handleCloseAddResume} />
      </div>
    )}

  {showUpdateResume && (
      <div className="add-resume-panel">
        <UpdateResume goBackU={handleCloseUpdateResume} />
      </div>
    )}


    {/* Freelancer Cards */}
    <div className="list">
      {freelancers.map((item) => (
        <div key={item.id} className="card">
          <img src={item.photo} className="photo" alt="avatar" />
          <div className="info">
            <h2 className="name">{item.name}</h2>
            <p className="skills">{item.skills}</p>
          </div>
          <div className="actions">
            <button className="btn_resume">Resume</button>
            <button className="btn_rep">Reputation ({item.reputation})</button>
            <button className="btn_ref">Referrer: {item.referrer}</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

}
