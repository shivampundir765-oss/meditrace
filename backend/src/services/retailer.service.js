const { Retailer } = require('../models/retailer.model');
const { RetailerInventory } = require('../models/retailerInventory.model');

const getProfile = async (userId) => {
  const retailer = await Retailer.findOne({ user_id: userId });
  if (!retailer) {
    const error = new Error('Retailer profile not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }
  return retailer;
};

const upsertProfile = async (userId, data) => {
  const { latitude, longitude, ...rest } = data;

  const updatePayload = {
    ...rest,
    user_id: userId
  };

  if (latitude !== undefined && longitude !== undefined) {
    updatePayload.location = {
      type: 'Point',
      coordinates: [Number(longitude), Number(latitude)]
    };
  }

  const retailer = await Retailer.findOneAndUpdate(
    { user_id: userId },
    { $set: updatePayload },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return retailer;
};

const addInventoryItem = async (userId, itemData) => {
  const retailer = await Retailer.findOne({ user_id: userId });
  if (!retailer) {
    const error = new Error('Retailer store profile must be created before adding inventory');
    error.statusCode = 400;
    error.errorCode = 'PROFILE_REQUIRED';
    throw error;
  }

  const item = await RetailerInventory.create({
    ...itemData,
    retailer_id: retailer._id
  });

  return item;
};

const listInventory = async (userId, { page = 1, limit = 20, search, is_available }) => {
  const retailer = await Retailer.findOne({ user_id: userId });
  if (!retailer) {
    return { items: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
  }

  const query = { retailer_id: retailer._id };
  if (is_available !== undefined) {
    query.is_available = is_available === 'true' || is_available === true;
  }
  if (search) {
    query.$or = [
      { medicine_name: { $regex: search, $options: 'i' } },
      { generic_name: { $regex: search, $options: 'i' } },
      { salt_composition: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    RetailerInventory.find(query).sort({ created_at: -1 }).skip(skip).limit(limit),
    RetailerInventory.countDocuments(query)
  ]);

  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const updateInventoryItem = async (userId, itemId, updateData) => {
  const retailer = await Retailer.findOne({ user_id: userId });
  if (!retailer) {
    const error = new Error('Retailer store profile not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  const item = await RetailerInventory.findOneAndUpdate(
    { _id: itemId, retailer_id: retailer._id },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!item) {
    const error = new Error('Inventory item not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  return item;
};

const deleteInventoryItem = async (userId, itemId) => {
  const retailer = await Retailer.findOne({ user_id: userId });
  if (!retailer) {
    const error = new Error('Retailer store profile not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  const item = await RetailerInventory.findOneAndDelete({
    _id: itemId,
    retailer_id: retailer._id
  });

  if (!item) {
    const error = new Error('Inventory item not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  return { message: 'Inventory item removed successfully' };
};

module.exports = {
  getProfile,
  upsertProfile,
  addInventoryItem,
  listInventory,
  updateInventoryItem,
  deleteInventoryItem
};
