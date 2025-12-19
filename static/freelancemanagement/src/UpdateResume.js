import React, { useState, useEffect } from "react";
import { invoke } from "@forge/bridge";
import "./UpdateResume.css";
import LeftArrow from "./assets/leftarrow.svg";
import RightArrow from "./assets/rightarrow.svg";
import Alert from "./Alert";


export default function UpdateResume({ goBackU, onSelectResumeForUpdate }) {
  const [resumes, setResumes] = useState([]);
  const [index, setIndex] = useState(0);
  const [pageRange, setPageRange] = useState("1-10");
  const [totalCount, setTotalCount] = useState(10);
const [uialert, setUiAlert] = useState(null);


  const loadResumes = async () => {
    try {
      const result = await invoke("updateresume");
      setTotalCount(result.totalCount || 0);
      setResumes(result.resumes || []);
      setIndex(0);
    } catch (err) {
      console.error("ERROR loading resumes:", err);
setUiAlert({
  type: "error",
  title: "Load failed",
  message: "Failed to load resume data"
});
      
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
  <div className="containerur-updateresume">
    <div className="resumeur-viewer">
      <div className="arrowur-left" onClick={prev}>  <img src={LeftArrow} alt="Previous" />
</div>

      <div className="resumedivur">
        <div className="photobioboxur">
          <div className="photoboxur">
<img
  src={
    r.photoBase64
      ? `data:image/jpeg;base64,${r.photoBase64}`
      : "./photos/default.png"
  }
  alt="photo"
  className="photour-img"
/>
          </div>

          <div className="bioboxur">
            <div className="namedivur">
              <div className="namelabelur">Name:</div>
              <div className="nameur">
                {(r.firstName || "-") + " " + (r.lastName || "-")}
              </div>
            </div>

            <div className="dobdivur">
              <div className="doblabelur">Date of Birth:</div>
              <div className="dobur">{r.dateOfBirth || "-"}</div>
            </div>

            <div className="pobdivur">
              <div className="poblabelur">Place of Birth:</div>
              <div className="pobur">{r.placeOfBirth || "-"}</div>
            </div>

            <div className="addressdivur">
              <div className="addresslabelur">Address:</div>
              <div className="addressur">{r.address || "-"}</div>
            </div>

            <div className="religiondivur">
              <div className="religionlabelur">Religion:</div>
              <div className="religionur">{r.religion || "-"}</div>
            </div>

            <div className="contactdivur">
              <div className="contactlabelur">Contact:</div>
              <div className="contactur">{r.contact || "-"}</div>
            </div>

            <div className="emaildivur">
              <div className="emaillabelur">Email:</div>
              <div className="emailur">{r.email || "-"}</div>
            </div>

            <div className="nationalitydivur">
              <div className="nationalitylabelur">Nationality:</div>
              <div className="nationalityur">{r.nationality || "-"}</div>
            </div>

            {r.github && (
              <div className="githubdivur">
                <div className="githublabelur">GitHub:</div>
                <div className="githubur">
                  <a href={r.github} target="_blank" rel="noopener noreferrer">
                    {r.github}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* EXPERIENCE */}
        <div className="experienceur-viewer">
          <div className="experienceur-title">Experience</div>

          {Array.isArray(r.experiences) && r.experiences.length > 0 ? (
            r.experiences.map((exp, idx) => (
              <div className="experienceur-item" key={idx}>
                <div className="companydivur">
                  <div className="companylabelur">Company:</div>
                  <div className="companyur">{exp.company || "-"}</div>
                </div>

                <div className="positiondivur">
                  <div className="positionlabelur">Position:</div>
                  <div className="positionur">{exp.position || "-"}</div>
                </div>

                <div className="perioddivur">
                  <div className="periodlabelur">Period:</div>
                  <div className="periodur">{exp.working_period || "-"}</div>
                </div>

                <div className="descriptiondivur">
                  <div className="descriptionlabelur">Job Description:</div>
                  <div className="job-descriptionur">
                    {exp.job_description || "-"}
                  </div>
                </div>

                <hr />
              </div>
            ))
          ) : (
            <p>-</p>
          )}
        </div>

        {/* SKILLS */}
        <div className="skillsur-viewer">
          <div className="skillsur-title">Skills</div>

          <div className="skillsdivur">
            <div className="skillslabelur">Skills:</div>
            <div className="skillsur">{r.skills || "-"}</div>
          </div>
        </div>

        <div className="buttonselectur-div">
          <select
            className="rangeur-select"
            value={pageRange}
            onChange={handleRangeChange}
          >
            {Array.from({ length: Math.ceil(totalCount / 10) }, (_, i) => {
              const start = i * 10 + 1;
              const end = (i + 1) * 10;
              return (
                <option
                  className="optionsur"
                  key={i}
                  value={`${start}-${end}`}
                >
                  {`${start}-${end}`}
                </option>
              );
            })}
          </select>
        </div>

        {/* Action buttons */}
        <div className="actionur-buttons">
          <button className="updateur-btn" onClick={handleUpdateClick}>
            Update Resume
          </button>
          <button
            className="deleteur-btn"
            onClick={() => handleDelete(resumes[index].id)}
          >
            Delete
          </button>
          {goBackU && (
            <button className="closeur-btn" onClick={goBackU}>
              Close
            </button>
          )}
        </div>
      </div>

      <div className="arrowur-right" onClick={next}>
  <img src={RightArrow} alt="Next" />
</div>
    </div>
{uialert && (
  <Alert
    type={uialert.type}
    title={uialert.title}
    message={uialert.message}
    onClose={() => setUiAlert(null)}
  />
)}

  </div>
);

}
