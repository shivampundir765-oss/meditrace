const { Cabinet } = require('../models/cabinet.model');
const { CabinetMedicine } = require('../models/cabinetMedicine.model');
const { Medicine } = require('../models/medicine.model');
const { Prescription } = require('../models/prescription.model');
const { DoseSchedule } = require('../models/doseSchedule.model');
const { createAuditStamp } = require('../utils/auditStamp');

class CabinetService {
  /**
   * Calculate stock status and Few Left threshold for a medicine
   * Formula: max(3 days dosage, 20% of original quantity), user-configurable override
   */
  async calculateStockStatus(medicine, doseSchedule = null) {
    const qty = Number(medicine.quantity) || 0;
    const origQty = Number(medicine.original_quantity) || qty;

    if (qty <= 0) {
      return {
        status: 'out_of_stock',
        label: 'Out of Stock',
        color: '#ef4444', // Red
        needs_check: true,
        threshold: 0,
        current_quantity: qty,
        original_quantity: origQty
      };
    }

    // Determine daily dosage
    let dailyDose = 2; // Default 2 per day if not scheduled
    if (doseSchedule) {
      if (doseSchedule.times_per_day) {
        dailyDose = doseSchedule.times_per_day;
      } else if (doseSchedule.mealSlots && doseSchedule.mealSlots.length > 0) {
        dailyDose = doseSchedule.mealSlots.length;
      }
    }

    // 3 days dosage
    const threeDaysDose = dailyDose * 3;
    // 20% of original quantity
    const twentyPercent = Math.max(1, Math.round(origQty * 0.2));

    // Threshold calculation
    const calculatedThreshold = Math.max(threeDaysDose, twentyPercent);
    const effectiveThreshold =
      medicine.stock_threshold !== null && medicine.stock_threshold !== undefined
        ? Number(medicine.stock_threshold)
        : (medicine.low_stock_threshold || calculatedThreshold);

    if (qty <= effectiveThreshold) {
      return {
        status: 'few_left',
        label: 'Few Left',
        color: '#f59e0b', // Amber
        needs_check: true,
        threshold: effectiveThreshold,
        current_quantity: qty,
        original_quantity: origQty
      };
    }

    return {
      status: 'in_stock',
      label: 'In Stock',
      color: '#10b981', // Green
      needs_check: false,
      threshold: effectiveThreshold,
      current_quantity: qty,
      original_quantity: origQty
    };
  }

  /**
   * Initializes default condition/routine cabinets for a user/profile if none exist
   */
  async ensureDefaultCabinets(userId, profileId = null) {
    const filter = { user_id: userId };
    if (profileId) filter.profile_id = profileId;

    const count = await Cabinet.countDocuments(filter);
    if (count > 0) return;

    const defaults = [
      {
        user_id: userId,
        profile_id: profileId,
        name: 'Cold & Cough',
        condition: 'Cold',
        time_slot: 'Morning',
        reminder_time: '08:00',
        color: '#0d9488', // Teal
        icon: 'snowflake',
        is_default: true
      },
      {
        user_id: userId,
        profile_id: profileId,
        name: 'Fever & Pain',
        condition: 'Fever',
        time_slot: 'Afternoon',
        reminder_time: '13:00',
        color: '#0284c7', // Sky Blue
        icon: 'thermometer',
        is_default: true
      },
      {
        user_id: userId,
        profile_id: profileId,
        name: 'Daily Vitamins',
        condition: 'General Health',
        time_slot: 'Morning',
        reminder_time: '08:30',
        color: '#10b981', // Emerald
        icon: 'pill',
        is_default: true
      },
      {
        user_id: userId,
        profile_id: profileId,
        name: 'Night Care',
        condition: 'Sleep / Night',
        time_slot: 'Night',
        reminder_time: '22:00',
        color: '#6366f1', // Indigo
        icon: 'moon',
        is_default: true
      }
    ];

    await Cabinet.insertMany(defaults);
  }

  /**
   * List all cabinets for a user/profile with medicines, stock summaries, and prescriptions
   */
  async listCabinetsWithMedicines(userId, profileId = null) {
    await this.ensureDefaultCabinets(userId, profileId);

    const filter = { user_id: userId };
    if (profileId) {
      filter.$or = [{ profile_id: profileId }, { profile_id: null }];
    }

    const cabinets = await Cabinet.find(filter).sort({ created_at: 1 }).lean();
    const cabinetIds = cabinets.map((c) => c._id);

    // Fetch cabinet medicines
    const mappings = await CabinetMedicine.find({ cabinet_id: { $in: cabinetIds } })
      .populate('medicine_id')
      .lean();

    // Fetch active dose schedules for stock threshold calculation
    const medicineIds = mappings.map((m) => m.medicine_id?._id).filter(Boolean);
    const schedules = await DoseSchedule.find({
      medicine_id: { $in: medicineIds },
      is_active: true
    }).lean();

    const scheduleMap = new Map();
    for (const s of schedules) {
      scheduleMap.set(String(s.medicine_id), s);
    }

    // Fetch attached prescriptions
    const prescriptions = await Prescription.find({
      cabinet_id: { $in: cabinetIds },
      status: 'active'
    }).lean();

    const result = await Promise.all(
      cabinets.map(async (cab) => {
        const items = [];
        let inStockCount = 0;
        let fewLeftCount = 0;
        let outOfStockCount = 0;

        const cabMappings = mappings.filter(
          (m) => String(m.cabinet_id) === String(cab._id) && m.medicine_id && !m.medicine_id.is_deleted
        );

        for (const m of cabMappings) {
          const med = m.medicine_id;
          const sched = scheduleMap.get(String(med._id));
          const stock = await this.calculateStockStatus(med, sched);

          if (stock.status === 'in_stock') inStockCount++;
          else if (stock.status === 'few_left') fewLeftCount++;
          else if (stock.status === 'out_of_stock') outOfStockCount++;

          items.push({
            ...med,
            cabinet_medicine_id: m._id,
            dose_amount: m.dose_amount,
            timing: m.timing,
            notes: m.notes,
            stock_info: stock
          });
        }

        const cabPrescriptions = prescriptions.filter(
          (p) => String(p.cabinet_id) === String(cab._id)
        );

        const summaryText = `${inStockCount} in stock${fewLeftCount ? `, ${fewLeftCount} few left` : ''}${outOfStockCount ? `, ${outOfStockCount} out of stock` : ''}`;

        return {
          ...cab,
          medicines: items,
          prescriptions: cabPrescriptions,
          medicine_count: items.length,
          prescription_count: cabPrescriptions.length,
          stock_summary: {
            in_stock: inStockCount,
            few_left: fewLeftCount,
            out_of_stock: outOfStockCount,
            total: items.length,
            has_warnings: fewLeftCount > 0 || outOfStockCount > 0,
            text: summaryText
          }
        };
      })
    );

    return result;
  }

  async getCabinetById(userId, cabinetId, profileId = null) {
    const filter = { _id: cabinetId, user_id: userId };
    const cab = await Cabinet.findOne(filter).lean();
    if (!cab) throw new Error('Cabinet not found');

    const mappings = await CabinetMedicine.find({ cabinet_id: cab._id })
      .populate('medicine_id')
      .lean();

    const medicineIds = mappings.map((m) => m.medicine_id?._id).filter(Boolean);
    const schedules = await DoseSchedule.find({
      medicine_id: { $in: medicineIds },
      is_active: true
    }).lean();

    const scheduleMap = new Map();
    for (const s of schedules) {
      scheduleMap.set(String(s.medicine_id), s);
    }

    const items = [];
    let inStock = 0, fewLeft = 0, outOfStock = 0;

    for (const m of mappings) {
      if (!m.medicine_id || m.medicine_id.is_deleted) continue;
      const med = m.medicine_id;
      const sched = scheduleMap.get(String(med._id));
      const stock = await this.calculateStockStatus(med, sched);

      if (stock.status === 'in_stock') inStock++;
      else if (stock.status === 'few_left') fewLeft++;
      else if (stock.status === 'out_of_stock') outOfStock++;

      items.push({
        ...med,
        cabinet_medicine_id: m._id,
        dose_amount: m.dose_amount,
        timing: m.timing,
        notes: m.notes,
        stock_info: stock
      });
    }

    const prescriptions = await Prescription.find({
      cabinet_id: cab._id,
      status: 'active'
    }).lean();

    return {
      ...cab,
      medicines: items,
      prescriptions,
      medicine_count: items.length,
      prescription_count: prescriptions.length,
      stock_summary: {
        in_stock: inStock,
        few_left: fewLeft,
        out_of_stock: outOfStock,
        total: items.length,
        has_warnings: fewLeft > 0 || outOfStock > 0,
        text: `${inStock} in stock${fewLeft ? `, ${fewLeft} few left` : ''}${outOfStock ? `, ${outOfStock} out of stock` : ''}`
      }
    };
  }

  async createCabinet(userId, profileId, data, locationPayload = null) {
    const auditStamp = createAuditStamp(locationPayload);
    const cabinet = new Cabinet({
      ...data,
      user_id: userId,
      profile_id: profileId || data.profile_id || null,
      condition: data.condition || data.name,
      audit_stamp: auditStamp
    });
    await cabinet.save();
    return cabinet;
  }

  async updateCabinet(userId, cabinetId, data, locationPayload = null) {
    const auditStamp = createAuditStamp(locationPayload);
    const cabinet = await Cabinet.findOneAndUpdate(
      { _id: cabinetId, user_id: userId },
      { $set: { ...data, audit_stamp: auditStamp } },
      { new: true, runValidators: true }
    );
    if (!cabinet) throw new Error('Cabinet not found');
    return cabinet;
  }

  async deleteCabinet(userId, cabinetId) {
    const cabinet = await Cabinet.findOneAndDelete({ _id: cabinetId, user_id: userId });
    if (!cabinet) throw new Error('Cabinet not found');
    await CabinetMedicine.deleteMany({ cabinet_id: cabinetId });
    return { success: true, message: 'Cabinet and associated medicines removed' };
  }

  /**
   * Add a medicine into a cabinet
   */
  async addMedicineToCabinet(userId, profileId, cabinetId, data) {
    const { medicine_id, dose_amount, timing, notes } = data;
    const cabinet = await Cabinet.findOne({ _id: cabinetId, user_id: userId });
    if (!cabinet) throw new Error('Cabinet not found');

    const medicine = await Medicine.findById(medicine_id);
    if (!medicine || medicine.is_deleted) throw new Error('Medicine not found');

    const existing = await CabinetMedicine.findOne({ cabinet_id: cabinetId, medicine_id });
    if (existing) {
      existing.dose_amount = dose_amount || existing.dose_amount;
      existing.timing = timing || existing.timing;
      existing.notes = notes || existing.notes;
      await existing.save();
      return existing;
    }

    const mapping = new CabinetMedicine({
      cabinet_id: cabinetId,
      medicine_id,
      user_id: userId,
      profile_id: profileId || cabinet.profile_id,
      dose_amount: dose_amount || '1 tablet',
      timing: timing || 'after_food',
      notes: notes || ''
    });

    await mapping.save();
    return mapping;
  }

  /**
   * Add a prescription into a cabinet
   */
  async addPrescriptionToCabinet(userId, profileId, cabinetId, prescriptionData, locationPayload = null) {
    const cabinet = await Cabinet.findOne({ _id: cabinetId, user_id: userId });
    if (!cabinet) throw new Error('Cabinet not found');

    const auditStamp = createAuditStamp(locationPayload);

    const prescription = new Prescription({
      ...prescriptionData,
      patient_id: userId,
      profile_id: profileId || cabinet.profile_id,
      cabinet_id: cabinetId,
      audit_stamp: auditStamp
    });

    await prescription.save();
    return prescription;
  }

  /**
   * Remove a medicine from a cabinet
   */
  async removeMedicineFromCabinet(userId, cabinetId, medicineId) {
    const result = await CabinetMedicine.findOneAndDelete({
      cabinet_id: cabinetId,
      medicine_id: medicineId,
      user_id: userId
    });
    if (!result) throw new Error('Medicine was not in this cabinet');
    return { success: true };
  }
}

module.exports = new CabinetService();
