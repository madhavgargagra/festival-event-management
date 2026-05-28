// Database connector using Sequelize ORM
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize instance with environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME || 'festival_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // Turn off query logging for cleaner console logs
    define: {
      timestamps: false, // Match table schema from database.sql
      underscored: true  // Map camelCase model properties to snake_case table columns
    }
  }
);

module.exports = sequelize;
