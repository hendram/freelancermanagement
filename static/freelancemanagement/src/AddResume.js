import React, { useRef, useState } from "react";
import { invoke } from "@forge/bridge";
import "./AddResume.css";

export default function AddResume({ goBack }) {
  // BIO (Refs only for first/last name)
  const firstNameRef = useRef();
  const lastNameRef = useRef();

  const [bio, setBio] = useState({
    dateOfBirth: "",
    placeOfBirth: "",
    address: "",
    religion: "",
    contact: "",
    email: "",
    nationality: "",
    github: "",
  });

  const updateBio = (key, val) =>
    setBio((prev) => ({ ...prev, [key]: val }));

  // EXPERIENCE (Array)
  const [experiences, setExperiences] = useState([
    { company: "", position: "", workingPeriod: "", jobDescription: "" },
  ]);

  const updateExp = (index, key, val) => {
    setExperiences((prev) =>
      prev.map((exp, i) => (i === index ? { ...exp, [key]: val } : exp))
    );
  };

  const addExperienceBlock = () => {
    setExperiences((prev) => [
      ...prev,
      { company: "", position: "", workingPeriod: "", jobDescription: "" },
    ]);
  };

const removeLastExperienceBlock = () => {
  setExperiences((prev) => prev.length > 1 ? prev.slice(0, -1) : prev);
};


  const submitData = async () => {
    const payload = {
      bio: {
        firstName: firstNameRef.current?.value || "",
        lastName: lastNameRef.current?.value || "",
        ...bio,
      },
      experience: experiences,
      skills,
    };

    try {
      await invoke("addresume", payload);
      alert("Resume submitted successfully!");
      if (goBack) goBack();
    } catch (err) {
      alert("Failed to submit resume");
    }
  };

  const [skills, setSkills] = useState("");

  return (
<div className="container-addresume">
  <h2>Add Resume</h2>

  {/* BIO */}
  <h3>Bio Information</h3>

  <div className="firstlastname_div">
    <div className="firstname_div">  
      <span className="firstnamespan">First Name:</span>
      <input
        type="text"
        className="input_firstname"
        placeholder="First Name"
        ref={firstNameRef}
      />
    </div>

    <div className="lastname_div">
      <span className="lastnamespan">Last Name:</span>
      <input
        type="text"
        className="input_lastname"
        placeholder="Last Name"
        ref={lastNameRef}
      />
    </div>
  </div>

  <div className="birth_div">
    <span className="birthspan"> Date of Birth:</span>
    <input
      type="text"
      className="input_dob"
      placeholder="Date of Birth"
      value={bio.dateOfBirth}
      onChange={(e) => updateBio("dateOfBirth", e.target.value)}
    />
  </div>

  <div className="placebirth_div">
    <span className="pobspan">Place of Birth:</span>
    <input
      type="text"
      className="input_pob"
      placeholder="Place of Birth"
      value={bio.placeOfBirth}
      onChange={(e) => updateBio("placeOfBirth", e.target.value)}
    />
  </div>

  <div className="address_div">
    <span className="addressspan">Address:</span>
    <input
      type="text"
      className="input_address"
      placeholder="Address"
      value={bio.address}
      onChange={(e) => updateBio("address", e.target.value)}
    />
  </div>

  <div className="religion_div">
    <span className="religionspan">Religion:</span>
    <input
      type="text"
      className="input_religion"
      placeholder="Religion"
      value={bio.religion}
      onChange={(e) => updateBio("religion", e.target.value)}
    />
  </div>

  <div className="contactnumber_div">
    <span className="contactnumberspan">Contact Number:</span>
    <input
      type="text"
      className="input_contact"
      placeholder="Contact Number"
      value={bio.contact}
      onChange={(e) => updateBio("contact", e.target.value)}
    />
  </div>

  <div className="email_div">
    <span className="emailspan">Email:</span>
    <input
      type="text"
      className="input_email"
      placeholder="Email"
      value={bio.email}
      onChange={(e) => updateBio("email", e.target.value)}
    />
  </div>

  <div className="nationality_div">
    <span className="nationalityspan">Nationality:</span>
    <input
      type="text"
      className="input_nationality"
      placeholder="Nationality"
      value={bio.nationality}
      onChange={(e) => updateBio("nationality", e.target.value)}
    />
  </div>

  <div className="github_div">
    <span className="githubspan">GitHub URL:</span>
    <input
      type="text"
      className="input_github"
      placeholder="GitHub URL"
      value={bio.github}
      onChange={(e) => updateBio("github", e.target.value)}
    />
  </div>

  {/* EXPERIENCE */}
  <h3>Experience</h3>


  {experiences.map((exp, index) => (
    <div className="experience_block_div" key={index}>
      <div className="company_div">
        <span className="companyspan">Company:</span>
        <input
          type="text"
          className="input_company"
          placeholder="Company"
          value={exp.company}
          onChange={(e) => updateExp(index, "company", e.target.value)}
        />
      </div>

      <div className="position_div">
        <span className="positionspan">Position:</span>
        <input
          type="text"
          className="input_position"
          placeholder="Position"
          value={exp.position}
          onChange={(e) => updateExp(index, "position", e.target.value)}
        />
      </div>

      <div className="workingperiod_div">
        <span className="workingperiodspan">Working Period:</span>
        <input
          type="text"
          className="input_workingperiod"
          placeholder="e.g. 2019–2022"
          value={exp.workingPeriod}
          onChange={(e) => updateExp(index, "workingPeriod", e.target.value)}
        />
      </div>

      <div className="jobdesc_div">
        <span className="jobdescspan">Job Description:</span>
        <textarea
          className="input_jobdesc"
          placeholder="Job Description"
          value={exp.jobDescription}
          onChange={(e) => updateExp(index, "jobDescription", e.target.value)}
        ></textarea>
      </div>
    </div>
  ))}

<div className="addremoveexperiencebtn_div">
  <button className="addexperience_btn" onClick={addExperienceBlock}>
    + Add Experience
  </button>

<button className="removeexperience_btn" onClick={removeLastExperienceBlock}>
  - Remove Experience
</button>
</div>

  {/* SKILLS */}
  <h3>Skills</h3>

  <div className="skills_div">
    <span className="skillsspan">Skills:</span>
    <input
      type="text"
      className="input_skills"
      placeholder="Skills (comma separated)"
      value={skills}
      onChange={(e) => setSkills(e.target.value)}
    />
  </div>

  <div className="submitresetclose_div">
    <button className="submitresume_btn" onClick={submitData}>
      Submit Resume
    </button>

    <button className="resetresume_btn" onClick={submitData}>
      Reset Resume
    </button>

    {goBack && (
      <button className="closeresume_btn" onClick={goBack}>
        Close
      </button>
    )}
  </div>
</div>
  );
}
