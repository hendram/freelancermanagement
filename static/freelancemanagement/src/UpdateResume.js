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
       <div className="resumediv">
        <div className="photobiobox">
        <div className="photobox">
 { /* will have img later on */ } 
       </div>
        <div className="biobox">
  <div className="namediv">
    <label>Name:</label>
    <div className="name">{(r.firstName || "-") + " " + (r.lastName || "-")}</div>
  </div>

  <div className="dobdiv">
    <label>Date of Birth:</label>
    <div className="dob">{r.dateOfBirth || "-"}</div>
  </div>

  <div className="pobdiv">
    <label>Place of Birth:</label>
    <div className="pob">{r.placeOfBirth || "-"}</div>
  </div>

  <div className="addressdiv">
    <label>Address:</label>
    <div className="address">{r.address || "-"}</div>
  </div>

  <div className="religiondiv">
    <label>Religion:</label>
    <div className="religion">{r.religion || "-"}</div>
  </div>

  <div className="contactdiv">
    <label>Contact:</label>
    <div className="contact">{r.contact || "-"}</div>
  </div>

  <div className="emaildiv">
    <label>Email:</label>
    <div className="email">{r.email || "-"}</div>
  </div>

  <div className="nationalitydiv">
    <label>Nationality:</label>
    <div className="nationality">{r.nationality || "-"}</div>
  </div>

  {r.github && (
    <div className="githubdiv">
      <label>GitHub:</label>
      <div className="github">
        <a href={r.github} target="_blank" rel="noopener noreferrer">{r.github}</a>
      </div>
    </div>
  )}
</div>
  </div>

          {/* EXPERIENCE */}
          <div className="experience-viewer">
            <h4 className="section-title">Experience</h4>
{Array.isArray(r.experiences) && r.experiences.length > 0 ? (
  r.experiences.map((exp, idx) => (
    <div className="experience-item" key={idx}>
      <div className="companydiv">
        <label>Company:</label>
        <div className="company">{exp.company || "-"}</div>
      </div>

      <div className="positiondiv">
        <label>Position:</label>
        <div className="position">{exp.position || "-"}</div>
      </div>

      <div className="perioddiv">
        <label>Period:</label>
        <div className="period">{exp.working_period || "-"}</div>
      </div>

      <div className="descriptiondiv">
        <label>Description:</label>
        <div className="job-description">{exp.job_description || "-"}</div>
      </div>

      <hr />
    </div>
  ))
) : (
  <p>-</p>
)}
          </div>

          {/* SKILLS */}
          <div className="skills-viewer">
            <h4 className="section-title">Skills</h4>
     <div className="skillsdiv">
     <label>Skills:</label>
        <div className="skills">{r.skills || "-"}</div>
      </div>
          </div>

          {/* Action buttons */}
          <div className="action-buttons">
            <button className="update-btn" onClick={handleUpdateClick}>Update Resume</button>
            <button className="delete-btn" onClick={() => handleDelete(resumes[index].id)}>Delete</button>
             {goBackU && <button className="btn_close" onClick={goBackU}>Close</button>}
          </div>
</div> {/* closing of resumediv */}

        <div className="arrow-right" onClick={next}>&gt;</div>
      </div>
    </div>
  );
}
