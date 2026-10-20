import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as Auth     from '../controllers/auth.controller';
import * as Tickets  from '../controllers/tickets.controller';
import * as Sprints  from '../controllers/sprints.controller';
import * as Workflow from '../controllers/workflow.controller';
import { getAuditLogs } from '../services/audit';

const router = Router();
const PROJECT_ID = '00000000-0000-0000-0001-000000000001';

// ── Auth ──────────────────────────────────────────────────────────────────
router.post('/auth/login',
  body('email').isEmail(),
  body('password').notEmpty(),
  validate,
  Auth.login
);
router.post('/auth/refresh', Auth.refresh);
router.get('/auth/me', authenticate, Auth.me);

// ── Tickets ───────────────────────────────────────────────────────────────
router.get('/tickets',         authenticate, Tickets.listTickets);
router.get('/tickets/:id',     authenticate, Tickets.getTicket);
router.post('/tickets',
  authenticate, authorize('admin','developer'),
  body('title').notEmpty().isLength({ max: 500 }),
  body('state_id').isUUID(),
  body('type').isIn(['story','task','bug','epic']),
  body('priority').isIn(['low','medium','high','critical']),
  validate,
  Tickets.createTicket
);
router.patch('/tickets/:id',
  authenticate, authorize('admin','developer'),
  Tickets.updateTicket
);
router.delete('/tickets/:id',
  authenticate, authorize('admin'),
  Tickets.deleteTicket
);
router.post('/tickets/:id/move',
  authenticate, authorize('admin','developer'),
  body('state_id').isUUID(),
  validate,
  Tickets.moveTicket
);

// ── Sprints ───────────────────────────────────────────────────────────────
router.get('/sprints',                  authenticate, Sprints.listSprints);
router.get('/sprints/velocity',         authenticate, Sprints.getVelocity);
router.get('/sprints/:id',              authenticate, Sprints.getSprint);
router.post('/sprints',
  authenticate, authorize('admin'),
  body('name').notEmpty(),
  body('start_date').isISO8601(),
  body('end_date').isISO8601(),
  validate,
  Sprints.createSprint
);
router.post('/sprints/:id/start',    authenticate, authorize('admin'), Sprints.startSprint);
router.post('/sprints/:id/complete', authenticate, authorize('admin'), Sprints.completeSprint);

// ── Workflow ──────────────────────────────────────────────────────────────
router.get('/workflow/states',      authenticate, Workflow.getStates);
router.get('/workflow/transitions', authenticate, Workflow.getTransitions);
router.get('/workflow/transitions/:ticketId', authenticate, Workflow.getAvailableTransitions);

// ── Audit Log ─────────────────────────────────────────────────────────────
router.get('/audit',
  authenticate, authorize('admin'),
  async (req, res) => {
    const limit  = Math.min(Number(req.query.limit)  || 50, 100);
    const offset = Number(req.query.offset) || 0;
    const logs = await getAuditLogs(PROJECT_ID, limit, offset);
    res.json(logs);
  }
);

export default router;
