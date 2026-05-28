// Central file for registering models and setting up associations
const sequelize = require('../config/database');

const Department = require('./Department');
const Organizer = require('./Organizer');
const Festival = require('./Festival');
const FestivalOrganizer = require('./FestivalOrganizer');
const Event = require('./Event');
const Contributor = require('./Contributor');
const Contribution = require('./Contribution');
const ContributionAllocation = require('./ContributionAllocation');
const Vendor = require('./Vendor');
const Expense = require('./Expense');
const Volunteer = require('./Volunteer');
const VolunteerAssignment = require('./VolunteerAssignment');
const AuditHistory = require('./AuditHistory');

// --- Associations Setup ---

// 1. Department <-> Organizer
Department.hasMany(Organizer, { foreignKey: 'department_id', onDelete: 'SET NULL' });
Organizer.belongsTo(Department, { foreignKey: 'department_id' });

// 2. Festival & Organizer <-> FestivalOrganizer (Role history tracker)
Organizer.hasMany(FestivalOrganizer, { foreignKey: 'organizer_id', onDelete: 'CASCADE' });
FestivalOrganizer.belongsTo(Organizer, { foreignKey: 'organizer_id' });

Festival.hasMany(FestivalOrganizer, { foreignKey: 'festival_id', onDelete: 'CASCADE' });
FestivalOrganizer.belongsTo(Festival, { foreignKey: 'festival_id' });

// 3. Festival <-> Event
Festival.hasMany(Event, { foreignKey: 'festival_id', onDelete: 'CASCADE' });
Event.belongsTo(Festival, { foreignKey: 'festival_id' });

// 4. Organizer <-> Event
Organizer.hasMany(Event, { foreignKey: 'organizer_id', onDelete: 'SET NULL' });
Event.belongsTo(Organizer, { foreignKey: 'organizer_id' });

// 5. Contributor <-> Contribution
Contributor.hasMany(Contribution, { foreignKey: 'contributor_id', onDelete: 'SET NULL' });
Contribution.belongsTo(Contributor, { foreignKey: 'contributor_id' });

// 6. Festival <-> Contribution
Festival.hasMany(Contribution, { foreignKey: 'festival_id', onDelete: 'SET NULL' });
Contribution.belongsTo(Festival, { foreignKey: 'festival_id' });

// 7. Contribution <-> ContributionAllocation
Contribution.hasMany(ContributionAllocation, { foreignKey: 'contribution_id', onDelete: 'CASCADE' });
ContributionAllocation.belongsTo(Contribution, { foreignKey: 'contribution_id' });

// 8. Event <-> ContributionAllocation
Event.hasMany(ContributionAllocation, { foreignKey: 'event_id', onDelete: 'CASCADE' });
ContributionAllocation.belongsTo(Event, { foreignKey: 'event_id' });

// 9. Vendor <-> Expense
Vendor.hasMany(Expense, { foreignKey: 'vendor_id', onDelete: 'SET NULL' });
Expense.belongsTo(Vendor, { foreignKey: 'vendor_id' });

// 10. Event <-> Expense
Event.hasMany(Expense, { foreignKey: 'event_id', onDelete: 'CASCADE' });
Expense.belongsTo(Event, { foreignKey: 'event_id' });

// 11. Organizer <-> Expense (Two-level approval relations)
Organizer.hasMany(Expense, { as: 'ApprovedExpenses', foreignKey: 'approved_by', onDelete: 'SET NULL' });
Expense.belongsTo(Organizer, { as: 'Approver', foreignKey: 'approved_by' });

Organizer.hasMany(Expense, { as: 'RecommendedExpenses', foreignKey: 'recommended_by', onDelete: 'SET NULL' });
Expense.belongsTo(Organizer, { as: 'Recommender', foreignKey: 'recommended_by' });

// 12. Volunteer <-> VolunteerAssignment
Volunteer.hasMany(VolunteerAssignment, { foreignKey: 'volunteer_id', onDelete: 'CASCADE' });
VolunteerAssignment.belongsTo(Volunteer, { foreignKey: 'volunteer_id' });

// 13. Event <-> VolunteerAssignment
Event.hasMany(VolunteerAssignment, { foreignKey: 'event_id', onDelete: 'CASCADE' });
VolunteerAssignment.belongsTo(Event, { foreignKey: 'event_id' });

module.exports = {
  sequelize,
  Department,
  Organizer,
  Festival,
  FestivalOrganizer,
  Event,
  Contributor,
  Contribution,
  ContributionAllocation,
  Vendor,
  Expense,
  Volunteer,
  VolunteerAssignment,
  AuditHistory
};
