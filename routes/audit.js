// Audit logs routes definition
const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// 1. Audit views and export actions restricted exclusively to Admin role
router.get('/', auth, roleCheck('Admin'), auditController.getAuditLogs);
router.get('/export', auth, roleCheck('Admin'), auditController.exportAuditCSV);

// 2. SQL query sandbox & database backup actions
router.post('/sandbox', auth, roleCheck('Admin'), auditController.executeSandboxQuery);
router.get('/backup', auth, roleCheck('Admin'), auditController.exportDatabaseBackup);

module.exports = router;
