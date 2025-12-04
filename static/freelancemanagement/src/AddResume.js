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

  return  (
  <div className="container-addresume">

    {/* BIO */}
    <h3 className="sectiontitle-h3">Bio Information</h3>
    <hr class="section-separator" />

    <div className="firstlastname_div">
      <div className="firstname_div">
        <label className="firstnamelabel" htmlFor="input_firstname">First Name:</label>
        <div className="inputfirstname-div">
          <input
            id="input_firstname"
            type="text"
            className="input_firstname"
            placeholder="First Name"
            ref={firstNameRef}
          />
        </div>
      </div>

      <div className="lastname_div">
        <label className="lastnamelabel" htmlFor="input_lastname">Last Name:</label>
        <div className="inputlastname-div">
          <input
            id="input_lastname"
            type="text"
            className="input_lastname"
            placeholder="Last Name"
            ref={lastNameRef}
          />
        </div>
      </div>
    </div>

    <div className="birth_div">
      <label className="birthlabel" htmlFor="input_dob">Date of Birth:</label>
      <div className="inputdob-div">
        <input
          id="input_dob"
          type="text"
          className="input_dob"
          placeholder="Date of Birth"
          value={bio.dateOfBirth}
          onChange={(e) => updateBio("dateOfBirth", e.target.value)}
        />
      </div>
    </div>

    <div className="placebirth_div">
      <label className="poblabel" htmlFor="input_pob">Place of Birth:</label>
      <div className="inputpob-div">
        <input
          id="input_pob"
          type="text"
          className="input_pob"
          placeholder="Place of Birth"
          value={bio.placeOfBirth}
          onChange={(e) => updateBio("placeOfBirth", e.target.value)}
        />
      </div>
    </div>

    <div className="address_div">
      <label className="addresslabel" htmlFor="input_address">Address:</label>
      <div className="inputaddress-div">
        <input
          id="input_address"
          type="text"
          className="input_address"
          placeholder="Address"
          value={bio.address}
          onChange={(e) => updateBio("address", e.target.value)}
        />
      </div>
    </div>

    <div className="religion_div">
      <label className="religionlabel" htmlFor="input_religion">Religion:</label>
      <div className="inputreligion-div">
        <input
          id="input_religion"
          type="text"
          className="input_religion"
          placeholder="Religion"
          value={bio.religion}
          onChange={(e) => updateBio("religion", e.target.value)}
        />
      </div>
    </div>

    <div className="contactnumber_div">
      <label className="contactnumberlabel" htmlFor="input_contact">Contact Number:</label>
      <div className="inputcontact-div">
        <input
          id="input_contact"
          type="text"
          className="input_contact"
          placeholder="Contact Number"
          value={bio.contact}
          onChange={(e) => updateBio("contact", e.target.value)}
        />
      </div>
    </div>

    <div className="email_div">
      <label className="emaillabel" htmlFor="input_email">Email:</label>
      <div className="inputemail-div">
        <input
          id="input_email"
          type="text"
          className="input_email"
          placeholder="Email"
          value={bio.email}
          onChange={(e) => updateBio("email", e.target.value)}
        />
      </div>
    </div>

    <div className="nationality_div">
      <label className="nationalitylabel" htmlFor="input_nationality">Nationality:</label>
      <div className="inputnationality-div">
        <input
          id="input_nationality"
          type="text"
          className="input_nationality"
          placeholder="Nationality"
          value={bio.nationality}
          onChange={(e) => updateBio("nationality", e.target.value)}
        />
      </div>
    </div>

    <div className="github_div">
      <label className="githublabel" htmlFor="input_github">GitHub URL:</label>
      <div className="inputgithub-div">
        <input
          id="input_github"
          type="text"
          className="input_github"
          placeholder="GitHub URL"
          value={bio.github}
          onChange={(e) => updateBio("github", e.target.value)}
        />
      </div>
    </div>

    {/* EXPERIENCE */}
    <h3 className="sectiontitle-h3">Experience</h3>
<hr class="section-separator" />

    {experiences.map((exp, index) => (
      <div className="experience_block_div" key={index}>
        <div className="company_div">
          <label className="companylabel" htmlFor={`input_company_${index}`}>Company:</label>
          <div className="inputcompany-div">
            <input
              id={`input_company_${index}`}
              type="text"
              className="input_company"
              placeholder="Company"
              value={exp.company}
              onChange={(e) => updateExp(index, "company", e.target.value)}
            />
          </div>
        </div>

        <div className="position_div">
          <label className="positionlabel" htmlFor={`input_position_${index}`}>Position:</label>
          <div className="inputposition-div">
            <input
              id={`input_position_${index}`}
              type="text"
              className="input_position"
              placeholder="Position"
              value={exp.position}
              onChange={(e) => updateExp(index, "position", e.target.value)}
            />
          </div>
        </div>

        <div className="workingperiod_div">
          <label className="workingperiodlabel" htmlFor={`input_workperiod_${index}`}>Working Period:</label>
          <div className="inputworkingperiod-div">
            <input
              id={`input_workperiod_${index}`}
              type="text"
              className="input_workingperiod"
              placeholder="e.g. 2019–2022"
              value={exp.workingPeriod}
              onChange={(e) => updateExp(index, "workingPeriod", e.target.value)}
            />
          </div>
        </div>

        <div className="jobdesc_div">
          <label className="jobdesclabel" htmlFor={`input_jobdesc_${index}`}>Job Description:</label>
          <div className="inputjobdesc-div">
            <textarea
              id={`input_jobdesc_${index}`}
              className="input_jobdesc"
              placeholder="Job Description"
              value={exp.jobDescription}
              onChange={(e) =>
                updateExp(index, "jobDescription", e.target.value)
              }
            ></textarea>
          </div>
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
    <h3 className="sectiontitle-h3">Skills</h3>
   <hr class="section-separator" />

    <div className="skills_div">
      <label className="skillslabel" htmlFor="input_skills">Skills:</label>
      <div className="inputskills-div">
        <input
          id="input_skills"
          type="text"
          className="input_skills"
          placeholder="Skills (comma separated)"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />
      </div>
    </div>

    <div className="submitresetclose_div">
      <button className="submitresume_btn" onClick={submitData}>Submit Resume</button>

      <button className="resetresume_btn" onClick={submitData}>Reset Resume</button>

      {goBack && (
        <button className="closeresume_btn" onClick={goBack}>
          Close
        </button>
      )}
    </div>
  </div>
);

}
