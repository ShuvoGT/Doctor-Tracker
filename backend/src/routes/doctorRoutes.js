import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getSpecializations,
  listDoctorPatients,
  addDoctorPatient,
  removeDoctorPatient,
} from '../controllers/doctorController.js';
import { validate } from '../middleware/validate.js';
import { PATIENT_CONDITIONS, GENDERS } from '../models/Patient.js';

const router = Router();

const doctorValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('specialization').trim().notEmpty().withMessage('Specialization is required'),
  body('hospital').trim().notEmpty().withMessage('Hospital is required'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const patientValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('age').isInt({ min: 0, max: 150 }).withMessage('Age must be 0-150'),
  body('gender').isIn(GENDERS).withMessage('Invalid gender'),
  body('condition').optional().isIn(PATIENT_CONDITIONS).withMessage('Invalid condition'),
];

router.get('/specializations', getSpecializations);

router.route('/').get(listDoctors).post(doctorValidation, validate, createDoctor);

router
  .route('/:id')
  .get(param('id').isMongoId(), validate, getDoctor)
  .put(param('id').isMongoId(), doctorValidation, validate, updateDoctor)
  .delete(param('id').isMongoId(), validate, deleteDoctor);

router
  .route('/:id/patients')
  .get(param('id').isMongoId(), validate, listDoctorPatients)
  .post(param('id').isMongoId(), patientValidation, validate, addDoctorPatient);

router.delete(
  '/:id/patients/:patientId',
  param('id').isMongoId(),
  param('patientId').isMongoId(),
  validate,
  removeDoctorPatient
);

export default router;
