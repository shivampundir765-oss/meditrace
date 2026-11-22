const { MedicineRevision } = require('../models/medicineRevision.model');
const { Medicine } = require('../models/medicine.model');
const { createAuditStamp } = require('../utils/auditStamp');

class RevisionService {
  /**
   * Create the immutable Revision 1 upon initial medicine creation
   */
  async createInitialRevision(medicine, editorUser, locationPayload = null) {
    const auditStamp = createAuditStamp(locationPayload);

    let entryLabel = 'Added by Patient';
    if (editorUser.role === 'pharmacist') {
      entryLabel = 'Added by Pharmacist';
    } else if (editorUser.role === 'doctor') {
      entryLabel = 'Added by Doctor';
    } else if (editorUser.role === 'admin') {
      entryLabel = 'Added by Admin';
    }

    const revision = new MedicineRevision({
      medicine_id: medicine._id,
      profile_id: medicine.profile_id || null,
      revision_number: 1,
      editor_id: editorUser._id,
      editor_user_id: editorUser._id,
      editor_role: editorUser.role,
      editor_name: editorUser.name || 'User',
      entry_label: entryLabel,
      action_label: entryLabel,
      change_summary: 'Initial medicine entry and verification',
      changed_fields: [],
      previous_values: {},
      new_values: {
        name: medicine.name,
        generic_name: medicine.generic_name,
        salt_composition: medicine.salt_composition,
        dosage_form: medicine.dosage_form,
        strength: medicine.strength,
        manufacturer: medicine.manufacturer,
        batch_number: medicine.batch_number,
        expiry_date: medicine.expiry_date,
        quantity: medicine.quantity,
        description: medicine.description,
        usedFor: medicine.usedFor,
        category: medicine.category,
        cautions: medicine.cautions,
        nickname: medicine.nickname
      },
      audit_stamp: auditStamp
    });

    await revision.save();

    // Update medicine with original entry details and stamp
    medicine.current_revision = 1;
    medicine.entered_by_role = editorUser.role;
    medicine.entered_by_label = entryLabel;
    medicine.initial_audit_stamp = auditStamp;
    medicine.last_audit_stamp = auditStamp;
    medicine.original_entry = {
      by_user_id: editorUser._id,
      by_role: editorUser.role,
      label: entryLabel,
      created_at: new Date()
    };

    return revision;
  }

  /**
   * Append a new revision on edit.
   * Revision history is append-only and immutable.
   */
  async createEditRevision(medicine, editorUser, updatePayload, locationPayload = null) {
    const auditStamp = createAuditStamp(locationPayload);
    const nextRevisionNumber = (medicine.current_revision || 1) + 1;

    let entryLabel = 'Edited by Patient';
    if (editorUser.role === 'pharmacist') {
      entryLabel = 'Edited by Pharmacist';
    } else if (editorUser.role === 'doctor') {
      entryLabel = 'Edited by Doctor';
    } else if (editorUser.role === 'admin') {
      entryLabel = 'Edited by Admin';
    } else if (editorUser.name) {
      entryLabel = `Edited by ${editorUser.name}`;
    }

    const changedFields = [];
    const previousValues = {};
    const newValues = {};

    for (const [key, val] of Object.entries(updatePayload)) {
      if (['audit_stamp', 'location', '_id', 'current_revision', 'initial_audit_stamp'].includes(key)) {
        continue;
      }
      if (medicine[key] !== undefined && String(medicine[key]) !== String(val)) {
        changedFields.push(key);
        previousValues[key] = medicine[key];
        newValues[key] = val;
      }
    }

    if (changedFields.length === 0) {
      return null; // Nothing changed
    }

    const summary = `Updated ${changedFields.join(', ')}`;

    const revision = new MedicineRevision({
      medicine_id: medicine._id,
      profile_id: medicine.profile_id || null,
      revision_number: nextRevisionNumber,
      editor_id: editorUser._id,
      editor_user_id: editorUser._id,
      editor_role: editorUser.role,
      editor_name: editorUser.name || 'User',
      entry_label: entryLabel,
      action_label: entryLabel,
      change_summary: summary,
      changed_fields: changedFields,
      previous_values: previousValues,
      new_values: newValues,
      audit_stamp: auditStamp
    });

    await revision.save();

    // Update medicine revision pointer
    medicine.current_revision = nextRevisionNumber;
    medicine.last_audit_stamp = auditStamp;
    await medicine.save();

    return revision;
  }

  /**
   * Get complete revision history for a medicine
   */
  async getRevisions(medicineId) {
    const revisions = await MedicineRevision.find({ medicine_id: medicineId })
      .sort({ revision_number: 1 })
      .populate('editor_user_id', 'name email role')
      .lean();

    return revisions;
  }
}

module.exports = new RevisionService();
