import React, { useRef, useState, useEffect } from "react";
import { invoke } from "@forge/bridge";
import "./AddResume.css";

export default function UpdateAction({ goBackUA, resumeData }) {
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

  const [experiences, setExperiences] = useState([]);
  const [skills, setSkills] = useState("");

  const updateBio = (key, val) =>
    setBio((prev) => ({ ...prev, [key]: val }));

  const updateExp = (idx, key, val) =>
    setExperiences((prev) =>
      prev.map((exp, i) => (i === idx ? { ...exp, [key]: val } : exp))
    );

  const addExperienceBlock = () =>
    setExperiences((prev) => [
      ...prev,
      {
        company: "",
        position: "",
        workingPeriod: "",
        jobDescription: "",
      },
    ]);

  const removeLastExperienceBlock = () =>
    setExperiences((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  // -----------------------------
  // PREFILL DATA WHEN OPEN UPDATE
  // -----------------------------
useEffect(() => {
  if (!resumeData) return;

  // Prefill first/last name
  if (firstNameRef.current) firstNameRef.current.value = resumeData.firstName || "";
  if (lastNameRef.current) lastNameRef.current.value = resumeData.lastName || "";

  setBio({
    dateOfBirth: resumeData.dateOfBirth || "",
    placeOfBirth: resumeData.placeOfBirth || "",
    address: resumeData.address || "",
    religion: resumeData.religion || "",
    contact: resumeData.contact || "",
    email: resumeData.email || "",
    nationality: resumeData.nationality || "",
    github: resumeData.github || "",
  });

  setExperiences(
    resumeData.experiences?.map((exp) => ({
      company: exp.company,
      position: exp.position,
      workingPeriod: exp.working_period,
      jobDescription: exp.job_description,
    })) || [
      { company: "", position: "", workingPeriod: "", jobDescription: "" },
    ]
  );

  setSkills(resumeData.skills || "");
}, [resumeData]);

  // -----------------------------
  // SUBMIT UPDATED DATA
  // -----------------------------
  const submitUpdate = async () => {
    const payload = {
      id: resumeData?.id, // important
      bio: {
        firstName: firstNameRef.current.value,
        lastName: lastNameRef.current.value,
        ...bio,
      },
      experience: experiences,
      skills,
    };

    try {
      await invoke("updateresume", payload);
      alert("Resume updated successfully!");
      if (goBackUA) goBackUA();
    } catch (err) {
      alert("Failed to update resume");
    }
  };

  // UI FORM
  return (
    <div className="container-addresume">
      <h2>Update Resume</h2>

      {/* BIO */}
      <h3>Bio Information</h3>

      <div className="firstlastname_div">
        <div className="firstname_div">
          <span className="firstnamespan">First Name:</span>
          <input ref={firstNameRef} className="input_firstname" />
        </div>

        <div className="lastname_div">
          <span className="lastnamespan">Last Name:</span>
          <input ref={lastNameRef} className="input_lastname" />
        </div>
      </div>

      <div className="birth_div">
        <span className="birthspan"> Date of Birth:</span>
        <input
          className="input_dob"
          value={bio.dateOfBirth}
          onChange={(e) => updateBio("dateOfBirth", e.target.value)}
        />
      </div>

      <div className="placebirth_div">
        <span className="pobspan">Place of Birth:</span>
        <input
          className="input_pob"
          value={bio.placeOfBirth}
          onChange={(e) => updateBio("placeOfBirth", e.target.value)}
        />
      </div>

      <div className="address_div">
        <span className="addressspan">Address:</span>
        <input
          className="input_address"
          value={bio.address}
          onChange={(e) => updateBio("address", e.target.value)}
        />
      </div>

      <div className="religion_div">
        <span className="religionspan">Religion:</span>
        <input
          className="input_religion"
          value={bio.religion}
          onChange={(e) => updateBio("religion", e.target.value)}
        />
      </div>

      <div className="contactnumber_div">
        <span className="contactnumberspan">Contact Number:</span>
        <input
          className="input_contact"
          value={bio.contact}
          onChange={(e) => updateBio("contact", e.target.value)}
        />
      </div>

      <div className="email_div">
        <span className="emailspan">Email:</span>
        <input
          className="input_email"
          value={bio.email}
          onChange={(e) => updateBio("email", e.target.value)}
        />
      </div>

      <div className="nationality_div">
        <span className="nationalityspan">Nationality:</span>
        <input
          className="input_nationality"
          value={bio.nationality}
          onChange={(e) => updateBio("nationality", e.target.value)}
        />
      </div>

      <div className="github_div">
        <span className="githubspan">GitHub URL:</span>
        <input
          className="input_github"
          value={bio.github}
          onChange={(e) => updateBio("github", e.target.value)}
        />
      </div>

      {/* EXPERIENCES */}
      <h3>Experience</h3>

      {experiences.map((exp, index) => (
        <div className="experience_block_div" key={index}>
          <div className="company_div">
            <span className="companyspan">Company:</span>
            <input
              className="input_company"
              value={exp.company}
              onChange={(e) =>
                updateExp(index, "company", e.target.value)
              }
            />
          </div>

          <div className="position_div">
            <span className="positionspan">Position:</span>
            <input
              className="input_position"
              value={exp.position}
              onChange={(e) =>
                updateExp(index, "position", e.target.value)
              }
            />
          </div>

          <div className="workingperiod_div">
            <span className="workingperiodspan">Working Period:</span>
            <input
              className="input_workingperiod"
              value={exp.workingPeriod}
              onChange={(e) =>
                updateExp(index, "workingPeriod", e.target.value)
              }
            />
          </div>

          <div className="jobdesc_div">
            <span className="jobdescspan">Job Description:</span>
            <textarea
              className="input_jobdesc"
              value={exp.jobDescription}
              onChange={(e) =>
                updateExp(index, "jobDescription", e.target.value)
              }
            ></textarea>
          </div>
        </div>
      ))}

      <button onClick={addExperienceBlock}>+ Add Experience</button>
      <button onClick={removeLastExperienceBlock}>- Remove</button>

      {/* SKILLS */}
      <h3>Skills</h3>
      <input
        className="input_skills"
        value={skills}
        onChange={(e) => setSkills(e.target.value)}
      />

      <div className="submitresetclose_div">
        <button className="submitresume_btn" onClick={submitUpdate}>
          Update Resume
        </button>

        {goBackUA && (
          <button className="closeresume_btn" onClick={goBackUA}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}
