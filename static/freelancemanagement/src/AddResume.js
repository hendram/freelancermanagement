import React, { useState } from "react";
import { invoke } from "@forge/bridge";
import "./AddResume.css";

export default function AddResume({ goBack }) {
  // BIO
  const [bio, setBio] = useState({
    fullName: "",
    dateOfBirth: "",
    placeOfBirth: "",
    address: "",
    religion: "",
    contact: "",
    email: "",
    nationality: "",
    github: "",
  });

  // EXPERIENCE (single block for now, later becomes array)
  const [experience, setExperience] = useState({
    company: "",
    position: "",
    workingPeriod: "",
    jobDescription: "",
  });

  // SKILLS
  const [skills, setSkills] = useState("");

  // update bio/experience helpers
  const updateBio = (key, val) =>
    setBio((prev) => ({ ...prev, [key]: val }));

  const updateExp = (key, val) =>
    setExperience((prev) => ({ ...prev, [key]: val }));

  const submitData = async () => {
    const payload = {
      bio,
      experience,
      skills,
    };

    try {
      console.log("Sending payload:", payload);

      const result = await invoke("addresume", payload);
      console.log("Backend response:", result);

      alert("Resume submitted successfully!");
      if (goBack) goBack();
    } catch (err) {
      console.error("ERROR submitting resume:", err);
      alert("Failed to submit resume");
    }
  };

  return (
    <div className="container-addresume">
      <h2>Add Resume</h2>

      {/* BIO BLOCK */}
      <h3>Bio Information</h3>

      <input className="inputbox" placeholder="Full Name"
        value={bio.fullName}
        onChange={(e) => updateBio("fullName", e.target.value)} />

      <input className="inputbox" placeholder="Date of Birth"
        value={bio.dateOfBirth}
        onChange={(e) => updateBio("dateOfBirth", e.target.value)} />

      <input className="inputbox" placeholder="Place of Birth"
        value={bio.placeOfBirth}
        onChange={(e) => updateBio("placeOfBirth", e.target.value)} />

      <input className="inputbox" placeholder="Address"
        value={bio.address}
        onChange={(e) => updateBio("address", e.target.value)} />

      <input className="inputbox" placeholder="Religion"
        value={bio.religion}
        onChange={(e) => updateBio("religion", e.target.value)} />

      <input className="inputbox" placeholder="Contact Number"
        value={bio.contact}
        onChange={(e) => updateBio("contact", e.target.value)} />

      <input className="inputbox" placeholder="Email"
        value={bio.email}
        onChange={(e) => updateBio("email", e.target.value)} />

      <input className="inputbox" placeholder="Nationality"
        value={bio.nationality}
        onChange={(e) => updateBio("nationality", e.target.value)} />

      <input className="inputbox" placeholder="GitHub URL"
        value={bio.github}
        onChange={(e) => updateBio("github", e.target.value)} />

      {/* EXPERIENCE BLOCK */}
      <h3>Experience</h3>

      <input className="inputbox" placeholder="Company"
        value={experience.company}
        onChange={(e) => updateExp("company", e.target.value)} />

      <input className="inputbox" placeholder="Position"
        value={experience.position}
        onChange={(e) => updateExp("position", e.target.value)} />

      <input className="inputbox" placeholder="Working Period (e.g. 2019–2022)"
        value={experience.workingPeriod}
        onChange={(e) => updateExp("workingPeriod", e.target.value)} />

      <textarea className="inputbox" placeholder="Job Description"
        value={experience.jobDescription}
        onChange={(e) => updateExp("jobDescription", e.target.value)} />

      {/* SKILLS */}
      <h3>Skills</h3>

      <input className="inputbox"
        placeholder="Skills (comma separated)"
        value={skills}
        onChange={(e) => setSkills(e.target.value)} />

      <button className="btn_resume" onClick={submitData}>
        Submit Resume
      </button>

      {goBack && (
        <button className="btn_close" onClick={goBack} style={{ marginTop: 10 }}>
          Close
        </button>
      )}
    </div>
  );
}
