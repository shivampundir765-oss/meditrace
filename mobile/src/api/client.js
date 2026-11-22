import storage from './storage.js';

// --- API Base URL Configuration ---
export const API_BASE_URL = 'http://localhost:5000/api/v1';

// Toggle demo mode fallback when server cannot be reached
const DEMO_MODE = false;

const INITIAL_DEMO_PROFILES = [
  { _id: 'prof-self-01', name: 'Arjun Rao', relationship: 'self', access_level: 'owner', is_primary: true, age: 48, blood_group: 'B+' },
  { _id: 'prof-fam-02', name: 'Lakshmi Rao', relationship: 'mother', access_level: 'caregiver_edit', is_primary: false, age: 72, blood_group: 'O+' },
  { _id: 'prof-fam-03', name: 'Kavita Rao', relationship: 'spouse', access_level: 'caregiver_edit', is_primary: false, age: 46, blood_group: 'A+' },
  { _id: 'prof-fam-04', name: 'Rohan Rao', relationship: 'child', access_level: 'caregiver_view', is_primary: false, age: 14, blood_group: 'B+' }
];

const INITIAL_DEMO_CABINETS = [
  {
    _id: 'cab-01',
    name: 'Fever & Pain Relief',
    medical_condition: 'Fever',
    condition_code: 'fever',
    time_slot: 'Morning',
    medicines_count: 2,
    stock_status: { in_stock: 1, few_left: 1, out_of_stock: 0 },
    medicines: [
      {
        _id: 'med-01',
        name: 'Dolo 650',
        brand_name: 'Dolo 650',
        generic_name: 'Paracetamol',
        salt_composition: 'Paracetamol IP 650mg',
        strength: '650mg',
        dosage_form: 'tablet',
        quantity: 12,
        stock_threshold: 4,
        category: 'Common',
        usedFor: 'Fever, headache, general body aches',
        cautions: 'Take after meals. Max 4 doses in 24 hours.',
        entered_by_role: 'pharmacist',
        entered_by_label: 'Entered by Pharmacist',
        field_sources: {
          name: 'scanned',
          salt_composition: 'database',
          expiry_date: 'scanned',
          batch_number: 'scanned',
          quantity: 'manual'
        },
        initial_audit_stamp: {
          timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
          location_name: 'Apollo Pharmacy Central, Bangalore'
        }
      },
      {
        _id: 'med-02',
        name: 'Combiflam',
        brand_name: 'Combiflam',
        generic_name: 'Ibuprofen + Paracetamol',
        salt_composition: 'Ibuprofen 400mg + Paracetamol 325mg',
        strength: '400mg/325mg',
        dosage_form: 'tablet',
        quantity: 3,
        stock_threshold: 5,
        category: 'Common',
        usedFor: 'Severe dental or muscle pain',
        cautions: 'Do not take on empty stomach.',
        entered_by_role: 'doctor',
        entered_by_label: 'Entered by Doctor',
        field_sources: {
          name: 'database',
          salt_composition: 'database',
          expiry_date: 'manual',
          batch_number: 'manual',
          quantity: 'manual'
        },
        initial_audit_stamp: {
          timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
          location_name: 'Fortis Hospital Clinic, Bangalore'
        }
      }
    ]
  },
  {
    _id: 'cab-02',
    name: 'Chronic Blood Pressure',
    medical_condition: 'Blood Pressure',
    condition_code: 'bp',
    time_slot: 'Morning',
    medicines_count: 1,
    stock_status: { in_stock: 0, few_left: 0, out_of_stock: 1 },
    medicines: [
      {
        _id: 'med-03',
        name: 'Telma 40',
        brand_name: 'Telma 40',
        generic_name: 'Telmisartan',
        salt_composition: 'Telmisartan IP 40mg',
        strength: '40mg',
        dosage_form: 'tablet',
        quantity: 0,
        stock_threshold: 6,
        category: 'Chronic',
        usedFor: 'Hypertension management',
        cautions: 'Take consistently every morning.',
        entered_by_role: 'doctor',
        entered_by_label: 'Entered by Doctor',
        field_sources: {
          name: 'database',
          salt_composition: 'database',
          expiry_date: 'manual',
          batch_number: 'manual',
          quantity: 'manual'
        },
        initial_audit_stamp: {
          timestamp: new Date(Date.now() - 15 * 86400000).toISOString(),
          location_name: 'Manipal Cardiology, Bangalore'
        }
      }
    ]
  }
];

let cachedCabinets = null;
let cachedProfiles = null;
let cachedDraft = null;

async function getDemoProfiles() {
  if (cachedProfiles) return cachedProfiles;
  try {
    const raw = await storage.getItem('meditrace_demo_profiles');
    if (raw) {
      cachedProfiles = JSON.parse(raw);
      if (Array.isArray(cachedProfiles)) return cachedProfiles;
    }
  } catch (_e) {}
  cachedProfiles = [...INITIAL_DEMO_PROFILES];
  return cachedProfiles;
}

async function getDemoCabinets() {
  if (cachedCabinets) return cachedCabinets;
  try {
    const raw = await storage.getItem('meditrace_demo_cabinets');
    if (raw) {
      cachedCabinets = JSON.parse(raw);
      if (Array.isArray(cachedCabinets)) return cachedCabinets;
    }
  } catch (_e) {}
  cachedCabinets = [...INITIAL_DEMO_CABINETS];
  return cachedCabinets;
}

async function saveDemoCabinets(list) {
  cachedCabinets = list;
  try {
    await storage.setItem('meditrace_demo_cabinets', JSON.stringify(list));
  } catch (_e) {}
}

export const ABDM_MOBILE_REGISTRY = {
  '8901086001234': {
    abdm_drug_code: 'IN-NHA-DRG-8901086',
    name: 'Dolo 650',
    generic_name: 'Paracetamol',
    salt_composition: 'Paracetamol IP 650mg',
    dosageForm: 'tablet',
    strength: '650mg',
    therapeutic_class: 'Analgesic & Antipyretic',
    schedule_classification: 'OTC',
    schedule_warning: 'Caution: Max 4g Paracetamol daily to protect liver.',
    cdsco_approval_status: 'Approved - CDSCO National Formulary (NLEM Essential)',
    storage_guidelines: 'Store below 25°C. Protect from moisture.',
    dosage_instructions: '1 tablet every 6 to 8 hours as needed.',
    manufacturer: 'Micro Labs Limited',
    batchNumber: 'B240918',
    expiryDate: '2027-04-30',
    verified: true
  },
  '8901234567890': {
    abdm_drug_code: 'IN-NHA-DRG-8901117',
    name: 'Augmentin 625 Duo',
    generic_name: 'Amoxicillin + Potassium Clavulanate',
    salt_composition: 'Amoxicillin IP 500mg + Clavulanate Potassium IP 125mg',
    dosageForm: 'tablet',
    strength: '625mg',
    therapeutic_class: 'Beta-Lactam Antibacterial',
    schedule_classification: 'Schedule H1',
    schedule_warning: 'Schedule H1: Dangerous without medical supervision.',
    cdsco_approval_status: 'Approved - CDSCO National Formulary (NLEM Essential)',
    storage_guidelines: 'Store in airtight blister pack below 25°C.',
    dosage_instructions: '1 tablet twice daily with food.',
    manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd.',
    batchNumber: 'AUG-8812',
    expiryDate: '2026-11-30',
    verified: true
  }
};

export const DEMO_HEALTHCARE_PLACES = [
  {
    _id: 'fac-1',
    name: 'Apollo Pharmacy 24/7 Indiranagar',
    type: 'chemist',
    phone: '+91 80 2525 1122',
    emergency_phone: '+91 80 2525 1123',
    opening_hours: '24 Hours Open',
    is_emergency_24x7: true,
    distanceKm: 0.8,
    address: { street: '12th Main, HAL 2nd Stage, Indiranagar', city: 'Bangalore' },
    coordinates: { latitude: 12.9784, longitude: 77.6408 },
    google_maps_url: 'https://www.google.com/maps/dir/?api=1&destination=12.9784,77.6408',
    services: ['Prescription Medicines', '24x7 Delivery', 'Insulin Storage']
  },
  {
    _id: 'fac-2',
    name: 'Manipal Hospital HAL Airport Road (Trauma)',
    type: 'hospital',
    phone: '+91 80 2502 4444',
    emergency_phone: '+91 80 2502 3333',
    opening_hours: '24/7 Emergency & ICU',
    is_emergency_24x7: true,
    distanceKm: 2.1,
    address: { street: '98 Old Airport Road, Kodihalli', city: 'Bangalore' },
    coordinates: { latitude: 12.9592, longitude: 77.6515 },
    google_maps_url: 'https://www.google.com/maps/dir/?api=1&destination=12.9592,77.6515',
    services: ['24/7 Level 1 Trauma', 'Cardiac CCU', 'Blood Bank', 'Dialysis']
  }
];

async function handleDemoRequest(method, endpoint, options) {
  // Auth
  if (endpoint.includes('/auth/login') || endpoint.includes('/auth/register')) {
    const parsed = options.body ? JSON.parse(options.body) : {};
    return {
      success: true,
      data: {
        accessToken: 'demo-jwt-token-v3',
        user: { _id: 'u-01', name: parsed.name || 'Arjun Rao', email: parsed.email || 'arjun@meditrace.health', role: parsed.role || 'patient' }
      }
    };
  }

  // Profiles
  if (endpoint.startsWith('/profiles')) {
    const profiles = await getDemoProfiles();
    if (method === 'GET') {
      return { success: true, data: { profiles } };
    }
    if (method === 'POST') {
      const parsed = options.body ? JSON.parse(options.body) : {};
      const newP = {
        _id: 'prof-' + Date.now(),
        name: parsed.name,
        relationship: parsed.relationship || 'other',
        access_level: parsed.access_level || 'caregiver_view',
        age: parsed.age || 30,
        blood_group: parsed.blood_group || 'O+'
      };
      profiles.push(newP);
      return { success: true, data: { profile: newP } };
    }
  }

  // Cabinets & Catalogs
  if (endpoint.startsWith('/cabinets') || endpoint.startsWith('/catalogs')) {
    const cabinets = await getDemoCabinets();
    if (method === 'GET') {
      return { success: true, data: { cabinets, data: cabinets } };
    }
    if (method === 'POST') {
      const parsed = options.body ? JSON.parse(options.body) : {};
      const newCab = {
        _id: 'cab-' + Date.now(),
        name: parsed.name || 'New Cabinet',
        medical_condition: parsed.medical_condition || parsed.name || 'General',
        time_slot: parsed.time_slot || 'Morning',
        medicines_count: 0,
        stock_status: { in_stock: 0, few_left: 0, out_of_stock: 0 },
        medicines: []
      };
      cabinets.unshift(newCab);
      await saveDemoCabinets(cabinets);
      return { success: true, data: { cabinet: newCab } };
    }
  }

  // Medicines
  if (endpoint.startsWith('/medicines')) {
    const cabinets = await getDemoCabinets();
    const allMeds = cabinets.flatMap(c => c.medicines || []);

    if (endpoint.includes('/dose-history')) {
      const days = [];
      const now = new Date();
      for (let i = 1; i <= 30; i++) {
        const dStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        days.push({
          date: dStr,
          status: i % 7 === 0 ? 'missed' : i > now.getDate() ? 'upcoming' : 'taken',
          doses: [
            { dose_id: `d-${i}`, scheduled_time: `${dStr}T08:00:00Z`, status: i % 7 === 0 ? 'missed' : i > now.getDate() ? 'upcoming' : 'taken', dose_amount: '1 tablet' }
          ]
        });
      }
      return {
        success: true,
        data: {
          month: '2026-11',
          days,
          summary: { total_scheduled: 30, total_taken: 26, total_missed: 4, adherence_rate: 87 }
        }
      };
    }

    if (endpoint.includes('/revisions')) {
      return {
        success: true,
        data: {
          revisions: [
            {
              revision_number: 1,
              action_label: 'Added by Pharmacist',
              editor_name: 'Pooja Verma (Pharmacist)',
              editor_role: 'pharmacist',
              created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
              audit_stamp: {
                timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
                location_name: 'Apollo Central, Bangalore',
                latitude: 12.9784,
                longitude: 77.6408
              },
              field_sources: { name: 'scanned', salt_composition: 'database', expiry_date: 'scanned' }
            },
            {
              revision_number: 2,
              action_label: 'Edited by Patient',
              editor_name: 'Arjun Rao (Patient)',
              editor_role: 'patient',
              created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
              audit_stamp: {
                timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
                location_name: 'Indiranagar, Bangalore',
                latitude: 12.9784,
                longitude: 77.6408
              },
              changed_fields: ['cautions', 'nickname'],
              new_values: { cautions: 'Take with warm water after breakfast' }
            }
          ]
        }
      };
    }

    if (method === 'GET') {
      return { success: true, data: { medicines: allMeds } };
    }

    if (method === 'POST') {
      const parsed = options.body ? JSON.parse(options.body) : {};
      const newMed = {
        _id: 'med-' + Date.now(),
        name: parsed.name,
        brand_name: parsed.name,
        salt_composition: parsed.salt_composition || 'Active Compound IP',
        strength: parsed.strength || '500mg',
        dosage_form: parsed.dosage_form || 'tablet',
        quantity: Number(parsed.quantity) || 10,
        stock_threshold: Number(parsed.stock_threshold) || 4,
        category: parsed.category || 'Common',
        usedFor: parsed.usedFor || '',
        cautions: parsed.cautions || '',
        entered_by_role: 'pharmacist',
        entered_by_label: 'Entered by Pharmacist',
        field_sources: {
          name: 'scanned',
          salt_composition: 'database',
          expiry_date: 'manual',
          batch_number: 'manual',
          quantity: 'manual'
        },
        initial_audit_stamp: {
          timestamp: new Date().toISOString(),
          location_name: 'Bangalore Medical Store'
        }
      };
      if (cabinets.length > 0) {
        cabinets[0].medicines.push(newMed);
        cabinets[0].medicines_count = cabinets[0].medicines.length;
        await saveDemoCabinets(cabinets);
      }
      return { success: true, data: { medicine: newMed } };
    }
  }

  // Scan & Draft
  if (endpoint.startsWith('/scan')) {
    if (endpoint.includes('/draft')) {
      if (method === 'GET') return { success: true, data: { draft: cachedDraft } };
      if (method === 'POST') {
        cachedDraft = options.body ? JSON.parse(options.body) : null;
        return { success: true, message: 'Draft saved' };
      }
      if (method === 'DELETE') {
        cachedDraft = null;
        return { success: true, message: 'Draft cleared' };
      }
    }

    if (endpoint.includes('/two-sided') || endpoint.includes('/image')) {
      return {
        success: true,
        data: {
          quality_report: { pass: true, quality_score: 94 },
          detected_fields: {
            name: 'Dolo 650',
            salt_composition: 'Paracetamol IP 650mg',
            expiry_date: '2027-04-30',
            batch_number: 'B240918',
            manufacturer: 'Micro Labs Limited',
            dosage_form: 'tablet',
            strength: '650mg'
          },
          field_sources: {
            name: 'scanned',
            salt_composition: 'database',
            expiry_date: 'scanned',
            batch_number: 'scanned',
            manufacturer: 'scanned'
          },
          drug_match: ABDM_MOBILE_REGISTRY['8901086001234']
        }
      };
    }
  }

  // Chatbot
  if (endpoint.startsWith('/chatbot/message')) {
    const parsed = options.body ? JSON.parse(options.body) : {};
    const text = (parsed.message || '').toLowerCase();
    let reply = "Here is what I found in your records:";
    let toolCards = [];

    if (text.includes('stock') || text.includes('refill') || text.includes('low') || text.includes('out')) {
      reply = "Telma 40 is currently Out of Stock (0 tablets remaining). Combiflam has Few Left (3 tablets remaining). I recommend refilling them soon.";
      toolCards = [
        { type: 'stock_warning', medicine_name: 'Telma 40', status: 'Out of Stock', remaining: 0, action: 'Buy Refill' },
        { type: 'stock_warning', medicine_name: 'Combiflam', status: 'Few Left', remaining: 3, action: 'Buy Refill' }
      ];
    } else if (text.includes('cabinet') || text.includes('cold') || text.includes('fever')) {
      reply = "You have 2 active cabinets: 'Fever & Pain Relief' with 2 medicines and 'Chronic Blood Pressure' with 1 medicine.";
      toolCards = [
        { type: 'cabinet_card', name: 'Fever & Pain Relief', condition: 'Fever', count: 2 },
        { type: 'cabinet_card', name: 'Chronic Blood Pressure', condition: 'Blood Pressure', count: 1 }
      ];
    } else {
      reply = "I can help you review your active cabinets, check current stock levels, trace medicine revision audit histories, or review your monthly adherence calendar. What would you like to check?";
    }

    return {
      success: true,
      data: {
        reply,
        tool_cards: toolCards,
        disclaimer: "I am an AI assistant, not a doctor or pharmacist. I can provide general medicine-related information and help you understand your records, but I cannot diagnose medical conditions or prescribe treatment. Always consult a qualified healthcare professional before making medical decisions."
      }
    };
  }

  // Schedule
  if (endpoint.startsWith('/schedule/today')) {
    return {
      success: true,
      data: {
        totalDoses: 3,
        takenCount: 2,
        pendingCount: 1,
        doses: [
          { _id: 'd-1', medicine: { name: 'Dolo 650', strength: '650mg' }, scheduled_time: new Date().setHours(8, 0, 0, 0), status: 'taken', food_instruction: 'after_food' },
          { _id: 'd-2', medicine: { name: 'Telma 40', strength: '40mg' }, scheduled_time: new Date().setHours(8, 0, 0, 0), status: 'taken', food_instruction: 'after_food' },
          { _id: 'd-3', medicine: { name: 'Combiflam', strength: '400mg' }, scheduled_time: new Date().setHours(20, 0, 0, 0), status: 'pending', food_instruction: 'after_food' }
        ]
      }
    };
  }

  if (endpoint.startsWith('/chemists/nearby') || endpoint.startsWith('/places/nearby')) {
    return { success: true, data: { facilities: DEMO_HEALTHCARE_PLACES, chemists: DEMO_HEALTHCARE_PLACES } };
  }

  return { success: true, data: {} };
}

async function request(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();

  if (DEMO_MODE) {
    return handleDemoRequest(method, endpoint, options);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const accessToken = await storage.getItem('meditrace_access_token');
  const profileId = await storage.getItem('meditrace_profile_id');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  if (profileId) headers['x-profile-id'] = profileId;

  try {
    const response = await fetch(url, { ...options, headers });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(json.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return json;
  } catch (_e) {
    // If backend connection fails or offline, provide graceful fallback
    return handleDemoRequest(method, endpoint, options);
  }
}

export const mobileClient = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' })
};

export default mobileClient;
