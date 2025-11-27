import React, { useState } from "react";
import { invoke } from "@forge/bridge";
import "./AddResume.css";

export default function AddResume({ goBack }) {
  // BIO BLOCK (separate fields)
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [religion, setReligion] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [nationality, setNationality] = useState("");
  const [github, setGithub] = useState("");

  // EXPERIENCE BLOCK (separate fields)
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [workingPeriod, setWorkingPeriod] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // SKILLS (separate field)
  const [skills, setSkills] = useState("");

  const submitData = async () => {
    const payload = {
      fullName,
      dateOfBirth,
      placeOfBirth,
      address,
      religion,
      contact,
      email,
      nationality,
      github,

      company,
      position,
      workingPeriod,
      jobDescription,

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
    <div className="container" style={{ padding: 20 }}>
      <h2>Add Resume</h2>

      {/* BIO BLOCK */}
      <h3>Bio Information</h3>

      <input className="inputbox" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <input className="inputbox" placeholder="Date of Birth" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
      <input className="inputbox" placeholder="Place of Birth" value={placeOfBirth} onChange={(e) => setPlaceOfBirth(e.target.value)} />
      <input className="inputbox" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
      <input className="inputbox" placeholder="Religion" value={religion} onChange={(e) => setReligion(e.target.value)} />
      <input className="inputbox" placeholder="Contact Number" value={contact} onChange={(e) => setContact(e.target.value)} />
      <input className="inputbox" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="inputbox" placeholder="Nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} />
      <input className="inputbox" placeholder="GitHub URL" value={github} onChange={(e) => setGithub(e.target.value)} />

      {/* EXPERIENCE BLOCK */}
      <h3>Experience</h3>

      <input className="inputbox" placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
      <input className="inputbox" placeholder="Position" value={position} onChange={(e) => setPosition(e.target.value)} />
      <input className="inputbox" placeholder="Working Period (e.g. 2019–2022)" value={workingPeriod} onChange={(e) => setWorkingPeriod(e.target.value)} />

      <textarea
        className="inputbox"
        placeholder="Job Description"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
      />

      {/* SKILLS */}
      <h3>Skills</h3>
      <input className="inputbox" placeholder="Skills (comma separated)" value={skills} onChange={(e) => setSkills(e.target.value)} />

      <button className="btn_resume" onClick={submitData}>Submit Resume</button>

      {goBack && <button className="btn_close" onClick={goBack} style={{ marginTop: 10 }}>Close</button>}
    </div>
  );
}
