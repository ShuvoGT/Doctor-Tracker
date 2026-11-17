import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  listPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} from '../controllers/patientController.js';
import { validate } from '../middleware/validate.js';
import { PATIENT_CONDITIONS, GENDERS, BLOOD_GROUPS } from '../models/Patient.js';

const router = Router();

const patientValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('age').isInt({ min: 0, max: 150 }).withMessage('Age must be 0-150'),
  body('gender').isIn(GENDERS).withMessage('Invalid gender'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
  body('bloodGroup').optional({ checkFalsy: true }).isIn(BLOOD_GROUPS).withMessage('Invalid blood group'),
  body('condition').optional().isIn(PATIENT_CONDITIONS).withMessage('Invalid condition'),
  body('doctor').isMongoId().withMessage('A valid doctor is required'),
];

router.route('/').get(listPatients).post(patientValidation, validate, createPatient);

router
  .route('/:id')
  .get(param('id').isMongoId(), validate, getPatient)
  .put(param('id').isMongoId(), patientValidation, validate, updatePatient)
  .delete(param('id').isMongoId(), validate, deletePatient);

export default router;
