import React, { useState, useEffect } from "react";
import { invoke } from "@forge/bridge";
import "./UpdateResume.css";

export default function UpdateResume({ goBackU }) {
  const [resumes, setResumes] = useState([]);

  const loadResumes = async () => {
    try {
      const result = await invoke("updateresume");
      setResumes(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error("ERROR loading resumes:", err);
      alert("Failed to load resume data");
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  return (
    <div className="container-updateresume">
      <h2>Resume List</h2>

      {resumes.map((r) => (
        <div className="resume-box" key={r.id}>
          {/* BIO SECTION */}
          <div className="bio-section">
            <h3 className="name">{r.fullName || "-"}</h3>

            <div className="bio-details">
              <p><strong>Date of Birth:</strong> {r.dateOfBirth || "-"}</p>
              <p><strong>Place of Birth:</strong> {r.placeOfBirth || "-"}</p>
              <p><strong>Address:</strong> {r.address || "-"}</p>
              <p><strong>Religion:</strong> {r.religion || "-"}</p>
              <p><strong>Contact:</strong> {r.contact || "-"}</p>
              <p><strong>Email:</strong> {r.email || "-"}</p>
              <p><strong>Nationality:</strong> {r.nationality || "-"}</p>

              {r.github && (
                <p>
                  <strong>GitHub:</strong>{" "}
                  <a href={r.github} target="_blank" rel="noopener noreferrer">
                    {r.github}
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* EXPERIENCE LIST */}
          <div className="section">
            <h4 className="section-title">Experience</h4>

            {Array.isArray(r.experience) && r.experience.length > 0 ? (
              r.experience.map((exp, idx) => (
                <div className="experience-item" key={idx}>
                  <p><strong>Company:</strong> {exp.company || "-"}</p>
                  <p><strong>Position:</strong> {exp.position || "-"}</p>
                  <p><strong>Period:</strong> {exp.workingPeriod || "-"}</p>
                  <p><strong>Description:</strong></p>
                  <p className="job-desc">{exp.jobDescription || "-"}</p>
                  <hr />
                </div>
              ))
            ) : (
              <p>-</p>
            )}
          </div>

          {/* SKILLS */}
          <div className="section">
            <h4 className="section-title">Skills</h4>
            <p className="section-content">{r.skills || "-"}</p>
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
