// Digital Visitor Management System - Dummy Data v2
const DVMS = (() => {
  const STORAGE_KEY = 'dvms_data_v2';

  const defaultData = {
    visitors: [
      { 
        id: 'V1001', passId: 'PASS-20260613-1001', name: 'Aarav Sharma', mobile: '9876543210', address: 'MG Road, Bengaluru', 
        purpose: 'Interview', personToMeet: 'HR Manager', 
        checkIn: '2026-06-13T09:15:00', checkOut: null, status: 'active', 
        expectedDuration: 60, // minutes
        photo: 'https://i.pravatar.cc/150?u=aarav',
        visitHistory: [
          { checkIn: '2026-06-13T09:15:00', checkOut: null, purpose: 'Interview' }
        ]
      },
      { 
        id: 'V1002', passId: 'PASS-20260613-1002', name: 'Priya Patel', mobile: '9123456789', address: 'Satellite, Ahmedabad', 
        purpose: 'Delivery', personToMeet: 'Reception', 
        checkIn: '2026-06-13T08:45:00', checkOut: '2026-06-13T09:30:00', status: 'completed',
        expectedDuration: 30,
        photo: 'https://i.pravatar.cc/150?u=priya',
        visitHistory: [
          { checkIn: '2026-06-10T10:00:00', checkOut: '2026-06-10T10:25:00', purpose: 'Delivery' },
          { checkIn: '2026-06-13T08:45:00', checkOut: '2026-06-13T09:30:00', purpose: 'Delivery' }
        ]
      },
      { 
        id: 'V1003', passId: 'PASS-20260613-1003', name: 'Rohan Mehta', mobile: '9988776655', address: 'Andheri, Mumbai', 
        purpose: 'Client Meeting', personToMeet: 'Ankit Verma', 
        checkIn: '2026-06-13T07:00:00', checkOut: null, status: 'active',
        expectedDuration: 120,
        photo: 'https://i.pravatar.cc/150?u=rohan',
        visitHistory: [
          { checkIn: '2026-06-13T07:00:00', checkOut: null, purpose: 'Client Meeting' }
        ]
      },
      { 
        id: 'V1004', passId: 'PASS-20260612-1004', name: 'Sneha Reddy', mobile: '9012345678', address: 'Hitech City, Hyderabad', 
        purpose: 'Maintenance', personToMeet: 'Facilities', 
        checkIn: '2026-06-12T14:20:00', checkOut: '2026-06-12T16:00:00', status: 'completed',
        expectedDuration: 120,
        photo: 'https://i.pravatar.cc/150?u=sneha',
        visitHistory: [
          { checkIn: '2026-06-12T14:20:00', checkOut: '2026-06-12T16:00:00', purpose: 'Maintenance' }
        ]
      },
      { 
        id: 'V1005', passId: 'PASS-20260613-1005', name: 'Vikram Singh', mobile: '9876501234', address: 'Connaught Place, Delhi', 
        purpose: 'Guest', personToMeet: 'CEO', 
        checkIn: '2026-06-13T11:30:00', checkOut: null, status: 'active',
        expectedDuration: 240,
        photo: 'https://i.pravatar.cc/150?u=vikram',
        visitHistory: [
          { checkIn: '2026-06-13T11:30:00', checkOut: null, purpose: 'Guest' }
        ]
      },
    ],
    blacklist: [
      { id: 'B001', name: 'Rakesh Malhotra', mobile: '9999988888', reason: 'Security violation', addedOn: '2026-05-20', addedBy: 'Security Admin' },
      { id: 'B002', name: 'Suresh Kumar', mobile: '8888877777', reason: 'Repeated misbehavior', addedOn: '2026-04-15', addedBy: 'Reception' },
    ]
  };

  function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // Migration for old data
      data.visitors.forEach(v => {
        if (!v.passId) v.passId = generatePassId();
        if (!v.expectedDuration) v.expectedDuration = 60;
        if (!v.visitHistory) v.visitHistory = [{ checkIn: v.checkIn, checkOut: v.checkOut, purpose: v.purpose }];
      });
      return data;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return defaultData;
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function generatePassId() {
    const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `PASS-${date}-${rand}`;
  }

  return {
    getData: load,
    saveData: save,
    generateId: () => 'V' + Math.floor(1000 + Math.random() * 9000),
    generatePassId,
    today: () => new Date().toISOString().split('T')[0]
  };
})();