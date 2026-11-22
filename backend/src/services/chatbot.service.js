const { ChatMessage } = require('../models/chatMessage.model');
const { Cabinet } = require('../models/cabinet.model');
const { CabinetMedicine } = require('../models/cabinetMedicine.model');
const { Medicine } = require('../models/medicine.model');
const { DoseSchedule } = require('../models/doseSchedule.model');
const { DoseLog } = require('../models/doseLog.model');
const cabinetService = require('./cabinet.service');
const historyService = require('./history.service');

const MEDICAL_DISCLAIMER_EN =
  'I am an AI assistant, not a doctor or pharmacist. I can provide general medicine-related information and help you understand your records, but I cannot diagnose medical conditions or prescribe treatment. Always consult a qualified healthcare professional before making medical decisions.';

const MEDICAL_DISCLAIMER_HI =
  'मैं एक एआई सहायक हूँ, डॉक्टर या फार्मासिस्ट नहीं। मैं सामान्य दवा संबंधी जानकारी दे सकता हूँ और आपके रिकॉर्ड को समझने में मदद कर सकता हूँ, लेकिन मैं चिकित्सीय स्थिति का निदान या उपचार नहीं लिख सकता। कोई भी चिकित्सीय निर्णय लेने से पहले हमेशा किसी योग्य स्वास्थ्य विशेषज्ञ से परामर्श लें।';

const EMERGENCY_KEYWORDS = [
  'chest pain', 'heart attack', 'cannot breathe', "can't breathe", 'unconscious',
  'overdose', 'poison', 'anaphylaxis', 'severe bleeding', 'choking',
  'सीने में दर्द', 'सांस नहीं', 'बेहोश', 'जहर'
];

class ChatbotService {
  /**
   * Tool 1: list_cabinets
   */
  async toolListCabinets(userId, profileId) {
    const filter = { user_id: userId };
    if (profileId) filter.$or = [{ profile_id: profileId }, { profile_id: null }];

    const cabinets = await Cabinet.find(filter).lean();
    const cabinetIds = cabinets.map((c) => c._id);
    const mappings = await CabinetMedicine.find({ cabinet_id: { $in: cabinetIds } }).lean();

    return cabinets.map((cab) => {
      const count = mappings.filter((m) => String(m.cabinet_id) === String(cab._id)).length;
      return {
        id: cab._id,
        name: cab.name,
        condition: cab.condition || cab.name,
        color: cab.color,
        time_slot: cab.time_slot,
        medicine_count: count
      };
    });
  }

  /**
   * Tool 2: get_cabinet_medicines
   */
  async toolGetCabinetMedicines(userId, profileId, cabinetNameOrId) {
    const filter = { user_id: userId };
    if (profileId) filter.$or = [{ profile_id: profileId }, { profile_id: null }];

    let cabinet = null;
    if (/^[0-9a-fA-F]{24}$/.test(cabinetNameOrId)) {
      cabinet = await Cabinet.findOne({ _id: cabinetNameOrId, ...filter }).lean();
    }
    if (!cabinet) {
      cabinet = await Cabinet.findOne({
        name: { $regex: cabinetNameOrId, $options: 'i' },
        ...filter
      }).lean();
    }

    if (!cabinet) return { error: `No cabinet found matching "${cabinetNameOrId}"` };

    const mappings = await CabinetMedicine.find({ cabinet_id: cabinet._id })
      .populate('medicine_id')
      .lean();

    const medicines = mappings
      .filter((m) => m.medicine_id && !m.medicine_id.is_deleted)
      .map((m) => ({
        id: m.medicine_id._id,
        name: m.medicine_id.name,
        dosage_form: m.medicine_id.dosage_form,
        strength: m.medicine_id.strength,
        quantity: m.medicine_id.quantity,
        dose_amount: m.dose_amount,
        timing: m.timing
      }));

    return {
      cabinet: { id: cabinet._id, name: cabinet.name, color: cabinet.color },
      medicines
    };
  }

  /**
   * Tool 3: get_stock_status
   */
  async toolGetStockStatus(userId, profileId, medicineName) {
    const filter = {
      patient_id: userId,
      is_deleted: { $ne: true },
      $or: [
        { name: { $regex: medicineName, $options: 'i' } },
        { generic_name: { $regex: medicineName, $options: 'i' } },
        { nickname: { $regex: medicineName, $options: 'i' } }
      ]
    };
    if (profileId) {
      filter.$and = [{ $or: [{ profile_id: profileId }, { profile_id: null }] }];
    }

    const med = await Medicine.findOne(filter).lean();
    if (!med) return { error: `Medicine "${medicineName}" not found in your records.` };

    const sched = await DoseSchedule.findOne({ medicine_id: med._id, is_active: true }).lean();
    const stock = await cabinetService.calculateStockStatus(med, sched);

    return {
      id: med._id,
      name: med.name,
      nickname: med.nickname,
      quantity: med.quantity,
      original_quantity: med.original_quantity || med.quantity,
      status: stock.status,
      status_label: stock.label,
      color: stock.color,
      threshold: stock.threshold,
      needs_check: stock.needs_check
    };
  }

  /**
   * Tool 4: get_low_or_out_of_stock
   */
  async toolGetLowOrOutOfStock(userId, profileId) {
    const filter = {
      patient_id: userId,
      is_deleted: { $ne: true }
    };
    if (profileId) {
      filter.$or = [{ profile_id: profileId }, { profile_id: null }];
    }

    const medicines = await Medicine.find(filter).lean();
    const schedules = await DoseSchedule.find({ patient_id: userId, is_active: true }).lean();
    const schedMap = new Map();
    schedules.forEach((s) => schedMap.set(String(s.medicine_id), s));

    const lowOrOut = [];
    for (const med of medicines) {
      const sched = schedMap.get(String(med._id));
      const stock = await cabinetService.calculateStockStatus(med, sched);
      if (stock.status === 'out_of_stock' || stock.status === 'few_left') {
        lowOrOut.push({
          id: med._id,
          name: med.name,
          quantity: med.quantity,
          status: stock.status,
          status_label: stock.label,
          color: stock.color,
          threshold: stock.threshold
        });
      }
    }

    return lowOrOut;
  }

  /**
   * Tool 5: get_schedule
   */
  async toolGetSchedule(userId, profileId) {
    const filter = { patient_id: userId, is_active: true };
    if (profileId) {
      filter.$or = [{ profile_id: profileId }, { profile_id: null }];
    }

    const schedules = await DoseSchedule.find(filter)
      .populate('medicine_id', 'name strength dosage_form category')
      .lean();

    return schedules
      .filter((s) => s.medicine_id && !s.medicine_id.is_deleted)
      .map((s) => ({
        id: s._id,
        medicine_name: s.medicine_id.name,
        dose_amount: s.dose_amount,
        specific_times: s.specific_times,
        mealSlots: s.mealSlots || [],
        food_instruction: s.food_instruction,
        category: s.medicine_id.category
      }));
  }

  /**
   * Tool 6: get_dose_history
   */
  async toolGetDoseHistory(userId, profileId, medicineName, monthStr) {
    const filter = {
      patient_id: userId,
      is_deleted: { $ne: true },
      name: { $regex: medicineName, $options: 'i' }
    };
    const med = await Medicine.findOne(filter).lean();
    if (!med) return { error: `Medicine "${medicineName}" not found.` };

    const history = await historyService.getMonthlyMedicineHistory(userId, profileId, med._id, monthStr);
    return {
      medicine: med.name,
      month: history.month,
      summary: history.summary
    };
  }

  /**
   * Tool 7: get_medicine_details
   */
  async toolGetMedicineDetails(userId, profileId, medicineName) {
    const filter = {
      patient_id: userId,
      is_deleted: { $ne: true },
      $or: [
        { name: { $regex: medicineName, $options: 'i' } },
        { generic_name: { $regex: medicineName, $options: 'i' } },
        { nickname: { $regex: medicineName, $options: 'i' } }
      ]
    };
    const med = await Medicine.findOne(filter).lean();
    if (!med) return { error: `Medicine "${medicineName}" not found.` };

    return {
      id: med._id,
      name: med.name,
      generic_name: med.generic_name,
      salt_composition: med.salt_composition,
      dosage_form: med.dosage_form,
      strength: med.strength,
      manufacturer: med.manufacturer,
      category: med.category,
      usedFor: med.usedFor,
      description: med.description,
      cautions: med.cautions,
      nickname: med.nickname,
      quantity: med.quantity
    };
  }

  /**
   * Process a chat message with tool execution and safety checks
   */
  async processMessage(userId, profileId, messageText, language = 'en') {
    const trimmed = String(messageText || '').trim();
    if (!trimmed) throw new Error('Message cannot be empty');
    if (trimmed.length > 1000) throw new Error('Message exceeds 1000 characters limit');

    const lower = trimmed.toLowerCase();
    const isHindi = language === 'hi' || /[\u0900-\u097F]/.test(trimmed);
    const disclaimer = isHindi ? MEDICAL_DISCLAIMER_HI : MEDICAL_DISCLAIMER_EN;

    // Check emergency
    const isEmergency = EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw));
    if (isEmergency) {
      const emergencyReply = isHindi
        ? '⚠️ आपातकालीन चेतावनी: यह गंभीर चिकित्सीय लक्षण लग रहा है। कृपया तुरंत आपातकालीन सेवाओं (112 या 108 डायल करें) पर संपर्क करें या नजदीकी आपातकालीन कक्ष (ER) जाएं। अपनी दवा खुद न बदलें।'
        : '⚠️ EMERGENCY ALERT: This appears to be a critical medical emergency. Please call emergency services immediately (Dial 112 or 108 in India, or 911 in the US) or proceed to the nearest hospital emergency room. Do not self-medicate.';

      const assistantMsg = await ChatMessage.create({
        user_id: userId,
        profile_id: profileId,
        sender: 'assistant',
        text: emergencyReply,
        language: isHindi ? 'hi' : 'en',
        cards: [],
        disclaimer,
        is_emergency: true
      });

      return assistantMsg;
    }

    let responseText = '';
    const cards = [];

    // Smart tool execution routing based on user query intent
    if (
      lower.includes('cabinet') ||
      lower.includes('कैबिनेट') ||
      lower.includes('group') ||
      lower.includes('अलमारी')
    ) {
      const cabinets = await this.toolListCabinets(userId, profileId);
      if (lower.includes('cold') || lower.includes('fever') || lower.includes('headache') || lower.includes('जुकाम') || lower.includes('बुखार')) {
        const queryTerm = lower.includes('cold') || lower.includes('जुकाम') ? 'cold' : lower.includes('fever') || lower.includes('बुखार') ? 'fever' : 'headache';
        const match = cabinets.find((c) => c.name.toLowerCase().includes(queryTerm) || c.condition.toLowerCase().includes(queryTerm));
        if (match) {
          responseText = isHindi
            ? `हाँ, आपके पास "${match.name}" कैबिनेट है जिसमें ${match.medicine_count} दवाएँ हैं।`
            : `Yes, you have a "${match.name}" cabinet containing ${match.medicine_count} medicine(s).`;
          cards.push({
            type: 'cabinet',
            id: match.id,
            name: match.name,
            condition: match.condition,
            color: match.color,
            medicine_count: match.medicine_count
          });
        } else {
          responseText = isHindi
            ? `नहीं, आपके पास अभी "${queryTerm}" के लिए कोई कैबिनेट नहीं है। आप एक नया कैबिनेट बना सकते हैं।`
            : `No, you do not currently have a cabinet named "${queryTerm}". You can create one easily from the Cabinets tab.`;
        }
      } else {
        responseText = isHindi
          ? `आपके पास वर्तमान में ${cabinets.length} कैबिनेट हैं:`
          : `Here are your ${cabinets.length} medicine cabinet(s):`;
        cabinets.forEach((c) => {
          cards.push({
            type: 'cabinet',
            id: c.id,
            name: c.name,
            condition: c.condition,
            color: c.color,
            medicine_count: c.medicine_count
          });
        });
      }
    } else if (
      lower.includes('low') ||
      lower.includes('out of stock') ||
      lower.includes('running out') ||
      lower.includes('refill') ||
      lower.includes('स्टॉक') ||
      lower.includes('खत्म')
    ) {
      const lowStockMeds = await this.toolGetLowOrOutOfStock(userId, profileId);
      if (lowOrOutStockCheck(lowStockMeds)) {
        responseText = isHindi
          ? `आपके पास ${lowStockMeds.length} दवा(एं) हैं जो कम या खत्म हो चुकी हैं:`
          : `You have ${lowStockMeds.length} medicine(s) that are low or out of stock:`;
        lowStockMeds.forEach((m) => {
          cards.push({
            type: 'medicine_stock',
            id: m.id,
            name: m.name,
            quantity: m.quantity,
            status: m.status,
            status_label: m.status_label,
            color: m.color,
            action: 'refill'
          });
        });
      } else {
        responseText = isHindi
          ? 'बहुत बढ़िया! आपकी सभी दवाओं का स्टॉक पर्याप्त है।'
          : 'Great news! All your medicines currently have sufficient stock levels.';
      }
    } else if (
      lower.includes('when') ||
      lower.includes('time') ||
      lower.includes('schedule') ||
      lower.includes('कब') ||
      lower.includes('समय') ||
      lower.includes('खुराक')
    ) {
      const schedules = await this.toolGetSchedule(userId, profileId);
      if (schedules.length === 0) {
        responseText = isHindi
          ? 'आपके पास अभी कोई सक्रिय खुराक समय सारणी नहीं है।'
          : 'You do not have any active dose schedules configured right now.';
      } else {
        responseText = isHindi
          ? `यहाँ आपकी निर्धारित खुराकें हैं (${schedules.length} सक्रिय):`
          : `Here is your active dosage schedule (${schedules.length} active medicines):`;
        schedules.forEach((s) => {
          cards.push({
            type: 'schedule',
            id: s.id,
            name: s.medicine_name,
            dose_amount: s.dose_amount,
            times: s.specific_times?.join(', ') || 'Scheduled meals',
            category: s.category
          });
        });
      }
    } else if (
      lower.includes('what is') ||
      lower.includes('used for') ||
      lower.includes('details') ||
      lower.includes('caution') ||
      lower.includes('क्या है') ||
      lower.includes('उपयोग')
    ) {
      // Find matching medicine in database
      const meds = await Medicine.find({ patient_id: userId, is_deleted: { $ne: true } }).lean();
      let matchedMed = null;
      for (const m of meds) {
        if (lower.includes(m.name.toLowerCase()) || (m.nickname && lower.includes(m.nickname.toLowerCase()))) {
          matchedMed = m;
          break;
        }
      }

      if (matchedMed) {
        const details = await this.toolGetMedicineDetails(userId, profileId, matchedMed.name);
        responseText = isHindi
          ? `${details.name}: ${details.description || details.usedFor || 'दवा'}. श्रेणी: ${details.category}. चेतावनी: ${details.cautions || 'चिकित्सक की सलाह अनुसार लें।'}`
          : `${details.name}: ${details.description || details.usedFor || 'Pharmaceutical formulation'}. Category: ${details.category}. Caution: ${details.cautions || 'Use as prescribed.'}`;
        cards.push({
          type: 'medicine_details',
          id: details.id,
          name: details.name,
          category: details.category,
          usedFor: details.usedFor,
          cautions: details.cautions
        });
      } else {
        responseText = isHindi
          ? 'मैं आपकी दवाओं के बारे में मदद कर सकता हूँ। आप किसी विशिष्ट दवा का नाम पूछ सकते हैं।'
          : 'I can provide information about your saved medicines, cabinets, dosage schedules, or stock levels. Ask about any specific medicine.';
      }
    } else {
      // Default overview
      const cabinets = await this.toolListCabinets(userId, profileId);
      const lowStockMeds = await this.toolGetLowOrOutOfStock(userId, profileId);
      responseText = isHindi
        ? `नमस्ते! मैं आपका मेडिट्रेस स्वास्थ्य सहायक हूँ। आपके पास ${cabinets.length} कैबिनेट हैं और ${lowStockMeds.length} दवाओं पर ध्यान देने की आवश्यकता है। मैं आपकी कैसे मदद कर सकता हूँ?`
        : `Hello! I am your MediTrace Health Assistant. You currently have ${cabinets.length} medicine cabinet(s) and ${lowStockMeds.length} medicine(s) needing attention. How can I assist you today?`;
    }

    const assistantMsg = await ChatMessage.create({
      user_id: userId,
      profile_id: profileId,
      sender: 'assistant',
      text: responseText,
      language: isHindi ? 'hi' : 'en',
      cards,
      disclaimer,
      is_emergency: false
    });

    return assistantMsg;
  }

  async getChatHistory(userId, profileId, limit = 50) {
    const filter = { user_id: userId };
    if (profileId) filter.profile_id = profileId;

    return await ChatMessage.find(filter)
      .sort({ created_at: 1 })
      .limit(Number(limit))
      .lean();
  }

  async clearChatHistory(userId, profileId) {
    const filter = { user_id: userId };
    if (profileId) filter.profile_id = profileId;
    await ChatMessage.deleteMany(filter);
    return { success: true, message: 'Chat history cleared' };
  }
}

function lowOrOutStockCheck(arr) {
  return Array.isArray(arr) && arr.length > 0;
}

module.exports = new ChatbotService();
