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
     
      <div className="resume-viewer">
        <div className="arrow-left" onClick={prev}>&lt;</div>
       <div className="resumediv">
        <div className="photobiobox">
        <div className="photobox">
 { /* will have img later on */ } 
       </div>
<div className="biobox">
  <div className="namediv">
    <label className="namelabel">Name:</label>
    <div className="name">{(r.firstName || "-") + " " + (r.lastName || "-")}</div>
  </div>

  <div className="dobdiv">
    <label className="doblabel">Date of Birth:</label>
    <div className="dob">{r.dateOfBirth || "-"}</div>
  </div>

  <div className="pobdiv">
    <label className="poblabel">Place of Birth:</label>
    <div className="pob">{r.placeOfBirth || "-"}</div>
  </div>

  <div className="addressdiv">
    <label className="addresslabel">Address:</label>
    <div className="address">{r.address || "-"}</div>
  </div>

  <div className="religiondiv">
    <label className="religionlabel">Religion:</label>
    <div className="religion">{r.religion || "-"}</div>
  </div>

  <div className="contactdiv">
    <label className="contactlabel">Contact:</label>
    <div className="contact">{r.contact || "-"}</div>
  </div>

  <div className="emaildiv">
    <label className="emaillabel">Email:</label>
    <div className="email">{r.email || "-"}</div>
  </div>

  <div className="nationalitydiv">
    <label className="nationalitylabel">Nationality:</label>
    <div className="nationality">{r.nationality || "-"}</div>
  </div>

  {r.github && (
    <div className="githubdiv">
      <label className="githublabel">GitHub:</label>
      <div className="github">
        <a href={r.github} target="_blank" rel="noopener noreferrer">{r.github}</a>
      </div>
    </div>
  )}
</div>

  </div>

{/* EXPERIENCE */}
<div className="experience-viewer">
  <div className="experience-title">Experience</div>

  {Array.isArray(r.experiences) && r.experiences.length > 0 ? (
    r.experiences.map((exp, idx) => (
      <div className="experience-item" key={idx}>
        
        <div className="companydiv">
          <label className="companylabel">Company:</label>
          <div className="company">{exp.company || "-"}</div>
        </div>

        <div className="positiondiv">
          <label className="positionlabel">Position:</label>
          <div className="position">{exp.position || "-"}</div>
        </div>

        <div className="perioddiv">
          <label className="periodlabel">Period:</label>
          <div className="period">{exp.working_period || "-"}</div>
        </div>

        <div className="descriptiondiv">
          <label className="descriptionlabel">Job Description:</label>
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
  <div className="skills-title">Skills</div>

  <div className="skillsdiv">
    <label className="skillslabel">Skills:</label>
    <div className="skills">{r.skills || "-"}</div>
  </div>

</div>

   <div className="buttonselect-div">
        <select className="range-select" value={pageRange} onChange={handleRangeChange}>
          {Array.from({ length: Math.ceil(totalCount / 10) }, (_, i) => {
            const start = i * 10 + 1;
            const end = (i + 1) * 10;
            return <option className="options" key={i} value={`${start}-${end}`}>{`${start}-${end}`}</option>;
          })}
        </select>
      </div>
   

          {/* Action buttons */}
          <div className="action-buttons">
            <button className="update-btn" onClick={handleUpdateClick}>Update Resume</button>
            <button className="delete-btn" onClick={() => handleDelete(resumes[index].id)}>Delete</button>
             {goBackU && <button className="close-btn" onClick={goBackU}>Close</button>}
          </div>
</div> {/* closing of resumediv */}

        <div className="arrow-right" onClick={next}>&gt;</div>
      </div>
    </div>
  );
}
