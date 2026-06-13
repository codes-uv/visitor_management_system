// Digital Visitor Management System - Dummy Data
const DVMS = (() => {
  const STORAGE_KEY = 'dvms_data_v1';

  const defaultData = {
    visitors: [
      { id: 'V1001', name: 'Aarav Sharma', mobile: '9876543210', address: 'MG Road, Bengaluru', purpose: 'Interview', personToMeet: 'HR Manager', checkIn: '2026-06-13T09:15:00', checkOut: null, status: 'active', photo: 'https://i.pravatar.cc/150?u=aarav' },
      { id: 'V1002', name: 'Priya Patel', mobile: '9123456789', address: 'Satellite, Ahmedabad', purpose: 'Delivery', personToMeet: 'Reception', checkIn: '2026-06-13T08:45:00', checkOut: '2026-06-13T09:30:00', status: 'completed', photo: 'https://i.pravatar.cc/150?u=priya' },
      { id: 'V1003', name: 'Rohan Mehta', mobile: '9988776655', address: 'Andheri, Mumbai', purpose: 'Client Meeting', personToMeet: 'Ankit Verma', checkIn: '2026-06-13T10:00:00', checkOut: null, status: 'active', photo: 'https://i.pravatar.cc/150?u=rohan' },
      { id: 'V1004', name: 'Sneha Reddy', mobile: '9012345678', address: 'Hitech City, Hyderabad', purpose: 'Maintenance', personToMeet: 'Facilities', checkIn: '2026-06-12T14:20:00', checkOut: '2026-06-12T16:00:00', status: 'completed', photo: 'https://i.pravatar.cc/150?u=sneha' },
      { id: 'V1005', name: 'Vikram Singh', mobile: '9876501234', address: 'Connaught Place, Delhi', purpose: 'Vendor Discussion', personToMeet: 'Procurement Head', checkIn: '2026-06-13T11:30:00', checkOut: null, status: 'active', photo: 'https://i.pravatar.cc/150?u=vikram' },
      { id: 'V1006', name: 'Ananya Das', mobile: '8765432109', address: 'Salt Lake, Kolkata', purpose: 'Interview', personToMeet: 'Tech Lead', checkIn: '2026-06-12T10:00:00', checkOut: '2026-06-12T11:15:00', status: 'completed', photo: 'https://i.pravatar.cc/150?u=ananya' },
      { id: 'V1007', name: 'Karan Joshi', mobile: '7654321098', address: 'Baner, Pune', purpose: 'Personal', personToMeet: 'Rahul Kapoor', checkIn: '2026-06-11T15:45:00', checkOut: '2026-06-11T16:30:00', status: 'completed', photo: 'https://i.pravatar.cc/150?u=karan' },
      { id: 'V1008', name: 'Ishita Gupta', mobile: '9345678901', address: 'Gomti Nagar, Lucknow', purpose: 'Audit', personToMeet: 'Finance Director', checkIn: '2026-06-13T09:50:00', checkOut: null, status: 'active', photo: 'https://i.pravatar.cc/150?u=ishita' },
    ],
    blacklist: [
      { id: 'B001', name: 'Rakesh Malhotra', mobile: '9999988888', reason: 'Security violation - unauthorized access', addedOn: '2026-05-20', addedBy: 'Security Admin' },
      { id: 'B002', name: 'Suresh Kumar', mobile: '8888877777', reason: 'Repeated no-show and misbehavior', addedOn: '2026-04-15', addedBy: 'Reception' },
    ],
    history: [
      { visitorId: 'V1002', name: 'Priya Patel', visits: 5 },
      { visitorId: 'V1004', name: 'Sneha Reddy', visits: 12 },
      { visitorId: 'V1003', name: 'Rohan Mehta', visits: 3 },
    ]
  };

  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return defaultData;
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  return {
    getData: load,
    saveData: save,
    generateId: () => 'V' + Math.floor(1000 + Math.random() * 9000),
    today: () => new Date().toISOString().split('T')[0]
  };
})();