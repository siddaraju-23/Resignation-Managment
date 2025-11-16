import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuth from '../hooks/useAuth';

const API_URL = 'http://localhost:3001/api/resignations';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [reason, setReason] = useState('');
  const [intendedLastWorkingDay, setIntendedLastWorkingDay] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [interviewData, setInterviewData] = useState({
    cultureRating: '',
    managementFeedback: '',
    suggestions: '',
  });

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/my-status`);
      setStatus(res.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setStatus(null); // No previous request
      } else {
        setError('Error fetching resignation status.');
      }
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Format date for display
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const handleResignationSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await axios.post(API_URL, { intendedLastWorkingDay, reason });
      setMessage('Resignation submitted successfully! Status: Pending.');
      console.log(res);
      fetchStatus();
      setReason('');
      setIntendedLastWorkingDay('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit resignation.');
    }
  };

  const handleInterviewChange = (e) => {
    setInterviewData({ ...interviewData, [e.target.name]: e.target.value });
  };

  const handleInterviewSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await axios.put(`${API_URL}/interview/${status._id}`, interviewData);
      setMessage('Exit Interview submitted successfully!');
      fetchStatus();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit exit interview.');
    }
  };

  const renderStatusCard = () => {
    if (!status) return null;

    let statusColor = 'bg-yellow-100 border-yellow-500';
    let statusText = 'text-yellow-800';
    if (status.status === 'Approved') {
      statusColor = 'bg-green-100 border-green-500';
      statusText = 'text-green-800';
    } else if (status.status === 'Rejected') {
      statusColor = 'bg-red-100 border-red-500';
      statusText = 'text-red-800';
    }

    return (
      <div
        className={`p-6 border-l-4 ${statusColor} rounded-lg shadow-md mb-8`}
      >
        <h3 className="text-xl font-semibold mb-3">Your Resignation Status</h3>
        <p className="text-sm text-gray-700">
          <span className="font-medium">Submission Date:</span>{' '}
          {formatDate(status.submissionDate)}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-medium">Intended Last Day:</span>{' '}
          {formatDate(status.intendedLastWorkingDay)}
        </p>
        <p className="text-sm text-gray-700 mb-3">
          <span className="font-medium">Reason:</span> {status.reason}
        </p>
        <p className={`text-2xl font-bold ${statusText}`}>
          Status: {status.status}
        </p>
        {status.exitDate && (
          <p className="mt-2 text-lg font-bold text-green-700">
            Official Exit Date: **{formatDate(status.exitDate)}**
          </p>
        )}
      </div>
    );
  };

  const renderResignationForm = () => (
    <div className="bg-white p-6 rounded-lg shadow-xl">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">
        Submit Resignation Request
      </h3>
      <form onSubmit={handleResignationSubmit}>
        <div className="mb-4">
          <label
            className="block text-gray-700 font-medium mb-2"
            htmlFor="lastDay"
          >
            Intended Last Working Day (Current Country:{' '}
            {user.countryOfResidence})
          </label>
          <input
            type="date"
            id="lastDay"
            value={intendedLastWorkingDay}
            onChange={(e) => setIntendedLastWorkingDay(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Note: Cannot be a weekend or a holiday in your country.
          </p>
        </div>
        <div className="mb-6">
          <label
            className="block text-gray-700 font-medium mb-2"
            htmlFor="reason"
          >
            Reason for Resignation
          </label>
          <textarea
            id="reason"
            rows="4"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            required
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition duration-150"
        >
          Submit Request
        </button>
      </form>
    </div>
  );

  const renderInterviewForm = () => (
    <div className="bg-white p-6 rounded-lg shadow-xl mt-8 border-t-4 border-indigo-500">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">
        Exit Interview Questionnaire
      </h3>
      <form onSubmit={handleInterviewSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Overall Culture Rating (1-5)
          </label>
          <input
            type="number"
            name="cultureRating"
            min="1"
            max="5"
            value={interviewData.cultureRating}
            onChange={handleInterviewChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Feedback on Management
          </label>
          <textarea
            name="managementFeedback"
            rows="3"
            value={interviewData.managementFeedback}
            onChange={handleInterviewChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          ></textarea>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Suggestions for Improvement
          </label>
          <textarea
            name="suggestions"
            rows="3"
            value={interviewData.suggestions}
            onChange={handleInterviewChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-150"
        >
          Submit Exit Interview
        </button>
      </form>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        Employee Dashboard
      </h2>

      {error && (
        <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md border-l-4 border-red-500">
          {error}
        </div>
      )}
      {message && (
        <div className="p-3 mb-4 bg-green-100 text-green-700 rounded-md border-l-4 border-green-500">
          {message}
        </div>
      )}

      {/* RENDER STATUS CARD */}
      {renderStatusCard()}

      {/* Conditional Rendering based on Status */}
      {status ? (
        <>
          {/* If approved and interview not complete, show interview form */}
          {status.status === 'Approved' &&
            !status.exitInterviewCompleted &&
            renderInterviewForm()}

          {/* If approved and interview complete, show confirmation */}
          {status.status === 'Approved' && status.exitInterviewCompleted && (
            <div className="p-6 bg-indigo-100 border-l-4 border-indigo-500 rounded-lg shadow-md mt-8">
              <h3 className="text-xl font-semibold text-indigo-800">
                Exit Process Complete!
              </h3>
              <p>Your Exit Interview has been submitted for HR review.</p>
            </div>
          )}

          {/* If Pending or Rejected, show current action status */}
          {(status.status === 'Pending' || status.status === 'Rejected') && (
            <div className="p-6 bg-gray-100 rounded-lg shadow-md mt-8">
              <h3 className="text-xl font-semibold text-gray-800">
                Request Action
              </h3>
              <p>
                Your last request is currently **{status.status}**. You must
                wait for a final decision before submitting a new one.
              </p>
            </div>
          )}
        </>
      ) : (
        // RENDER SUBMISSION FORM if no request found
        renderResignationForm()
      )}
    </div>
  );
};

export default EmployeeDashboard;
