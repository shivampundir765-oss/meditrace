const { Scan } = require('../models/scan.model');

// Preloaded pharmaceutical barcode directory (common OTC and prescription medicines)
const BARCODE_CATALOGUE = {
  '8901086001234': {
    name: 'Dolo 650mg Tablet',
    generic_name: 'Paracetamol',
    salt_composition: 'Paracetamol (650mg)',
    dosage_form: 'tablet',
    strength: '650mg',
    manufacturer: 'Micro Labs Ltd',
    batch_number: 'ML-9921',
    expiry_months_ahead: 24,
    requires_prescription: false
  },
  '8901234567890': {
    name: 'Augmentin 625 Duo Tablet',
    generic_name: 'Amoxicillin and Clavulanic Acid',
    salt_composition: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
    dosage_form: 'tablet',
    strength: '625mg',
    manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
    batch_number: 'GSK-4011',
    expiry_months_ahead: 18,
    requires_prescription: true
  },
  '8902000000011': {
    name: 'Azithral 500 Tablet',
    generic_name: 'Azithromycin',
    salt_composition: 'Azithromycin (500mg)',
    dosage_form: 'tablet',
    strength: '500mg',
    manufacturer: 'Alembic Pharmaceuticals Ltd',
    batch_number: 'ALM-802',
    expiry_months_ahead: 20,
    requires_prescription: true
  },
  '8903000000022': {
    name: 'Pan 40 Tablet',
    generic_name: 'Pantoprazole',
    salt_composition: 'Pantoprazole (40mg)',
    dosage_form: 'tablet',
    strength: '40mg',
    manufacturer: 'Alkem Laboratories Ltd',
    batch_number: 'ALK-331',
    expiry_months_ahead: 24,
    requires_prescription: false
  },
  '8904000000033': {
    name: 'Glycomet 500 Tablet',
    generic_name: 'Metformin Hydrochloride',
    salt_composition: 'Metformin (500mg)',
    dosage_form: 'tablet',
    strength: '500mg',
    manufacturer: 'USV Ltd',
    batch_number: 'USV-109',
    expiry_months_ahead: 36,
    requires_prescription: true
  }
};

const MONTH_NAMES = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

/**
 * Clean and normalize OCR string using regular expressions
 */
const cleanOcrText = (raw) => {
  if (!raw) return '';
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[^\x20-\x7E\n]/g, ' ') // Strip non-printable ASCII
    .replace(/[ \t]+/g, ' ')         // Collapse excessive spaces
    .trim();
};

/**
 * Extract Expiry Date using flexible pharmaceutical regex patterns
 */
const extractExpiryDate = (text) => {
  if (!text) return null;

  // Pattern 1: EXP: MM/YYYY or MM/YY or MM-YYYY
  const numPattern = /(?:EXP|EXPIRY|USE\s*BEFORE|BEST\s*BEFORE)\s*(?:DATE)?\s*[:.-]?\s*([0-1]?\d)[/-](20\d{2}|\d{2})\b/i;
  const numMatch = text.match(numPattern);
  if (numMatch) {
    const month = parseInt(numMatch[1], 10) - 1;
    let year = parseInt(numMatch[2], 10);
    if (year < 100) year += 2000;
    if (month >= 0 && month <= 11) {
      // Set to last day of the expiry month
      return new Date(year, month + 1, 0, 23, 59, 59);
    }
  }

  // Pattern 2: EXP: MMM YYYY or MMM-YY (e.g. DEC 2027, OCT-28)
  const monthWordPattern = /(?:EXP|EXPIRY|USE\s*BEFORE)\s*(?:DATE)?\s*[:.-]?\s*([A-Za-z]{3,4})[\s./-]*(20\d{2}|\d{2})\b/i;
  const wordMatch = text.match(monthWordPattern);
  if (wordMatch) {
    const monthKey = wordMatch[1].toLowerCase().slice(0, 3);
    let year = parseInt(wordMatch[2], 10);
    if (year < 100) year += 2000;
    if (MONTH_NAMES[monthKey] !== undefined) {
      const month = MONTH_NAMES[monthKey];
      return new Date(year, month + 1, 0, 23, 59, 59);
    }
  }

  return null;
};

/**
 * Extract Batch Number using regex
 */
const extractBatchNumber = (text) => {
  if (!text) return '';
  const batchPattern = /(?:BATCH(?:\s*NO|\s*NUM(?:BER)?)?|B\.?\s*NO|LOT|B\.?\s*NUM(?:BER)?)\s*[:.-]?\s*([A-Za-z0-9/-]{3,20})/i;
  const match = text.match(batchPattern);
  return match ? match[1].trim() : '';
};

/**
 * Extract Manufacturer using regex
 */
const extractManufacturer = (text) => {
  if (!text) return '';
  const mfgPattern = /(?:MFD|MKT|MANUFACTURED|MARKETED)\s*(?:BY)?\s*[:.-]?\s*([A-Za-z0-9\s&.,-]{3,60})/i;
  const match = text.match(mfgPattern);
  if (match) {
    return match[1].split(/\n|,/)[0].trim();
  }
  return '';
};

/**
 * Extract Medicine Name and Strength using regex and layout heuristics
 */
const extractMedicineName = (text) => {
  if (!text) return '';

  // Look for name with strength suffix (e.g. "Paracetamol 500mg" or "Amoxicillin 625 Duo")
  const strengthPattern = /([A-Za-z][A-Za-z0-9\s-]{2,40}\s*(?:\d+(?:\.\d+)?\s*(?:mg|ml|mcg|g|iu|duo|sr|xl|dt)))\b/i;
  const strengthMatch = text.match(strengthPattern);
  if (strengthMatch) {
    const cleaned = strengthMatch[1].replace(/^(Rx|Mfg|Batch|Exp|Tab|Cap)\s+/i, '').trim();
    if (cleaned.length >= 3) return cleaned;
  }

  // Fallback: Check lines of text, pick the first prominent line that isn't a header/batch/date
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
  for (const line of lines) {
    if (!/^(EXP|MFG|BATCH|B\.NO|PRICE|MRP|RS|FOR|STORE|KEEP|WARNING)/i.test(line)) {
      return line.slice(0, 50);
    }
  }

  return '';
};

/**
 * Calculate confidence score (0 - 100) based on extracted components
 */
const calculateConfidence = ({ name, expiry, batch, manufacturer, rawText }) => {
  if (!rawText || rawText.trim().length === 0) return 0;

  let score = 0;
  if (name && name.length >= 3) score += 35;
  if (expiry instanceof Date && !isNaN(expiry.getTime())) score += 30;
  if (batch && batch.length >= 3) score += 20;
  if (manufacturer && manufacturer.length >= 3) score += 15;

  return Math.min(100, Math.max(10, score));
};

/**
 * Process OCR text or image scan
 */
const processOcrScan = async (patientId, { raw_text, image_url }) => {
  const cleanedText = cleanOcrText(raw_text || '');
  const extracted_name = extractMedicineName(cleanedText);
  const extracted_expiry = extractExpiryDate(cleanedText);
  const extracted_batch = extractBatchNumber(cleanedText);
  const extracted_manufacturer = extractManufacturer(cleanedText);

  const confidence = calculateConfidence({
    name: extracted_name,
    expiry: extracted_expiry,
    batch: extracted_batch,
    manufacturer: extracted_manufacturer,
    rawText: cleanedText
  });

  const autofill_data = {
    name: extracted_name || 'Scanned Medicine',
    generic_name: extracted_name,
    salt_composition: '',
    dosage_form: /capsule|cap\b/i.test(cleanedText) ? 'capsule' : (/syrup/i.test(cleanedText) ? 'syrup' : 'tablet'),
    strength: (extracted_name.match(/\d+\s*(?:mg|ml|mcg|g)/i) || [''])[0],
    manufacturer: extracted_manufacturer,
    batch_number: extracted_batch,
    expiry_date: extracted_expiry,
    quantity: 10,
    low_stock_threshold: 5,
    requires_prescription: /schedule\s*h|rx\s*only/i.test(cleanedText)
  };

  const scan = await Scan.create({
    patient_id: patientId,
    scan_type: 'ocr',
    image_url: image_url || null,
    raw_text: cleanedText,
    extracted_name,
    extracted_expiry,
    extracted_batch,
    extracted_manufacturer,
    confidence,
    autofill_data
  });

  return scan;
};

/**
 * Process Barcode Scan (GTIN lookup or directory search)
 */
const processBarcodeScan = async (patientId, barcode) => {
  const cleanBarcode = barcode.trim();
  const known = BARCODE_CATALOGUE[cleanBarcode];

  let extracted_name = '';
  let extracted_batch = '';
  let extracted_manufacturer = '';
  let extracted_expiry = null;
  let confidence = 0;
  let autofill_data;

  if (known) {
    extracted_name = known.name;
    extracted_batch = known.batch_number;
    extracted_manufacturer = known.manufacturer;
    confidence = 98; // High confidence from direct barcode match

    const expDate = new Date();
    expDate.setMonth(expDate.getMonth() + (known.expiry_months_ahead || 18));
    extracted_expiry = expDate;

    autofill_data = {
      name: known.name,
      generic_name: known.generic_name,
      salt_composition: known.salt_composition,
      dosage_form: known.dosage_form,
      strength: known.strength,
      manufacturer: known.manufacturer,
      batch_number: known.batch_number,
      expiry_date: extracted_expiry,
      quantity: 10,
      low_stock_threshold: 5,
      requires_prescription: known.requires_prescription
    };
  } else {
    // Unknown barcode: generate skeleton structure with moderate confidence
    extracted_name = `Medicine (Barcode ${cleanBarcode})`;
    confidence = 50;
    autofill_data = {
      name: extracted_name,
      generic_name: '',
      salt_composition: '',
      dosage_form: 'tablet',
      strength: '',
      manufacturer: '',
      batch_number: `B-${cleanBarcode.slice(-4)}`,
      expiry_date: null,
      quantity: 10,
      low_stock_threshold: 5,
      requires_prescription: false
    };
  }

  const scan = await Scan.create({
    patient_id: patientId,
    scan_type: 'barcode',
    barcode: cleanBarcode,
    raw_text: `Barcode: ${cleanBarcode}`,
    extracted_name,
    extracted_expiry,
    extracted_batch,
    extracted_manufacturer,
    confidence,
    autofill_data
  });

  return scan;
};

/**
 * Retrieve patient's scan history
 */
const getScanHistory = async (patientId, { page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const [scans, total] = await Promise.all([
    Scan.find({ patient_id: patientId }).sort({ created_at: -1 }).skip(skip).limit(limit),
    Scan.countDocuments({ patient_id: patientId })
  ]);

  return {
    scans,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  cleanOcrText,
  extractExpiryDate,
  extractBatchNumber,
  extractManufacturer,
  extractMedicineName,
  calculateConfidence,
  processOcrScan,
  processBarcodeScan,
  getScanHistory,
  BARCODE_CATALOGUE
};
