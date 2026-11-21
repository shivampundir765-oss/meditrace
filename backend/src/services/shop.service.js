const { RetailerInventory } = require('../models/retailerInventory.model');

const searchMedicines = async ({ query, city, sortBy = 'price_asc', page = 1, limit = 20 }) => {
  const matchFilter = {
    is_available: true,
    quantity: { $gt: 0 }
  };

  if (query) {
    matchFilter.$or = [
      { medicine_name: { $regex: query, $options: 'i' } },
      { generic_name: { $regex: query, $options: 'i' } },
      { salt_composition: { $regex: query, $options: 'i' } }
    ];
  }

  const sortOrder = {};
  if (sortBy === 'price_asc') sortOrder.price = 1;
  else if (sortBy === 'price_desc') sortOrder.price = -1;
  else sortOrder.created_at = -1;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    RetailerInventory.find(matchFilter)
      .populate('retailer_id', 'shop_name address phone opening_hours rating is_verified delivery_available')
      .sort(sortOrder)
      .skip(skip)
      .limit(limit),
    RetailerInventory.countDocuments(matchFilter)
  ]);

  // Filter by city if specified
  const filtered = city
    ? items.filter((i) => i.retailer_id && i.retailer_id.address && i.retailer_id.address.city.toLowerCase() === city.toLowerCase())
    : items;

  const results = filtered.map((item) => {
    const finalPrice = Math.round(item.price * (1 - (item.discount_percentage || 0) / 100));
    return {
      _id: item._id,
      medicine_name: item.medicine_name,
      generic_name: item.generic_name,
      salt_composition: item.salt_composition,
      dosage_form: item.dosage_form,
      strength: item.strength,
      manufacturer: item.manufacturer,
      price: item.price,
      discount_percentage: item.discount_percentage,
      final_price: finalPrice,
      quantity_in_stock: item.quantity,
      requires_prescription: item.requires_prescription,
      retailer: item.retailer_id,
      estimated_delivery_hours: 24
    };
  });

  return {
    results,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: city ? results.length : total,
      pages: Math.ceil((city ? results.length : total) / limit)
    }
  };
};

/**
 * Suggest cheaper generic alternatives matching the exact same salt composition
 */
const getGenericAlternatives = async (medicineId) => {
  // Look up source medicine item
  const sourceItem = await RetailerInventory.findById(medicineId);
  if (!sourceItem) {
    const error = new Error('Medicine item not found in catalog');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  const salt = sourceItem.salt_composition;
  if (!salt) {
    return {
      targetMedicine: sourceItem.medicine_name,
      salt_composition: 'Unknown',
      message: 'No salt composition recorded for generic matching',
      alternatives: []
    };
  }

  // Find other in-stock items with matching salt composition and cheaper price
  const sourcePrice = sourceItem.price * (1 - (sourceItem.discount_percentage || 0) / 100);

  const candidates = await RetailerInventory.find({
    _id: { $ne: sourceItem._id },
    salt_composition: { $regex: salt.trim(), $options: 'i' },
    is_available: true,
    quantity: { $gt: 0 }
  }).populate('retailer_id', 'shop_name rating');

  const cheaperAlternatives = candidates
    .map((alt) => {
      const altPrice = alt.price * (1 - (alt.discount_percentage || 0) / 100);
      const savings = Math.round(((sourcePrice - altPrice) / sourcePrice) * 100);
      return {
        _id: alt._id,
        medicine_name: alt.medicine_name,
        generic_name: alt.generic_name,
        salt_composition: alt.salt_composition,
        dosage_form: alt.dosage_form,
        strength: alt.strength,
        manufacturer: alt.manufacturer,
        original_price: alt.price,
        final_price: altPrice,
        savings_percentage: savings,
        retailer: alt.retailer_id
      };
    })
    .filter((a) => a.final_price < sourcePrice) // Cheaper alternatives only
    .sort((a, b) => b.savings_percentage - a.savings_percentage);

  return {
    targetMedicine: {
      _id: sourceItem._id,
      name: sourceItem.medicine_name,
      salt_composition: sourceItem.salt_composition,
      price: sourcePrice
    },
    cheaperAlternativesCount: cheaperAlternatives.length,
    alternatives: cheaperAlternatives
  };
};

module.exports = {
  searchMedicines,
  getGenericAlternatives
};
