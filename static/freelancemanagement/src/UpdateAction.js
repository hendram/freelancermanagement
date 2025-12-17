import React, { useRef, useState, useEffect } from "react";
import { invoke } from "@forge/bridge";
import "./UpdateAction.css";

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
    photoBase64: ""
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
      photoBase64: resumeData.photoBase64 || ""
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
  if (!resumeData?.id) {
    alert("Invalid resume ID");
    return;
  }

  const cleanedExperiences = experiences.filter(
    (exp) =>
      exp.company ||
      exp.position ||
      exp.workingPeriod ||
      exp.jobDescription
  );

  const payload = {
    id: resumeData.id,
    bio: {
      firstName: firstNameRef.current.value,
      lastName: lastNameRef.current.value,
      ...bio,
    },
    experience: cleanedExperiences,
    skills,
  };

  try {
    await invoke("updateaction", payload);
    alert("Resume updated successfully!");
    if (goBackUA) goBackUA();
  } catch (err) {
    alert("Failed to update resume");
  }
};

  // UI FORM
  return  (
  <div className="container-addresumeua">
    {/* BIO */}
    <h3 className="sectiontitle-h3ua">Bio Information</h3>

<div className="photo_block_ua">
  {bio.photoBase64 && (
    <img
      src={`data:image/jpeg;base64,${bio.photoBase64}`}
      alt="Profile"
      className="photo_preview_ua"
    />
  )}

  <label className="changephoto_btnua">
    Change Photo
    <input
      type="file"
      accept="image/jpeg,image/png"
      hidden
      onChange={(e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 200 * 1024) {
          alert("Image must be under 200KB");
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(",")[1];
        updateBio("photoBase64", base64);
        };
        reader.readAsDataURL(file);
      }}
    />
  </label>
</div>

    <div className="firstlastname_divua">
      <div className="firstname_divua">
        <label className="firstnamelabelua" htmlFor="ua_input_firstname">First Name:</label>
        <div className="inputfirstname-divua">
          <input
            id="ua_input_firstname"
            className="input_firstnameua"
            ref={firstNameRef}
          />
        </div>
      </div>

      <div className="lastname_divua">
        <label className="lastnamelabelua" htmlFor="ua_input_lastname">Last Name:</label>
        <div className="inputlastname-divua">
          <input
            id="ua_input_lastname"
            className="input_lastnameua"
            ref={lastNameRef}
          />
        </div>
      </div>
    </div>

    <div className="birth_divua">
      <label className="birthlabelua" htmlFor="ua_input_dob">Date of Birth:</label>
      <div className="inputdob-divua">
        <input
          id="ua_input_dob"
          className="input_dobua"
          value={bio.dateOfBirth}
          onChange={(e) => updateBio("dateOfBirth", e.target.value)}
        />
      </div>
    </div>

    <div className="placebirth_divua">
      <label className="poblabelua" htmlFor="ua_input_pob">Place of Birth:</label>
      <div className="inputpob-divua">
        <input
          id="ua_input_pob"
          className="input_pobua"
          value={bio.placeOfBirth}
          onChange={(e) => updateBio("placeOfBirth", e.target.value)}
        />
      </div>
    </div>

    <div className="address_divua">
      <label className="addresslabelua" htmlFor="ua_input_address">Address:</label>
      <div className="inputaddress-divua">
        <input
          id="ua_input_address"
          className="input_addressua"
          value={bio.address}
          onChange={(e) => updateBio("address", e.target.value)}
        />
      </div>
    </div>

    <div className="religion_divua">
      <label className="religionlabelua" htmlFor="ua_input_religion">Religion:</label>
      <div className="inputreligion-divua">
        <input
          id="ua_input_religion"
          className="input_religionua"
          value={bio.religion}
          onChange={(e) => updateBio("religion", e.target.value)}
        />
      </div>
    </div>

    <div className="contactnumber_divua">
      <label className="contactnumberlabelua" htmlFor="ua_input_contact">Contact Number:</label>
      <div className="inputcontact-divua">
        <input
          id="ua_input_contact"
          className="input_contactua"
          value={bio.contact}
          onChange={(e) => updateBio("contact", e.target.value)}
        />
      </div>
    </div>

    <div className="email_divua">
      <label className="emaillabelua" htmlFor="ua_input_email">Email:</label>
      <div className="inputemail-divua">
        <input
          id="ua_input_email"
          className="input_emailua"
          value={bio.email}
          onChange={(e) => updateBio("email", e.target.value)}
        />
      </div>
    </div>

    <div className="nationality_divua">
      <label className="nationalitylabelua" htmlFor="ua_input_nationality">Nationality:</label>
      <div className="inputnationality-divua">
        <input
          id="ua_input_nationality"
          className="input_nationalityua"
          value={bio.nationality}
          onChange={(e) => updateBio("nationality", e.target.value)}
        />
      </div>
    </div>

    <div className="github_divua">
      <label className="githublabelua" htmlFor="ua_input_github">GitHub URL:</label>
      <div className="inputgithub-divua">
        <input
          id="ua_input_github"
          className="input_githubua"
          value={bio.github}
          onChange={(e) => updateBio("github", e.target.value)}
        />
      </div>
    </div>

    {/* EXPERIENCE */}
    <h3 className="sectiontitle-h3ua">Experience</h3>

    {experiences.map((exp, index) => (
      <div className="experience_block_divua" key={index}>

        <div className="company_divua">
          <label className="companylabelua" htmlFor={`ua_input_company_${index}`}>Company:</label>
          <div className="inputcompany-divua">
            <input
              id={`ua_input_company_${index}`}
              className="input_companyua"
              value={exp.company}
              onChange={(e) => updateExp(index, "company", e.target.value)}
            />
          </div>
        </div>

        <div className="position_divua">
          <label className="positionlabelua" htmlFor={`ua_input_position_${index}`}>Position:</label>
          <div className="inputposition-divua">
            <input
              id={`ua_input_position_${index}`}
              className="input_positionua"
              value={exp.position}
              onChange={(e) => updateExp(index, "position", e.target.value)}
            />
          </div>
        </div>

        <div className="workingperiod_divua">
          <label className="workingperiodlabelua" htmlFor={`ua_input_workperiod_${index}`}>Working Period:</label>
          <div className="inputworkingperiod-divua">
            <input
              id={`ua_input_workperiod_${index}`}
              className="input_workingperiodua"
              value={exp.workingPeriod}
              onChange={(e) => updateExp(index, "workingPeriod", e.target.value)}
            />
          </div>
        </div>

        <div className="jobdesc_divua">
          <label className="jobdesclabelua" htmlFor={`ua_input_jobdesc_${index}`}>Job Description:</label>
          <div className="inputjobdesc-divua">
            <textarea
              id={`ua_input_jobdesc_${index}`}
              className="input_jobdescua"
              value={exp.jobDescription}
              onChange={(e) => updateExp(index, "jobDescription", e.target.value)}
            ></textarea>
          </div>
        </div>
      </div>
    ))}

    <div className="addremoveexperiencebtn_divua">
      <button className="addexperience_btnua" onClick={addExperienceBlock}>+ Add Experience</button>
      <button className="removeexperience_btnua" onClick={removeLastExperienceBlock}>- Remove</button>
    </div>

    {/* SKILLS */}
    <h3 className="sectiontitle-h3ua">Skills</h3>

    <div className="skills_divua">
      <label className="skillslabelua" htmlFor="ua_input_skills">Skills:</label>
      <div className="inputskills-divua">
        <input
          id="ua_input_skills"
          className="input_skillsua"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />
      </div>
    </div>

    <div className="submitresetclose_divua">
      <button className="submitresume_btnua" onClick={submitUpdate}>Update Resume</button>

      {goBackUA && (
        <button className="closeresume_btnua" onClick={goBackUA}>
          Close
        </button>
      )}
    </div>
  </div>
);

}
