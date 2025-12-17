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
    photoBase64: "", // <<< ADDED
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

  // ================= PHOTO UPLOAD LOGIC (ADDED ONLY) =================
const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // JPG/JPEG only
    if (!["image/jpeg", "image/jpg"].includes(file.type)) {
      alert("Only JPG/JPEG images are allowed");
      e.target.value = "";
      return;
    }

    // max 200KB
    if (file.size > 200 * 1024) {
      alert("Image must be 200KB or smaller");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateBio("photoBase64", reader.result); 
      console.log("Photo loaded, size:", reader.result.length);
    };
    reader.readAsDataURL(file);
  };

  // ==================================================================

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
    <div className="container-addresumear">

      {/* BIO */}
      <h3 className="sectiontitle-h3ar">Bio Information</h3>
      <hr className="section-separatorar" />

      {/* ===== UPLOAD PHOTO (ADDED ONLY) ===== */}

      {/* PHOTO UPLOAD */}
      <div className="photo_divar">
        <label className="photolabelar">Upload Photo:</label>
        <div className="inputphoto-divar">
          <input
            type="file"
            accept="image/jpeg,image/jpg"
            onChange={handlePhotoUpload}
          />
          <div style={{ color: "#999", fontSize: "12px" }}>
            JPG/JPEG only, max 200KB
          </div>
        </div>
      </div>

      {/* ==================================== */}

      <div className="firstlastname_divar">
        <div className="firstname_divar">
          <label className="firstnamelabelar" htmlFor="input_firstname">First Name:</label>
          <div className="inputfirstname-divar">
            <input
              id="input_firstname"
              type="text"
              className="input_firstnamear"
              placeholder="First Name"
              ref={firstNameRef}
            />
          </div>
        </div>

        <div className="lastname_divar">
          <label className="lastnamelabelar" htmlFor="input_lastname">Last Name:</label>
          <div className="inputlastname-divar">
            <input
              id="input_lastname"
              type="text"
              className="input_lastnamear"
              placeholder="Last Name"
              ref={lastNameRef}
            />
          </div>
        </div>
      </div>

      <div className="birth_divar">
        <label className="birthlabelar" htmlFor="input_dob">Date of Birth:</label>
        <div className="inputdob-divar">
          <input
            id="input_dob"
            type="text"
            className="input_dobar"
            placeholder="Date of Birth"
            value={bio.dateOfBirth}
            onChange={(e) => updateBio("dateOfBirth", e.target.value)}
          />
        </div>
      </div>

      <div className="placebirth_divar">
        <label className="poblabelar" htmlFor="input_pob">Place of Birth:</label>
        <div className="inputpob-divar">
          <input
            id="input_pob"
            type="text"
            className="input_pobar"
            placeholder="Place of Birth"
            value={bio.placeOfBirth}
            onChange={(e) => updateBio("placeOfBirth", e.target.value)}
          />
        </div>
      </div>

      <div className="address_divar">
        <label className="addresslabelar" htmlFor="input_address">Address:</label>
        <div className="inputaddress-divar">
          <input
            id="input_address"
            type="text"
            className="input_addressar"
            placeholder="Address"
            value={bio.address}
            onChange={(e) => updateBio("address", e.target.value)}
          />
        </div>
      </div>

      <div className="religion_divar">
        <label className="religionlabelar" htmlFor="input_religion">Religion:</label>
        <div className="inputreligion-divar">
          <input
            id="input_religion"
            type="text"
            className="input_religionar"
            placeholder="Religion"
            value={bio.religion}
            onChange={(e) => updateBio("religion", e.target.value)}
          />
        </div>
      </div>

      <div className="contactnumber_divar">
        <label className="contactnumberlabelar" htmlFor="input_contact">Contact Number:</label>
        <div className="inputcontact-divar">
          <input
            id="input_contact"
            type="text"
            className="input_contactar"
            placeholder="Contact Number"
            value={bio.contact}
            onChange={(e) => updateBio("contact", e.target.value)}
          />
        </div>
      </div>

      <div className="email_divar">
        <label className="emaillabelar" htmlFor="input_email">Email:</label>
        <div className="inputemail-divar">
          <input
            id="input_email"
            type="text"
            className="input_emailar"
            placeholder="Email"
            value={bio.email}
            onChange={(e) => updateBio("email", e.target.value)}
          />
        </div>
      </div>

      <div className="nationality_divar">
        <label className="nationalitylabelar" htmlFor="input_nationality">Nationality:</label>
        <div className="inputnationality-divar">
          <input
            id="input_nationality"
            type="text"
            className="input_nationalityar"
            placeholder="Nationality"
            value={bio.nationality}
            onChange={(e) => updateBio("nationality", e.target.value)}
          />
        </div>
      </div>

      <div className="github_divar">
        <label className="githublabelar" htmlFor="input_github">GitHub URL:</label>
        <div className="inputgithub-divar">
          <input
            id="input_github"
            type="text"
            className="input_githubar"
            placeholder="GitHub URL"
            value={bio.github}
            onChange={(e) => updateBio("github", e.target.value)}
          />
        </div>
      </div>

      {/* EXPERIENCE */}
      <h3 className="sectiontitle-h3ar">Experience</h3>
      <hr className="section-separatorar" />

      {experiences.map((exp, index) => (
        <div className="experience_block_divar" key={index}>
          <div className="company_divar">
            <label className="companylabelar" htmlFor={`input_company_${index}`}>Company:</label>
            <div className="inputcompany-divar">
              <input
                id={`input_company_${index}`}
                type="text"
                className="input_companyar"
                placeholder="Company"
                value={exp.company}
                onChange={(e) => updateExp(index, "company", e.target.value)}
              />
            </div>
          </div>

          <div className="position_divar">
            <label className="positionlabelar" htmlFor={`input_position_${index}`}>Position:</label>
            <div className="inputposition-divar">
              <input
                id={`input_position_${index}`}
                type="text"
                className="input_positionar"
                placeholder="Position"
                value={exp.position}
                onChange={(e) => updateExp(index, "position", e.target.value)}
              />
            </div>
          </div>

          <div className="workingperiod_divar">
            <label className="workingperiodlabelar" htmlFor={`input_workperiod_${index}`}>Working Period:</label>
            <div className="inputworkingperiod-divar">
              <input
                id={`input_workperiod_${index}`}
                type="text"
                className="input_workingperiodar"
                placeholder="e.g. 2019–2022"
                value={exp.workingPeriod}
                onChange={(e) => updateExp(index, "workingPeriod", e.target.value)}
              />
            </div>
          </div>

          <div className="jobdesc_divar">
            <label className="jobdesclabelar" htmlFor={`input_jobdesc_${index}`}>Job Description:</label>
            <div className="inputjobdesc-divar">
              <textarea
                id={`input_jobdesc_${index}`}
                className="input_jobdescar"
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

      <div className="addremoveexperiencebtn_divar">
        <button className="addexperience_btnar" onClick={addExperienceBlock}>
          + Add Experience
        </button>

        <button className="removeexperience_btnar" onClick={removeLastExperienceBlock}>
          - Remove Experience
        </button>
      </div>

      {/* SKILLS */}
      <h3 className="sectiontitle-h3ar">Skills</h3>
      <hr className="section-separatorar" />

      <div className="skills_divar">
        <label className="skillslabelar" htmlFor="input_skills">Skills:</label>
        <div className="inputskills-divar">
          <input
            id="input_skills"
            type="text"
            className="input_skillsar"
            placeholder="Skills (comma separated)"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
        </div>
      </div>

      <div className="submitresetclose_divar">
        <button className="submitresume_btnar" onClick={submitData}>Submit Resume</button>
        <button className="resetresume_btnar" onClick={submitData}>Reset Resume</button>

        {goBack && (
          <button className="closeresume_btnar" onClick={goBack}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}
