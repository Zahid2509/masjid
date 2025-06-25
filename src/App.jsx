import React, { useState, useEffect } from 'react';
import { UserPlus, CheckSquare, BarChart2, History, Landmark, Trash, Pencil, BarChartBig, Download, MessageSquare, Smartphone, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import * as XLSX from 'xlsx';

const LOCAL_STORAGE_PEOPLE_KEY = 'imliwali_people';
const LOCAL_STORAGE_ATTENDANCE_KEY = 'imliwali_attendance';

const NAMAZES = [
  'Fajr',
  'Zuhr',
  'Asr',
  'Maghrib',
  'Isha',
];

// Distinct colors for each namaz
const NAMAZ_COLORS = {
  Fajr: '#22c55e',      // green
  Zuhr: '#3b82f6',     // blue
  Asr: '#f59e42',      // orange
  Maghrib: '#a855f7',  // purple
  Isha: '#ef4444',     // red
  Jumuah: '#fbbf24',   // gold/yellow
};

function getToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function isFriday(dateStr) {
  const d = new Date(dateStr);
  return d.getDay() === 5; // 5 = Friday
}

function getInitialPeople() {
  const data = localStorage.getItem(LOCAL_STORAGE_PEOPLE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
}

function getInitialAttendance() {
  const data = localStorage.getItem(LOCAL_STORAGE_ATTENDANCE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return {};
}

const TABS = [
  { key: 'add', label: 'Add New Person', icon: UserPlus },
  { key: 'attendance', label: 'Mark Attendance for Today', icon: CheckSquare },
  { key: 'dashboard', label: 'Dashboard Stats', icon: BarChart2 },
  { key: 'history', label: 'Attendance History', icon: History },
  { key: 'graph', label: 'Attendance Graph', icon: BarChartBig },
  { key: 'absent', label: 'Absent more than 3 days', icon: AlertCircle },
];

// Notification message template
const getNotificationMessage = (person) =>
  `Assalamu Alaikum ${person.name},\nWelcome to Imli wali masjid!\nAap masjid rozana nahi aa rahe hai namaz ke liye.  Toh apni  haazri rozana dene ki koshish kre.`;

function App() {
  const [people, setPeople] = useState(getInitialPeople());
  const [attendance, setAttendance] = useState(getInitialAttendance());
  const [form, setForm] = useState({ name: '', mobile: '', address: '' });
  const [error, setError] = useState('');
  const [attendancePage, setAttendancePage] = useState(1);
  const [activeTab, setActiveTab] = useState('add');
  const PAGE_SIZE = 10;
  const [peoplePage, setPeoplePage] = useState(1);
  const [peopleSearch, setPeopleSearch] = useState('');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Filtered People List
  const filteredPeople = people.filter(p =>
    p.name.toLowerCase().includes(peopleSearch.toLowerCase()) ||
    p.mobile.toLowerCase().includes(peopleSearch.toLowerCase()) ||
    (p.address || '').toLowerCase().includes(peopleSearch.toLowerCase())
  );
  const totalPeoplePages = Math.ceil(filteredPeople.length / PAGE_SIZE);
  const paginatedPeopleList = filteredPeople.slice((peoplePage - 1) * PAGE_SIZE, peoplePage * PAGE_SIZE);

  // Filtered Attendance List
  const filteredAttendancePeople = people.filter(p =>
    p.name.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
    p.mobile.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
    (p.address || '').toLowerCase().includes(attendanceSearch.toLowerCase())
  );
  const totalAttendancePages = Math.ceil(filteredAttendancePeople.length / PAGE_SIZE);
  const paginatedAttendancePeople = filteredAttendancePeople.slice((attendancePage - 1) * PAGE_SIZE, attendancePage * PAGE_SIZE);

  const today = getToday();
  const isTodayFriday = isFriday(today);
  const todayNamazes = isTodayFriday ? [...NAMAZES, 'Jumuah'] : NAMAZES;
  const [editPersonId, setEditPersonId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', mobile: '', address: '' });
  const [deletePersonId, setDeletePersonId] = useState(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PEOPLE_KEY, JSON.stringify(people));
  }, [people]);
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_ATTENDANCE_KEY, JSON.stringify(attendance));
  }, [attendance]);

  // Add person logic
  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleAddPerson = (e) => {
    e.preventDefault();
    setError('');
    const name = form.name.trim();
    const mobile = form.mobile.trim();
    const address = form.address.trim();
    // Validation
    if (!name || !mobile) {
      setError('Name and mobile number are required.');
      return;
    }
    if (!/^[0-9]{7,15}$/.test(mobile)) {
      setError('Please enter a valid mobile number (7-15 digits).');
      return;
    }
    if (people.some(p => p.mobile === mobile)) {
      setError('A person with this mobile number already exists.');
      return;
    }
    setPeople([
      ...people,
      {
        id: Date.now().toString(),
        name,
        mobile,
        address,
      },
    ]);
    setForm({ name: '', mobile: '', address: '' });
  };

  // Attendance marking logic
  const handleAttendanceChange = (personId, namaz, checked) => {
    setAttendance(prev => {
      const day = prev[today] ? { ...prev[today] } : {};
      const personAttendance = day[personId] ? { ...day[personId] } : {};
      personAttendance[namaz] = checked;
      day[personId] = personAttendance;
      return { ...prev, [today]: day };
    });
  };

  // Dashboard stats
  const totalPeople = people.length;
  const todayAttendance = attendance[today] || {};
  const namazStats = {};
  todayNamazes.forEach(namaz => {
    namazStats[namaz] = people.filter(p => todayAttendance[p.id]?.[namaz]).length;
  });
  const allPresentToday = people.filter(p => todayNamazes.every(namaz => todayAttendance[p.id]?.[namaz]));

  // Always present logic
  const allDates = Object.keys(attendance).sort();
  const alwaysPresent = people.filter(person => {
    return allDates.length > 0 && allDates.every(date => {
      const day = attendance[date] || {};
      const isFri = isFriday(date);
      const namazes = isFri ? [...NAMAZES, 'Jumuah'] : NAMAZES;
      return namazes.every(namaz => day[person.id]?.[namaz]);
    });
  });

  // Prepare attendance data for graph
  const attendanceGraphData = allDates.map(date => {
    const day = attendance[date] || {};
    let totalPresent = 0;
    people.forEach(person => {
      const isFri = isFriday(date);
      const namazes = isFri ? [...NAMAZES, 'Jumuah'] : NAMAZES;
      if (namazes.some(namaz => day[person.id]?.[namaz])) {
        totalPresent++;
      }
    });
    return { date, totalPresent };
  });

  // Prepare attendance data for grouped bar chart (namaz-wise)
  const attendanceGraphNamazData = allDates.map(date => {
    const isFri = isFriday(date);
    const namazes = isFri ? [...NAMAZES, 'Jumuah'] : NAMAZES;
    const day = attendance[date] || {};
    const row = { date };
    namazes.forEach(namaz => {
      row[namaz] = people.filter(p => day[p.id]?.[namaz]).length;
    });
    return row;
  });

  // Excel export logic
  const handleDownloadExcel = () => {
    // Prepare data: one row per person per date, with columns for each namaz
    const rows = [];
    allDates.forEach(date => {
      const isFri = isFriday(date);
      const namazes = isFri ? [...NAMAZES, 'Jumuah'] : NAMAZES;
      people.forEach(person => {
        const row = {
          Date: date,
          Name: person.name,
          Mobile: person.mobile,
          Address: person.address,
        };
        namazes.forEach(namaz => {
          row[namaz] = attendance[date]?.[person.id]?.[namaz] ? 'Present' : 'Absent';
        });
        // Total absent for this row (day)
        row['Total Absent Namaz'] = namazes.filter(namaz => !attendance[date]?.[person.id]?.[namaz]).length;
        rows.push(row);
      });
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    const todayStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `attendance-${todayStr}.xlsx`);
  };

  // Handle Excel upload for restore
  const handleUploadExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      // Parse people and attendance
      const newPeople = [];
      const newAttendance = {};
      rows.forEach(row => {
        // Person
        let person = newPeople.find(p => p.mobile === row.Mobile);
        if (!person) {
          person = {
            id: row.Mobile + '_' + row.Name,
            name: row.Name,
            mobile: row.Mobile,
            address: row.Address || '',
          };
          newPeople.push(person);
        }
        // Attendance
        const date = row.Date;
        if (!newAttendance[date]) newAttendance[date] = {};
        if (!newAttendance[date][person.id]) newAttendance[date][person.id] = {};
        Object.keys(row).forEach(key => {
          if (["Fajr", "Zuhr", "Asr", "Maghrib", "Isha", "Jumuah"].includes(key)) {
            newAttendance[date][person.id][key] = row[key] === 'Present';
          }
        });
      });
      setPeople(newPeople);
      setAttendance(newAttendance);
      setPeoplePage(1);
      setError('');
    };
    reader.readAsArrayBuffer(file);
  };

  // Calculate absent > 3 days
  const absentPeople = people.map(person => {
    let absentDates = [];
    allDates.forEach(date => {
      const isFri = isFriday(date);
      const namazes = isFri ? [...NAMAZES, 'Jumuah'] : NAMAZES;
      const day = attendance[date]?.[person.id] || {};
      // Absent if not present for any namaz that day
      const presentAny = namazes.some(namaz => day[namaz]);
      if (!presentAny) absentDates.push(date);
    });
    return { ...person, absentCount: absentDates.length, absentDates };
  }).filter(p => p.absentCount > 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-200">
      {/* Header with Logo */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-8 flex flex-col items-center py-6 sm:py-8">
          <div className="flex flex-col items-center w-full">
            <div className="flex flex-col sm:flex-row items-center sm:space-x-4 mb-2 space-y-2 sm:space-y-0">
              {/* Masjid SVG Logo */}
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-100 shadow">
                <Landmark className="w-10 h-10 text-primary-600" />
              </span>
              <span>
                <h1 className="text-4xl font-extrabold text-primary-700 tracking-tight">Imli wali masjid</h1>
                <p className="text-gray-600 text-base font-medium">Admin Panel</p>
              </span>
            </div>
            <p className="text-gray-500 text-sm">Add and manage people you meet every day</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-10">
        {/* Tab Bar */}
        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8 border-b-2 border-primary-100">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`flex items-center space-x-2 px-5 py-2 font-semibold border-b-4 transition-all duration-200 focus:outline-none ${activeTab === tab.key ? 'border-primary-600 text-primary-700 bg-primary-50 shadow' : 'border-transparent text-gray-500 hover:text-primary-600 hover:bg-primary-100'}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon className="w-5 h-5 mr-1" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'add' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-8 animate-fadein animated-card">
            <h2 className="text-2xl font-bold mb-4 text-primary-700 flex items-center"><UserPlus className="w-6 h-6 mr-2 text-primary-500" />Add New Person</h2>
            <form className="space-y-4" onSubmit={handleAddPerson}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile Number *</label>
                <input
                  type="text"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition font-semibold shadow animated-btn"
                >
                  <UserPlus className="w-5 h-5 inline-block mr-1" /> Add Person
                </button>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-semibold shadow animated-btn"
                  onClick={() => {
                    setForm({ name: '', mobile: '', address: '' });
                    setError('');
                  }}
                >
                  Clear
                </button>
                <label className="bg-primary-100 text-primary-700 px-6 py-2 rounded-lg hover:bg-primary-200 transition font-semibold shadow cursor-pointer animated-btn">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={handleUploadExcel}
                  />
                  Upload Existing Data
                </label>
              </div>
            </form>
            {/* People List */}
            <div className="mt-8 sm:mt-10">
              <h2 className="text-lg font-semibold mb-2 text-primary-700">People List</h2>
              {people.length === 0 ? (
                <p className="text-gray-500">No people added yet.</p>
              ) : (
                <>
                  <div className="mb-3 flex items-center">
                    <input
                      type="text"
                      placeholder="Search by name, mobile, or address..."
                      className="w-full sm:w-96 border border-gray-300 rounded-md p-3 text-base focus:ring-primary-500 focus:border-primary-500"
                      value={peopleSearch}
                      onChange={e => {
                        setPeopleSearch(e.target.value);
                        setPeoplePage(1);
                      }}
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden shadow-sm text-xs sm:text-sm">
                      <thead className="bg-primary-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Mobile</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Address</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-primary-700 uppercase tracking-wider">Edit</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-primary-700 uppercase tracking-wider">Delete</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-primary-700 uppercase tracking-wider">Notify</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {paginatedPeopleList.map(person => (
                          <tr key={person.id} className="hover:bg-primary-50 transition">
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{editPersonId === person.id ? (
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                className="border border-gray-300 rounded p-1 w-28"
                              />
                            ) : person.name}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{editPersonId === person.id ? (
                              <input
                                type="text"
                                value={editForm.mobile}
                                onChange={e => setEditForm({ ...editForm, mobile: e.target.value })}
                                className="border border-gray-300 rounded p-1 w-28"
                              />
                            ) : person.mobile}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{editPersonId === person.id ? (
                              <input
                                type="text"
                                value={editForm.address}
                                onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                className="border border-gray-300 rounded p-1 w-32"
                              />
                            ) : person.address}</td>
                            <td className="px-4 py-2 text-center">
                              {editPersonId === person.id ? (
                                <>
                                  <button
                                    className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50 transition mr-1 animated-btn"
                                    title="Save"
                                    onClick={() => {
                                      // Save edit
                                      if (!editForm.name.trim() || !editForm.mobile.trim()) return;
                                      setPeople(people.map(p => p.id === person.id ? { ...p, ...editForm } : p));
                                      setEditPersonId(null);
                                    }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition animated-btn"
                                    title="Cancel"
                                    onClick={() => setEditPersonId(null)}
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  className="text-primary-600 hover:text-primary-800 p-1 rounded-full hover:bg-primary-50 transition animated-btn"
                                  title="Edit person"
                                  onClick={() => {
                                    setEditPersonId(person.id);
                                    setEditForm({ name: person.name, mobile: person.mobile, address: person.address });
                                  }}
                                >
                                  <Pencil className="w-5 h-5" />
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition animated-btn"
                                title="Delete person"
                                onClick={() => setDeletePersonId(person.id)}
                              >
                                <Trash className="w-5 h-5" />
                              </button>
                            </td>
                            <td className="px-4 py-2 text-center flex gap-1 justify-center">
                              <button
                                className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50 transition animated-btn"
                                title="Send WhatsApp"
                                onClick={() => {
                                  const msg = encodeURIComponent(getNotificationMessage(person));
                                  window.open(`https://wa.me/91${person.mobile}?text=${msg}`, '_blank');
                                }}
                              >
                                <MessageSquare className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination Controls for People List */}
                  <div className="flex items-center justify-between mt-4">
                    <button
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 disabled:opacity-50 animated-btn"
                      onClick={() => setPeoplePage(p => Math.max(1, p - 1))}
                      disabled={peoplePage === 1}
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {peoplePage} of {totalPeoplePages}
                    </span>
                    <button
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 disabled:opacity-50 animated-btn"
                      onClick={() => setPeoplePage(p => Math.min(totalPeoplePages, p + 1))}
                      disabled={peoplePage === totalPeoplePages}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-8 animate-fadein animated-card">
            <h2 className="text-2xl font-bold mb-4 text-primary-700 flex items-center"><CheckSquare className="w-6 h-6 mr-2 text-primary-500" />Mark Attendance for Today ({today})</h2>
            {people.length === 0 ? (
              <p className="text-gray-500">No people to mark attendance for.</p>
            ) : (
              <>
                <div className="mb-3 flex items-center">
                  <input
                    type="text"
                    placeholder="Search by name, mobile, or address..."
                    className="w-full sm:w-96 border border-gray-300 rounded-md p-3 text-base focus:ring-primary-500 focus:border-primary-500"
                    value={attendanceSearch}
                    onChange={e => {
                      setAttendanceSearch(e.target.value);
                      setAttendancePage(1);
                    }}
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden shadow-sm text-xs sm:text-sm">
                    <thead className="bg-primary-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Name</th>
                        {todayNamazes.map(namaz => (
                          <th key={namaz} className="px-4 py-2 text-center text-xs font-medium text-primary-700 uppercase tracking-wider">{namaz}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {paginatedAttendancePeople.map(person => (
                        <tr key={person.id} className="hover:bg-primary-50 transition">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{person.name}</td>
                          {todayNamazes.map(namaz => (
                            <td key={namaz} className="px-4 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={!!todayAttendance[person.id]?.[namaz]}
                                onChange={e => handleAttendanceChange(person.id, namaz, e.target.checked)}
                                className="w-5 h-5 text-primary-600 focus:ring-primary-500 checked:bg-primary-600 border-gray-300 rounded"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination Controls */}
                <div className="flex items-center justify-between mt-4">
                  <button
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 disabled:opacity-50 animated-btn"
                    onClick={() => setAttendancePage(p => Math.max(1, p - 1))}
                    disabled={attendancePage === 1}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {attendancePage} of {totalAttendancePages}
                  </span>
                  <button
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 disabled:opacity-50 animated-btn"
                    onClick={() => setAttendancePage(p => Math.min(totalAttendancePages, p + 1))}
                    disabled={attendancePage === totalAttendancePages}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-8 animate-fadein animated-card">
            <h2 className="text-2xl font-bold mb-4 text-primary-700 flex items-center"><BarChart2 className="w-6 h-6 mr-2 text-primary-500" />Dashboard Stats</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded bg-primary-50 text-primary-800 font-semibold shadow">Total People: {totalPeople}</div>
              <div className="p-4 rounded bg-success-50 text-success-800 font-semibold shadow">Attended All Namaz Today: {allPresentToday.length}</div>
              {todayNamazes.map(namaz => (
                <div key={namaz} className="p-4 rounded bg-gray-50 text-gray-800 font-semibold shadow">{namaz}: {namazStats[namaz]}</div>
              ))}
              <div className="p-4 rounded bg-warning-50 text-warning-800 font-semibold shadow">Always Present: {alwaysPresent.length}</div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-8 animate-fadein animated-card">
            <h2 className="text-2xl font-bold mb-4 text-primary-700 flex items-center"><History className="w-6 h-6 mr-2 text-primary-500" />Attendance History</h2>
            {people.length === 0 || allDates.length === 0 ? (
              <p className="text-gray-500">No attendance history yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs rounded-lg overflow-hidden shadow-sm">
                  <thead className="bg-primary-50">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium text-primary-700 uppercase tracking-wider">Date</th>
                      {people.map(person => (
                        <th key={person.id} className="px-2 py-2 text-center font-medium text-primary-700 uppercase tracking-wider">{person.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {allDates.map(date => {
                      const isFri = isFriday(date);
                      const namazes = isFri ? [...NAMAZES, 'Jumuah'] : NAMAZES;
                      return namazes.map((namaz, i) => (
                        <tr key={date + namaz}>
                          <td className="px-2 py-2 whitespace-nowrap text-gray-900 font-semibold">{date} <span className="text-gray-500">{namaz}</span></td>
                          {people.map(person => (
                            <td key={person.id} className="px-2 py-2 text-center">
                              {attendance[date]?.[person.id]?.[namaz]
                                ? '✔️'
                                : <span className="text-red-500">❌</span>}
                            </td>
                          ))}
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'graph' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-8 animate-fadein animated-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-primary-700 flex items-center"><BarChartBig className="w-6 h-6 mr-2 text-primary-500" />Attendance Graph</h2>
              <button
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold shadow animated-btn"
                onClick={handleDownloadExcel}
              >
                <Download className="w-5 h-5 mr-1" /> Download Excel
              </button>
            </div>
            {attendanceGraphNamazData.length === 0 ? (
              <p className="text-gray-500">No attendance data to display.</p>
            ) : (
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={attendanceGraphNamazData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Legend />
                  {NAMAZES.map(namaz => (
                    <Bar
                      key={namaz}
                      dataKey={namaz}
                      fill={NAMAZ_COLORS[namaz]}
                      name={namaz}
                      stackId={undefined}
                    />
                  ))}
                  {/* Jumuah bar for Fridays only */}
                  <Bar dataKey="Jumuah" fill={NAMAZ_COLORS.Jumuah} name="Jumuah (Friday)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {activeTab === 'absent' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-8 animate-fadein animated-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-primary-700 flex items-center"><AlertCircle className="w-6 h-6 mr-2 text-primary-500" />Absent more than 3 days</h2>
              {/* Bulk Notify button hidden as per request */}
            </div>
            {absentPeople.length === 0 ? (
              <p className="text-gray-500">No one has been absent for more than 3 days.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden shadow-sm text-xs sm:text-sm">
                  <thead className="bg-primary-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Mobile</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Address</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-primary-700 uppercase tracking-wider">Absent Days</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-primary-700 uppercase tracking-wider">Absent Dates</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-primary-700 uppercase tracking-wider">Notify</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {absentPeople.map(person => (
                      <tr key={person.id} className="hover:bg-primary-50 transition">
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{person.name}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{person.mobile}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{person.address}</td>
                        <td className="px-4 py-2 text-center text-sm text-red-700 font-bold">{person.absentCount}</td>
                        <td className="px-4 py-2 text-xs text-gray-700">{person.absentDates.join(', ')}</td>
                        <td className="px-4 py-2 text-center">
                          <button
                            className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50 transition animated-btn"
                            title="Send WhatsApp"
                            onClick={() => {
                              const msg = encodeURIComponent(getNotificationMessage(person));
                              window.open(`https://wa.me/91${person.mobile}?text=${msg}`, '_blank');
                            }}
                          >
                            <MessageSquare className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deletePersonId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadein">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80 max-w-full animate-slidein-up">
            <h3 className="text-lg font-bold mb-2 text-red-700">Delete Person?</h3>
            <p className="mb-4 text-gray-700 text-sm">Are you sure you want to delete this person? This will also remove their attendance records.</p>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => setDeletePersonId(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  setPeople(people.filter(p => p.id !== deletePersonId));
                  setAttendance(prev => {
                    const newAttendance = {};
                    for (const date in prev) {
                      const day = { ...prev[date] };
                      delete day[deletePersonId];
                      newAttendance[date] = day;
                    }
                    return newAttendance;
                  });
                  setDeletePersonId(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Notify Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadein">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg animate-slidein-up">
            <h3 className="text-lg font-bold mb-4 text-primary-700 flex items-center"><MessageSquare className="w-5 h-5 mr-2 text-primary-500" />Bulk WhatsApp Notification</h3>
            <p className="mb-4 text-gray-700 text-sm">Send WhatsApp messages to the following absent people:</p>
            <div className="max-h-64 overflow-y-auto mb-4">
              <table className="min-w-full text-xs sm:text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-left font-medium text-primary-700">Name</th>
                    <th className="px-2 py-1 text-left font-medium text-primary-700">Mobile</th>
                    <th className="px-2 py-1 text-center font-medium text-primary-700">Send</th>
                  </tr>
                </thead>
                <tbody>
                  {absentPeople.map(person => (
                    <tr key={person.id}>
                      <td className="px-2 py-1 whitespace-nowrap">{person.name}</td>
                      <td className="px-2 py-1 whitespace-nowrap">{person.mobile}</td>
                      <td className="px-2 py-1 text-center">
                        <button
                          className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-50 transition animated-btn"
                          title="Send WhatsApp"
                          onClick={() => {
                            const msg = encodeURIComponent(getNotificationMessage(person));
                            window.open(`https://wa.me/91${person.mobile}?text=${msg}`, '_blank');
                          }}
                        >
                          <MessageSquare className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 animated-btn"
                onClick={() => setShowBulkModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700 animated-btn"
                onClick={() => {
                  absentPeople.forEach(person => {
                    const msg = encodeURIComponent(getNotificationMessage(person));
                    window.open(`https://wa.me/91${person.mobile}?text=${msg}`, '_blank');
                  });
                  setShowBulkModal(false);
                }}
              >
                Send All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 