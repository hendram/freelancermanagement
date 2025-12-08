import React, { useState } from 'react';
import { invoke } from '@forge/bridge';
import './MyInvitation.css';

const MyInvitation = () => {
  const [email, setEmail] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verified, setVerified] = useState(false);

  const priceUnits = [
    'per/hour', 'per/day', 'per/week',
    'per/month', 'per/task', 'per/bug', 'per/userstory'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInvitations([]);
    setVerified(false);

    try {
      if (!email) {
        setError('Please enter your email.');
        setLoading(false);
        return;
      }

      // Verify if resume exists for this email
      const resumeCheck = await invoke('checkresumebyemail', { email });
      if (!resumeCheck?.exists) {
        setError('No resume found for this email.');
        setLoading(false);
        return;
      }

      // Fetch invitations for this resume
      const res = await invoke('getinvitations', { resumeId: resumeCheck.resumeId });
      if (res?.success && Array.isArray(res.data)) {
        setInvitations(res.data);
        setVerified(true);
      } else {
        setError(res?.error || 'Failed to fetch invitations.');
      }
    } catch (err) {
      console.error(err);
      setError('Unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setEmail('');
    setInvitations([]);
    setVerified(false);
    setError(null);
  };

  if (!verified) {
    // Email input form
    return (
      <div className="email-verification">
        <h2>Enter your email to access invitations</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Submit'}
          </button>
          <button type="button" onClick={handleReset}>Reset</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  // Invitations view after email verified
  return (
    <div>
      {invitations.length === 0 && <div>No invitations found.</div>}
      {invitations.map((data) => (
        <div key={data.id} className="my-invitation-card">

          {/* TITLE */}
          <div className="row title-row">
            <h2>{data.issue_type || 'Task'}: {data.issue_summary || 'No Summary'}</h2>
          </div>
          <hr />

          {/* LABEL */}
          <div className="row label-row">
            <span className="task-key"><b>Task Label:</b> {data.issue_key || 'N/A'}</span>
            <p className="task-summary">{data.issue_summary || 'No Summary'}</p>
          </div>
          <hr />

          {/* REFERRER */}
          <div className="row refer-row">
            <div className="refer-item"><b>Refer by:</b> {data.referrer_name || 'N/A'}</div>
            <div className="refer-item"><b>Refer To:</b> {data.referee_name || 'N/A'}</div>
          </div>
          <hr />

          {/* PROPOSAL */}
          {data.proposals != null && (
            <>
              <div className="row proposal-row">
                <label>Proposal:</label>
                <textarea defaultValue={data.proposals} rows="4"></textarea>
              </div>
              <hr />
            </>
          )}

          {/* PRICE */}
          <div className="row price-row">
            <label><b>Price:</b></label>
            <div className="price-inputs">
              <input
                type="text"
                defaultValue={data.price || ''}
                placeholder="e.g. 500"
                className="price-amount"
              />
              <span className="currency">USD</span>
              <select defaultValue={data.price_unit || 'per/task'}>
                {priceUnits.map((unit) => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>
          <hr />

          {/* PASS BUTTON */}
          <div className="row pass-row flex-end">
            <button className="pass-btn">Pass</button>
          </div>
        </div>
      ))}
      <button onClick={handleReset} className="reset-btn">Change Email</button>
    </div>
  );
};

export default MyInvitation;
