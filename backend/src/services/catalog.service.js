const { Catalog } = require('../models/catalog.model');
const { CatalogMedicine } = require('../models/catalogMedicine.model');
const { Medicine } = require('../models/medicine.model');

class CatalogService {
  /**
   * Automatically initializes the default catalogs for a user if they have none.
   */
  async ensureDefaultCatalogs(userId) {
    const count = await Catalog.countDocuments({ user_id: userId });
    if (count > 0) return;

    const defaults = [
      {
        user_id: userId,
        name: 'Morning Routine',
        time_slot: 'Morning',
        reminder_time: '08:00',
        color: '#0d9488',
        is_default: true
      },
      {
        user_id: userId,
        name: 'Afternoon Dose',
        time_slot: 'Afternoon',
        reminder_time: '13:00',
        color: '#0284c7',
        is_default: true
      },
      {
        user_id: userId,
        name: 'Evening Care',
        time_slot: 'Evening',
        reminder_time: '20:00',
        color: '#f59e0b',
        is_default: true
      },
      {
        user_id: userId,
        name: 'Night Rest',
        time_slot: 'Night',
        reminder_time: '22:00',
        color: '#6366f1',
        is_default: true
      }
    ];

    await Catalog.insertMany(defaults);
  }

  /**
   * List all catalogs for a user with their medicines populated.
   */
  async listCatalogsWithMedicines(userId) {
    await this.ensureDefaultCatalogs(userId);

    const catalogs = await Catalog.find({ user_id: userId }).sort({ created_at: 1 }).lean();
    const catalogIds = catalogs.map((c) => c._id);

    const mappings = await CatalogMedicine.find({ catalog_id: { $in: catalogIds } })
      .populate('medicine_id')
      .lean();

    const result = catalogs.map((cat) => {
      const items = mappings
        .filter((m) => String(m.catalog_id) === String(cat._id) && m.medicine_id)
        .map((m) => ({
          ...m.medicine_id,
          catalog_medicine_id: m._id,
          dose_amount: m.dose_amount,
          timing: m.timing,
          notes: m.notes
        }));

      return {
        ...cat,
        medicines: items,
        medicine_count: items.length
      };
    });

    return result;
  }

  async createCatalog(userId, data) {
    const catalog = new Catalog({
      ...data,
      user_id: userId
    });
    await catalog.save();
    return catalog;
  }

  async updateCatalog(userId, catalogId, data) {
    const catalog = await Catalog.findOneAndUpdate(
      { _id: catalogId, user_id: userId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!catalog) throw new Error('Catalog not found');
    return catalog;
  }

  async deleteCatalog(userId, catalogId) {
    const catalog = await Catalog.findOneAndDelete({ _id: catalogId, user_id: userId });
    if (!catalog) throw new Error('Catalog not found');
    await CatalogMedicine.deleteMany({ catalog_id: catalogId });
    return { success: true };
  }

  async addMedicine(userId, catalogId, data) {
    const catalog = await Catalog.findOne({ _id: catalogId, user_id: userId });
    if (!catalog) throw new Error('Catalog not found');

    const medicine = await Medicine.findOne({ _id: data.medicine_id, patient_id: userId });
    if (!medicine) throw new Error('Medicine not found');

    const item = await CatalogMedicine.findOneAndUpdate(
      { catalog_id: catalogId, medicine_id: data.medicine_id },
      {
        user_id: userId,
        dose_amount: data.dose_amount || '1 tablet',
        timing: data.timing || 'after_food',
        notes: data.notes || ''
      },
      { upsert: true, new: true }
    );

    return item;
  }

  async removeMedicine(userId, catalogId, medicineId) {
    await CatalogMedicine.findOneAndDelete({
      catalog_id: catalogId,
      medicine_id: medicineId,
      user_id: userId
    });
    return { success: true };
  }
}

module.exports = new CatalogService();
