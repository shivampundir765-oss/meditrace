const express = require('express');
const profileController = require('../../controllers/profile.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(profileController.getProfiles)
  .post(profileController.createProfile);

router.route('/:id')
  .get(profileController.getProfileById)
  .put(profileController.updateProfile)
  .delete(profileController.deleteProfile);

router.post('/:id/caregivers', profileController.addCaregiver);
router.delete('/:id/caregivers/:caregiverId', profileController.removeCaregiver);

module.exports = router;
