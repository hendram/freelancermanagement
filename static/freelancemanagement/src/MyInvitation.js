import React, { useState } from 'react';
import './MyInvitation.css'; // Assuming you'll add a CSS file for styling

const MyInvitation = ({ invitationData }) => {
  // State for toggling the referrer update select
  const [showReferrerSelect, setShowReferrerSelect] = useState(false);
  // State for the selected new referrer (simulated list)
  const [newReferrer, setNewReferrer] = useState('');

  // Sample data if invitationData is null (replace with actual database data structure)
  const defaultData = {
    type: 'Task', // Could be 'Task', 'Bug', 'Subtask'
    title: 'Implement User Profile CRUD Operations',
    key: 'PROJ-123',
    summary: 'Develop the backend and frontend for user profile management.',
    referrerName: 'Alice Johnson',
    refereeName: 'Bob Williams', // The person referred by this invitee
    hasProposal: true, // Determines if the proposal textarea should exist
    currentProposal: "I propose to finish this in 3 days, focusing on secure API endpoints.",
    price: 350,
    priceUnit: 'per/task',
    availableReferrers: ['Charlie Brown', 'Dana Scully', 'Eve Harrington'], // Simulated list
  };

  const data = invitationData || defaultData;

  // Price unit options for the select element
  const priceUnits = [
    'per/hour',
    'per/day',
    'per/week',
    'per/month',
    'per/task',
    'per/bug',
    'per/userstory',
  ];

  const handleUpdateReferrer = () => {
    setShowReferrerSelect(!showReferrerSelect);
  };

  const handlePass = () => {
    alert(`Passed on ${data.type}: ${data.title}`);
    // **Implement actual logic to update database/state for passing on the invitation**
  };

  return (
    <div className="my-invitation-card">
      {/* 1. Task/Bug/Subtask Title */}
      <div className="row title-row">
        <h2>
          **{data.type}:** {data.title}
        </h2>
      </div>

      <hr />

      {/* 2. Task Label (Key + Summary) */}
      <div className="row label-row">
        <span className="task-key">**Task Label:** {data.key}</span>
        <p className="task-summary">{data.summary}</p>
      </div>

      <hr />

      {/* 3. Referrer Section */}
      <div className="row refer-row">
        <div className="refer-item">
          **Refer by:** <span className="referrer-name">{data.referrerName}</span>
        </div>
        <div className="refer-item">
          **Refer To:** <span className="referee-name">{data.refereeName || 'N/A'}</span>
        </div>
      </div>

      {/* 4. Update Referrer Button and Select */}
      <div className="row update-referrer-row">
        <button className="update-btn" onClick={handleUpdateReferrer}>
          Update Referrer
        </button>
        {showReferrerSelect && (
          <select
            value={newReferrer}
            onChange={(e) => setNewReferrer(e.target.value)}
            className="referrer-select"
          >
            <option value="" disabled>
              Select New Referrer
            </option>
            {data.availableReferrers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      <hr />

      {/* 5. Submit Proposal (Conditionally rendered) */}
      {data.hasProposal && (
        <>
          <div className="row proposal-row">
            <label htmlFor="proposal-textarea">**Submit Your Proposal:**</label>
            <textarea
              id="proposal-textarea"
              defaultValue={data.currentProposal} // Use defaultValue for initial proposal
              rows="4"
              placeholder="Detail your approach, estimated time, and any relevant notes..."
            ></textarea>
          </div>
          <hr />
        </>
      )}

      {/* 6. Price Input */}
      <div className="row price-row">
        <label htmlFor="price-input">**Price:**</label>
        <div className="price-inputs">
          <input
            id="price-input"
            type="text"
            defaultValue={data.price}
            placeholder="e.g., 500"
            className="price-amount"
          />
          <span className="currency">USD</span>
          <select defaultValue={data.priceUnit} className="price-unit-select">
            {priceUnits.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
      </div>

      <hr />

      {/* 7. Pass Button (Flex-end) */}
      <div className="row pass-row flex-end">
        <button className="pass-btn" onClick={handlePass}>
          Pass
        </button>
      </div>
    </div>
  );
};

export default MyInvitation;
