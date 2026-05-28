// Controller managing audit logging and audit history retrieval
const AuditHistory = require('../models/AuditHistory');

// 1. Utility function to log an action into audit_history
const logAudit = async (entityType, entityId, action, req, oldValue = null, newValue = null) => {
  try {
    const changed_by_id = req && req.user ? req.user.id : null;
    const changed_by_role = req && req.user ? req.user.role : null;

    // Save history entry with optional before/after states
    await AuditHistory.create({
      entity_type: entityType,
      entity_id: entityId,
      action: action,
      changed_by_id,
      changed_by_role,
      old_value: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
      new_value: newValue ? JSON.parse(JSON.stringify(newValue)) : null
    });
  } catch (err) {
    console.error('Failed to write Audit History log:', err);
  }
};

// 2. Fetch all audit logs (for Admin role)
const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditHistory.findAll({
      order: [['timestamp', 'DESC']]
    });
    return res.status(200).json({ success: true, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Export audit logs as a downloadable CSV file (for Admin role)
const exportAuditCSV = async (req, res) => {
  try {
    const logs = await AuditHistory.findAll({
      order: [['timestamp', 'DESC']]
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');

    const headers = ['Audit ID', 'Entity Type', 'Entity ID', 'Action', 'Changed By ID', 'Changed By Role', 'Timestamp', 'Old Value', 'New Value'];
    
    const rows = logs.map(log => [
      log.audit_id,
      log.entity_type,
      log.entity_id,
      log.action,
      log.changed_by_id || 'System',
      log.changed_by_role || 'System',
      log.timestamp ? new Date(log.timestamp).toISOString() : '',
      JSON.stringify(log.old_value || {}).replace(/"/g, '""'),
      JSON.stringify(log.new_value || {}).replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\r\n');

    return res.status(200).send(csvContent);
  } catch (err) {
    return res.status(500).send(`Error generating CSV: ${err.message}`);
  }
};

// 4. Secure admin live SQL query sandbox execution block
const executeSandboxQuery = async (req, res) => {
  try {
    const { sql } = req.body;
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ success: false, message: 'SQL query parameter is required.' });
    }

    const sanitized = sql.trim().toUpperCase();
    
    // Check if the query is a SELECT query
    if (!sanitized.startsWith('SELECT') && !sanitized.startsWith('SHOW') && !sanitized.startsWith('DESCRIBE') && !sanitized.startsWith('EXPLAIN')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Security Exception: Only read-only queries (SELECT, SHOW, DESCRIBE, EXPLAIN) are permitted in the sandbox.' 
      });
    }

    // Check for mutating keywords inside the string to prevent multiple queries or sub-queries that mutate data
    const dangerousKeywords = [
      'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'RENAME', 'CREATE', 
      'REPLACE', 'GRANT', 'REVOKE', 'LOCK', 'UNLOCK', 'LOAD DATA'
    ];
    
    for (const word of dangerousKeywords) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(sql)) {
        return res.status(403).json({ 
          success: false, 
          message: `Security Exception: Mutating database operations containing "${word}" are blocked.` 
        });
      }
    }

    const { performance } = require('perf_hooks');
    const sequelize = require('../config/database');

    const startTime = performance.now();
    const [results] = await sequelize.query(sql);
    const endTime = performance.now();
    const executionTimeMs = (endTime - startTime).toFixed(2);

    return res.status(200).json({
      success: true,
      results: Array.isArray(results) ? results : [results],
      executionTimeMs
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Generate and download a programmatically compiled database SQL dump
const exportDatabaseBackup = async (req, res) => {
  try {
    const sequelize = require('../config/database');

    // 1. Get all tables in the database
    const [tables] = await sequelize.query('SHOW TABLES');
    const tableKey = Object.keys(tables[0] || {})[0];
    const tableNames = tables.map(t => t[tableKey]);

    let sqlDump = `-- FestSystem Programmatic Database Backup SQL Dump\n`;
    sqlDump += `-- Generated: ${new Date().toISOString()}\n`;
    sqlDump += `-- Database: ${sequelize.config.database}\n`;
    sqlDump += `\nSET FOREIGN_KEY_CHECKS = 0;\n\n`;

    // 2. Loop through each table and compile its schema + rows
    for (const tableName of tableNames) {
      sqlDump += `-- ------------------------------------------------------\n`;
      sqlDump += `-- Table structure for table \`${tableName}\`\n`;
      sqlDump += `-- ------------------------------------------------------\n`;
      sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;

      const [createTableResult] = await sequelize.query(`SHOW CREATE TABLE \`${tableName}\``);
      const createTableSql = createTableResult[0]['Create Table'] || createTableResult[0]['Create View'];
      
      sqlDump += `${createTableSql};\n\n`;

      if (createTableSql.toUpperCase().includes('CREATE ALGORITHM') || createTableSql.toUpperCase().includes('VIEW')) {
        continue;
      }

      const [rows] = await sequelize.query(`SELECT * FROM \`${tableName}\``);
      if (rows.length > 0) {
        sqlDump += `-- Dumping data for table \`${tableName}\`\n`;
        for (const row of rows) {
          const keys = Object.keys(row).map(k => `\`${k}\``).join(', ');
          const values = Object.values(row).map(val => {
            if (val === null) return 'NULL';
            if (typeof val === 'number') return val;
            if (typeof val === 'object') return sequelize.escape(JSON.stringify(val));
            return sequelize.escape(val);
          }).join(', ');
          sqlDump += `INSERT INTO \`${tableName}\` (${keys}) VALUES (${values});\n`;
        }
        sqlDump += `\n`;
      }
    }

    sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename=${sequelize.config.database}_backup_${Date.now()}.sql`);
    
    return res.status(200).send(sqlDump);
  } catch (err) {
    return res.status(500).send(`Failed to generate database SQL backup: ${err.message}`);
  }
};

module.exports = {
  logAudit,
  getAuditLogs,
  exportAuditCSV,
  executeSandboxQuery,
  exportDatabaseBackup
};
