import React, { useState, useEffect } from 'react';

export default function Admin() {
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // States for viewing specific user history
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHistory, setUserHistory] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const res = await fetch('http://127.0.0.1:8000/api/reports/evaluation/', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    });
    if (res.ok) setDashboardData(await res.json());

    const userRes = await fetch('http://127.0.0.1:8000/api/reports/admin-users/', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    });
    if (userRes.ok) setUsers(await userRes.json());
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    const res = await fetch(`http://127.0.0.1:8000/api/reports/admin-users/${user.id}/`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    });
    if (res.ok) setUserHistory(await res.json());
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`WARNING: Are you sure you want to completely delete ${name} and all their medical reports?`)) return;

    const res = await fetch(`http://127.0.0.1:8000/api/reports/admin-users/${id}/`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    });
    
    if (res.ok) {
      alert("User successfully deleted.");
      setUsers(users.filter(u => u.id !== id)); // Remove from table instantly
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-6xl border-t-4 border-purple-600 mx-auto mt-8 relative">
      
      {/* --- AI METRICS SECTION (Keeps your old metrics) --- */}
      {dashboardData && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">AI Pipeline Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-purple-50 rounded shadow-sm text-center">
              <h3 className="text-sm text-gray-500 font-bold uppercase tracking-wider">Reports Processed</h3>
              <p className="text-3xl font-extrabold text-purple-700 mt-2">{dashboardData.total_reports_processed}</p>
            </div>
            <div className="p-4 bg-green-50 rounded shadow-sm text-center">
              <h3 className="text-sm text-gray-500 font-bold uppercase tracking-wider">Success Rate</h3>
              <p className="text-3xl font-extrabold text-green-700 mt-2">{dashboardData.pipeline_success_rate}%</p>
            </div>
            <div className="p-4 bg-blue-50 rounded shadow-sm text-center">
              <h3 className="text-sm text-gray-500 font-bold uppercase tracking-wider">Data Points</h3>
              <p className="text-3xl font-extrabold text-blue-700 mt-2">{dashboardData.total_data_points_extracted}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded shadow-sm text-center">
              <h3 className="text-sm text-gray-500 font-bold uppercase tracking-wider">OCR Confidence</h3>
              <p className="text-3xl font-extrabold text-orange-700 mt-2">{dashboardData.ocr_confidence_rate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* --- SUPER ADMIN USER MANAGEMENT --- */}
      <div className="flex justify-between items-center mt-12 mb-4">
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          className="border p-2 rounded w-64 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto shadow-sm border rounded">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-purple-100 text-purple-900 text-sm">
              <th className="p-3 border">User</th>
              <th className="p-3 border">Contact</th>
              <th className="p-3 border">Last Login</th>
              <th className="p-3 border">Last Logout</th>
              <th className="p-3 border">Reports</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 border-b text-sm">
                <td className="p-3 border font-bold text-gray-800">
                  {u.name} {u.is_admin && <span className="ml-2 bg-purple-200 text-purple-800 text-xs px-2 py-1 rounded">Admin</span>}
                </td>
                <td className="p-3 border text-gray-600">{u.email} <br/><span className="text-xs">{u.phone}</span></td>
                <td className="p-3 border text-green-700">{u.last_login}</td>
                <td className="p-3 border text-orange-700">{u.last_logout}</td>
                <td className="p-3 border font-bold text-blue-600 text-center">{u.reports_generated}</td>
                <td className="p-3 border space-x-2">
                  <button onClick={() => handleViewUser(u)} className="bg-blue-100 text-blue-700 px-3 py-1 rounded font-bold hover:bg-blue-200">History</button>
                  {!u.is_admin && (
                    <button onClick={() => handleDeleteUser(u.id, u.name)} className="bg-red-100 text-red-700 px-3 py-1 rounded font-bold hover:bg-red-200">Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- POPUP MODAL: SPECIFIC USER HISTORY --- */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto relative">
            <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 font-bold text-xl">X</button>
            
            <h2 className="text-2xl font-bold text-blue-800 mb-4">{selectedUser.name}'s Medical History</h2>
            
            {userHistory.length === 0 ? (
              <p className="text-gray-500">This user has not uploaded any reports yet.</p>
            ) : (
              <div className="space-y-4">
                {userHistory.map(job => (
                  <div key={job.id} className="border p-4 rounded bg-gray-50 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Uploaded: {new Date(job.uploaded_at).toLocaleString()}</p>
                      <p className="font-bold text-gray-700">Language: {job.target_language}</p>
                    </div>
                    <span className={`px-3 py-1 rounded font-bold text-sm ${job.status === 'COMPLETED' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}