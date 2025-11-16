import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/resignations';

const HRDashboard = () => {
  const [resignations, setResignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exitDate, setExitDate] = useState({});

  const fetchResignations = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setResignations(res.data);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setError('Failed to fetch resignations.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResignations();
  }, []);

  // Format date for display
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const handleAction = async (id, action) => {
    setError('');
    const today = new Date().toISOString().split('T')[0];

    try {
      let endpoint = `${API_URL}/${action}/${id}`;
      let data = {};

      if (action === 'approve') {
        if (!exitDate[id] || new Date(exitDate[id]) <= new Date(today)) {
          setError('Exit Date must be set and must be in the future.');
          return;
        }
        data = { exitDate: exitDate[id] };
      }

      await axios.put(endpoint, data);
      await fetchResignations();
    } catch (err) {
      setError(err.response?.data?.msg || `Failed to ${action} request.`);
    }
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading)
    return <div className="text-center p-8">Loading requests...</div>;
  if (error)
    return (
      <div className="p-3 bg-red-100 text-red-700 rounded-md border-l-4 border-red-500">
        {error}
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        HR Dashboard - Resignation Requests
      </h2>

      <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Intended Last Day
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exit Interview
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions / Exit Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {resignations.map((req) => (
              <tr key={req._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {req.employeeUsername}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(req.intendedLastWorkingDay)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {req.reason}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(
                      req.status
                    )}`}
                  >
                    {req.status}
                  </span>
                  {req.exitDate && req.status === 'Approved' && (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      Exit: {formatDate(req.exitDate)}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {req.exitInterviewCompleted ? (
                    <InterviewReview req={req} formatDate={formatDate} />
                  ) : req.status === 'Approved' ? (
                    'Pending Employee'
                  ) : (
                    'N/A'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {req.status === 'Pending' ? (
                    <div className="flex flex-col space-y-2">
                      <input
                        type="date"
                        value={exitDate[req._id] || ''}
                        onChange={(e) =>
                          setExitDate({
                            ...exitDate,
                            [req._id]: e.target.value,
                          })
                        }
                        className="p-1 border border-gray-300 rounded text-sm"
                        title="Set Official Exit Date"
                      />
                      <button
                        onClick={() => handleAction(req._id, 'approve')}
                        className="text-white bg-green-600 hover:bg-green-700 font-medium py-1 px-3 rounded-md transition duration-150 text-xs"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(req._id, 'reject')}
                        className="text-white bg-red-600 hover:bg-red-700 font-medium py-1 px-3 rounded-md transition duration-150 text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400">Action Taken</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Component for HR to review the Exit Interview
const InterviewReview = ({ req }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-indigo-600 hover:text-indigo-900 font-medium text-xs underline"
      >
        View Review
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-3">
              Exit Interview by {req.employeeUsername}
            </h3>
            <p>
              <strong>Culture Rating:</strong>{' '}
              {req.exitInterviewResponses.cultureRating} / 5
            </p>
            <p className="mt-2">
              <strong>Management Feedback:</strong>
            </p>
            <p className="bg-gray-50 p-2 rounded text-sm whitespace-pre-wrap">
              {req.exitInterviewResponses.managementFeedback}
            </p>
            <p className="mt-2">
              <strong>Suggestions:</strong>
            </p>
            <p className="bg-gray-50 p-2 rounded text-sm whitespace-pre-wrap">
              {req.exitInterviewResponses.suggestions}
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-indigo-500 text-white text-base font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HRDashboard;
