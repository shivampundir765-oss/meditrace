const { AbdmDrug } = require('../models/abdmDrug.model');
const { ABDM_REGISTRY_ENTRIES } = require('../data/abdmRegistryData');

/**
 * Ensure the ABDM registry collection is seeded in database
 */
const ensureAbdmSeeded = async () => {
  try {
    const count = await AbdmDrug.countDocuments();
    if (count === 0) {
      await AbdmDrug.insertMany(ABDM_REGISTRY_ENTRIES);
    }
  } catch (err) {
    console.error('ABDM Seeding notice:', err.message);
  }
};

/**
 * Search the ABDM Drug Registry by query (brand name, generic, salt composition, therapeutic class)
 */
const searchAbdmDrugs = async (query = '', { limit = 20 } = {}) => {
  await ensureAbdmSeeded();

  const trimmed = query.trim();
  if (!trimmed) {
    const all = await AbdmDrug.find().limit(Number(limit));
    return all.length > 0 ? all : ABDM_REGISTRY_ENTRIES.slice(0, limit);
  }

  const regex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  let results = await AbdmDrug.find({
    $or: [
      { brand_name: regex },
      { generic_name: regex },
      { salt_composition: regex },
      { therapeutic_class: regex },
      { abdm_drug_code: regex }
    ]
  }).limit(Number(limit));

  if (!results || results.length === 0) {
    // In-memory fallback
    results = ABDM_REGISTRY_ENTRIES.filter(e =>
      regex.test(e.brand_name) ||
      regex.test(e.generic_name) ||
      regex.test(e.salt_composition) ||
      regex.test(e.therapeutic_class) ||
      regex.test(e.abdm_drug_code)
    ).slice(0, limit);
  }

  return results;
};

/**
 * Look up medicine in ABDM Registry by Barcode or Drug Code
 */
const lookupByCodeOrBarcode = async (identifier) => {
  await ensureAbdmSeeded();
  const clean = identifier.trim();

  let match = await AbdmDrug.findOne({
    $or: [
      { abdm_drug_code: clean },
      { barcodes: clean }
    ]
  });

  if (!match) {
    match = ABDM_REGISTRY_ENTRIES.find(
      e => e.abdm_drug_code === clean || (e.barcodes && e.barcodes.includes(clean))
    );
  }

  return match || null;
};

/**
 * Match OCR text against ABDM formulary
 */
const matchOcrWithAbdm = async (ocrText, extractedName = '') => {
  await ensureAbdmSeeded();
  const text = (ocrText + ' ' + extractedName).toLowerCase();

  for (const entry of ABDM_REGISTRY_ENTRIES) {
    const brandLower = entry.brand_name.toLowerCase();
    const genericLower = entry.generic_name.toLowerCase();

    // Check if brand or generic is in scanned text
    if (text.includes(brandLower) || text.includes(genericLower)) {
      return entry;
    }

    // Split brand tokens (e.g. "Dolo", "Augmentin")
    const brandToken = brandLower.split(' ')[0];
    if (brandToken.length > 3 && text.includes(brandToken)) {
      return entry;
    }
  }

  // Fallback check against DB
  const tokens = extractedName.split(/\s+/).filter(t => t.length >= 4);
  for (const token of tokens) {
    const match = await AbdmDrug.findOne({
      brand_name: { $regex: token, $options: 'i' }
    });
    if (match) return match;
  }

  return null;
};

module.exports = {
  ensureAbdmSeeded,
  searchAbdmDrugs,
  lookupByCodeOrBarcode,
  matchOcrWithAbdm
};
