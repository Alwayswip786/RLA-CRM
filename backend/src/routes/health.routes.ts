import { Router } from 'express';
import { rootServiceInfo, readinessHealth } from '../controllers/health.controller.js';

const router = Router();

router.get('/', rootServiceInfo);
router.get('/health', readinessHealth);
router.get('/health/ready', readinessHealth);

export default router;
