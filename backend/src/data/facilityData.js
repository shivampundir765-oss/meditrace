/**
 * Verified Healthcare Facilities (Chemists, Hospitals, Clinics)
 */

const HEALTHCARE_FACILITIES = [
  // Chemist Shops
  {
    name: 'Apollo Pharmacy 24/7 Indiranagar',
    type: 'chemist',
    phone: '+91 80 2525 1122',
    emergency_phone: '+91 80 2525 1123',
    email: 'apollo.indiranagar@meditrace.com',
    opening_hours: '24 Hours Open',
    is_emergency_24x7: true,
    rating: 4.8,
    address: {
      street: '12th Main, HAL 2nd Stage, Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560038'
    },
    location: {
      type: 'Point',
      coordinates: [77.6408, 12.9784] // [lng, lat]
    },
    services: ['Prescription Fulfillment', 'Home Delivery (Express)', 'OTC Medicines', 'Blood Pressure Check', 'Cold-Chain Insulin Storage'],
    specialties: ['General Pharmacy', 'Chronic Disease Supply'],
    total_beds: 0
  },
  {
    name: 'MedPlus Pharmacy & Wellness Koramangala',
    type: 'chemist',
    phone: '+91 80 4141 3344',
    emergency_phone: '+91 80 4141 3345',
    email: 'medplus.koramangala@meditrace.com',
    opening_hours: '08:00 AM - 11:30 PM',
    is_emergency_24x7: false,
    rating: 4.7,
    address: {
      street: '80 Feet Road, 5th Block, Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560034'
    },
    location: {
      type: 'Point',
      coordinates: [77.6271, 12.9352]
    },
    services: ['Prescription Medicines', 'Generic Medicine Discounts', 'Surgical Supplies', 'Nutritional Supplements'],
    specialties: ['Generic Drugs', 'Family Health'],
    total_beds: 0
  },
  {
    name: 'Wellness Forever 24x7 Chemist MG Road',
    type: 'chemist',
    phone: '+91 80 2299 4455',
    emergency_phone: '+91 80 2299 4450',
    email: 'wellness.mgroad@meditrace.com',
    opening_hours: '24 Hours Open',
    is_emergency_24x7: true,
    rating: 4.9,
    address: {
      street: '14 MG Road, Opp Metro Station, Shanthala Nagar',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560001'
    },
    location: {
      type: 'Point',
      coordinates: [77.6068, 12.9752]
    },
    services: ['24x7 Prescription Counter', 'Life Saving Injections', 'Oxygen Cylinders & Kits', 'Refrigerated Vaccines'],
    specialties: ['Emergency Medicines', 'Pediatric Formulations'],
    total_beds: 0
  },
  {
    name: 'Pradhan Mantri Jan Aushadhi Kendra Shivajinagar',
    type: 'chemist',
    phone: '+91 80 2559 8811',
    emergency_phone: '+91 80 2559 8812',
    email: 'janaushadhi.shivaji@meditrace.com',
    opening_hours: '09:00 AM - 09:00 PM',
    is_emergency_24x7: false,
    rating: 4.6,
    address: {
      street: 'Near Shivaji Bus Station, Russell Market',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560051'
    },
    location: {
      type: 'Point',
      coordinates: [77.6033, 12.9856]
    },
    services: ['High Quality Affordable Generics (50-90% Discount)', 'Essential Chronic Medications', 'Surgical Consumables'],
    specialties: ['Affordable Healthcare', 'Jan Aushadhi Scheme'],
    total_beds: 0
  },

  // Hospitals
  {
    name: 'Manipal Hospital HAL Airport Road (24/7 Trauma)',
    type: 'hospital',
    phone: '+91 80 2502 4444',
    emergency_phone: '+91 80 2502 3333',
    email: 'info@manipalhospitals.com',
    opening_hours: '24/7 Emergency & Inpatient Services',
    is_emergency_24x7: true,
    rating: 4.9,
    address: {
      street: '98 HAL Old Airport Road, Kodihalli',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560017'
    },
    location: {
      type: 'Point',
      coordinates: [77.6515, 12.9592]
    },
    services: ['24/7 Emergency & Level 1 Trauma', 'Cardiac Care Unit (CCU)', 'Neuro-ICU', '24x7 Blood Bank', 'Robotic Surgery', 'Dialysis Center'],
    specialties: ['Cardiology', 'Neurology', 'Oncology', 'Emergency Medicine', 'Orthopedics'],
    total_beds: 650
  },
  {
    name: 'Fortis Hospital Cunningham Road',
    type: 'hospital',
    phone: '+91 80 4199 4444',
    emergency_phone: '+91 80 4199 4455',
    email: 'cunningham@fortishealthcare.com',
    opening_hours: '24/7 Emergency & ICU',
    is_emergency_24x7: true,
    rating: 4.8,
    address: {
      street: '14 Cunningham Road, Vasanth Nagar',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560052'
    },
    location: {
      type: 'Point',
      coordinates: [77.5937, 12.9892]
    },
    services: ['24x7 Cardiac Emergency Response', 'Interventional Cath Lab', 'Intensive Care Unit', 'Day Care Surgery', 'Advanced Diagnostic Imaging'],
    specialties: ['Interventional Cardiology', 'Cardiothoracic Surgery', 'Vascular Surgery', 'Critical Care'],
    total_beds: 150
  },
  {
    name: 'Apollo Hospital Bannerghatta Road',
    type: 'hospital',
    phone: '+91 80 2630 4050',
    emergency_phone: '+91 80 1066',
    email: 'emergency.blr@apollohospitals.com',
    opening_hours: '24/7 Emergency & Hospitalization',
    is_emergency_24x7: true,
    rating: 4.8,
    address: {
      street: '154/11 Opp IIMB, Bannerghatta Road',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560076'
    },
    location: {
      type: 'Point',
      coordinates: [77.5994, 12.8954]
    },
    services: ['24/7 National Emergency Network (Dial 1066)', 'Organ Transplant Unit', 'Comprehensive Cancer Care', 'Pediatric Intensive Care (PICU)'],
    specialties: ['Emergency Medicine', 'Transplantology', 'Nephrology', 'Medical Oncology'],
    total_beds: 280
  },

  // Clinics & Diagnostics
  {
    name: 'Apex Heart & Vascular Polyclinic (Dr. Sharma)',
    type: 'clinic',
    phone: '+91 80 2525 9900',
    emergency_phone: '+91 80 2525 9901',
    email: 'clinic.sharma@meditrace.com',
    opening_hours: '09:00 AM - 01:00 PM, 02:00 PM - 06:00 PM (Mon-Sat)',
    is_emergency_24x7: false,
    rating: 4.9,
    address: {
      street: '100ft Road, Opp Metro Pillar 84, Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560038'
    },
    location: {
      type: 'Point',
      coordinates: [77.6412, 12.9733]
    },
    services: ['Cardiology Consultations', '12-Lead ECG & Echocardiography', 'Treadmill Stress Test (TMT)', 'Holter Monitoring', 'Hypertension Clinic'],
    specialties: ['Cardiology', 'Internal Medicine', 'Preventive Health'],
    total_beds: 4
  },
  {
    name: 'Cloudnine Maternal & Pediatric Clinic',
    type: 'clinic',
    phone: '+91 80 6792 9999',
    emergency_phone: '+91 80 6792 9911',
    email: 'cloudnine.blr@meditrace.com',
    opening_hours: '08:00 AM - 08:00 PM Daily',
    is_emergency_24x7: false,
    rating: 4.8,
    address: {
      street: 'Old Airport Road, Kodihalli',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560017'
    },
    location: {
      type: 'Point',
      coordinates: [77.6491, 12.9608]
    },
    services: ['Pediatric Immunization', 'Antenatal Consultations', 'Fetal Medicine & 4D Ultrasound', 'Lactation Advice', 'Child Nutrition'],
    specialties: ['Pediatrics', 'Obstetrics & Gynecology', 'Neonatal Health'],
    total_beds: 12
  },
  {
    name: 'Skin & Aesthetics Care Clinic (Dr. Priya)',
    type: 'clinic',
    phone: '+91 80 4141 7788',
    emergency_phone: '+91 80 4141 7789',
    email: 'clinic.priya@meditrace.com',
    opening_hours: '10:00 AM - 07:00 PM (Tue-Sun)',
    is_emergency_24x7: false,
    rating: 4.7,
    address: {
      street: '80ft Road, 4th Block, Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560034'
    },
    location: {
      type: 'Point',
      coordinates: [77.6255, 12.9341]
    },
    services: ['Dermatological Diagnosis', 'Allergy Testing', 'Eczema & Psoriasis Management', 'Laser Skin Therapy'],
    specialties: ['Dermatology', 'Trichology', 'Venereology'],
    total_beds: 2
  }
];

module.exports = { HEALTHCARE_FACILITIES };
