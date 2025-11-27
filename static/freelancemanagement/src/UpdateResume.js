import React, { useState, useEffect } from "react";
import { invoke } from "@forge/bridge";
import "./UpdateResume.css";

export default function UpdateResume({ goBackU }) {
  const [resumes, setResumes] = useState([]);
  const [index, setIndex] = useState(0); // show only 1 resume
  const [pageRange, setPageRange] = useState("1-10"); // dropdown selection
  const [totalCount, setTotalCount] = useState(10); // temporary until backend sends real count // dropdown selection

  const loadResumes = async () => {
    try {
      const result = await invoke("updateresume");
      const arr = Array.isArray(result) ? result : [];
      setResumes(arr);
      setIndex(0);
    } catch (err) {
      console.error("ERROR loading resumes:", err);
      alert("Failed to load resume data");
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const next = () => {
    if (index < resumes.length - 1) setIndex(index + 1);
  };

  const prev = () => {
    if (index > 0) setIndex(index - 1);
  };

  const updateResume = () => {
    alert("Update backend later for ID: " + resumes[index].id);
  };

  const deleteResume = () => {
    alert("Delete backend later for ID: " + resumes[index].id);
  };

  const handleRangeChange = (e) => {
    setPageRange(e.target.value);
    setIndex(0);
  };

  const r = resumes[index] || {};

  return (
    <div className="container-updateresume">
      {/* Top bar */}
      <div className="top-bar">
        <select className="range-select" value={pageRange} onChange={handleRangeChange}>
        {/* dynamically generated once backend count added */}
        {Array.from({ length: Math.ceil(totalCount / 10) }, (_, i) => {
          const start = i * 10 + 1;
          const end = (i + 1) * 10;
          return (
            <option key={i} value={`${start}-${end}`}>{`${start}-${end}`}</option>
          );
        })
        </select>
      </div>

      {/* Resume Display */}
      <div className="resume-viewer">
        <div className="arrow-left" onClick={prev}>&lt;</div>

        <div className="resume-box-single">
          <h2>Resume #{index + 1}</h2>

          {/* BIO SECTION */}
          <div className="bio-section">
            <h3 className="name">
              {(r.firstName || "-") + " " + (r.lastName || "-")}
            </h3>

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
                  <strong>GitHub:</strong> <a href={r.github} target="_blank" rel="noopener noreferrer">{r.github}</a>
                </p>
              )}
            </div>
          </div>

          {/* EXPERIENCE */}
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

          {/* Action buttons */}
          <div className="action-buttons">
            <button className="btn-update" onClick={updateResume}>Update Resume</button>
            <button className="btn-delete" onClick={deleteResume}>Delete</button>
          </div>
        </div>

        <div className="arrow-right" onClick={next}>&gt;</div>
      </div>

      {goBackU && (
        <button className="btn_close" onClick={goBackU}>Close</button>
      )}
    </div>
  );
}
