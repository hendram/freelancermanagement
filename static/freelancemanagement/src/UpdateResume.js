import React, { useState, useEffect } from "react";
import { invoke } from "@forge/bridge";
import "./UpdateResume.css";

export default function UpdateResume({ goBackU, onSelectResumeForUpdate }) {
  const [resumes, setResumes] = useState([]);
  const [index, setIndex] = useState(0);
  const [pageRange, setPageRange] = useState("1-10");
  const [totalCount, setTotalCount] = useState(10);

  const loadResumes = async () => {
    try {
      const result = await invoke("updateresume");
      setTotalCount(result.totalCount || 0);
      setResumes(result.resumes || []);
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

  const handleRangeChange = (e) => {
    setPageRange(e.target.value);
    setIndex(0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this resume?")) return;
    try {
      await invoke("deleteresume", { id });
      const updated = resumes.filter((r) => r.id !== id);
      setResumes(updated);
      if (index >= updated.length) setIndex(Math.max(updated.length - 1, 0));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleUpdateClick = () => {
    if (onSelectResumeForUpdate) {
      onSelectResumeForUpdate(resumes[index]); // send selected resume to parent
    }
  };

  const r = resumes[index] || {};

  return (
    <div className="container-updateresume">
      <div className="top-bar">
        <select className="range-select" value={pageRange} onChange={handleRangeChange}>
          {Array.from({ length: Math.ceil(totalCount / 10) }, (_, i) => {
            const start = i * 10 + 1;
            const end = (i + 1) * 10;
            return <option key={i} value={`${start}-${end}`}>{`${start}-${end}`}</option>;
          })}
        </select>
      </div>

      <div className="resume-viewer">
        <div className="arrow-left" onClick={prev}>&lt;</div>
        <div className="resume-box-single">
          <h2>Resume #{index + 1}</h2>
          {/* BIO SECTION */}
          <div className="bio-section">
            <h3 className="name">{(r.firstName || "-") + " " + (r.lastName || "-")}</h3>
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
            {Array.isArray(r.experiences) && r.experiences.length > 0 ? (
              r.experiences.map((exp, idx) => (
                <div className="experience-item" key={idx}>
                  <p><strong>Company:</strong> {exp.company || "-"}</p>
                  <p><strong>Position:</strong> {exp.position || "-"}</p>
                  <p><strong>Period:</strong> {exp.working_period || "-"}</p>
                  <p><strong>Description:</strong></p>
                  <p className="job-desc">{exp.job_description || "-"}</p>
                  <hr />
                </div>
              ))
            ) : <p>-</p>}
          </div>

          {/* SKILLS */}
          <div className="section">
            <h4 className="section-title">Skills</h4>
            <p className="section-content">{r.skills || "-"}</p>
          </div>

          {/* Action buttons */}
          <div className="action-buttons">
            <button className="update-btn" onClick={handleUpdateClick}>Update Resume</button>
            <button className="delete-btn" onClick={() => handleDelete(resumes[index].id)}>Delete</button>
          </div>
        </div>
        <div className="arrow-right" onClick={next}>&gt;</div>
      </div>

      {goBackU && <button className="btn_close" onClick={goBackU}>Close</button>}
    </div>
  );
}
