import React, { useState, useEffect } from "react";
import { invoke } from "@forge/bridge";
import "./UpdateResume.css";

export default function UpdateResume({ goBackU }) {
  const [resumes, setResumes] = useState([]);

  const loadResumes = async () => {
    try {
      const result = await invoke("updateresume"); 
      // result must be array of resume objects

      setResumes(result || []);
    } catch (err) {
      console.error("ERROR loading resumes:", err);
      alert("Failed to load resume data");
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  return (
    <div className="update-container">
      <h2>Resume List</h2>

      {resumes.map((r) => (
        <div className="resume-box" key={r.freelancerId}>
          {/* Top section: photo & bio */}
          <div className="top-row">
            <div className="photo-box">
              <img src={r.photoUrl} alt="profile" className="photo" />
            </div>

            <div className="bio-box">
              <h3 className="name">{r.fullName}</h3>
              <p className="bio">{r.bio}</p>
            </div>
          </div>

          {/* Experience */}
          <div className="section">
            <h4 className="section-title">Experience</h4>
            <p className="section-content">{r.experience}</p>
          </div>

          {/* Skills */}
          <div className="section">
            <h4 className="section-title">Skills</h4>
            <p className="section-content">{r.skills}</p>
          </div>
        </div>
      ))}

      {goBackU && (
        <button className="btn_close" onClick={goBackU}>
          Close
        </button>
      )}
    </div>
  );
}
