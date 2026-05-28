// Main application server entry point
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/database');
const auth = require('./middleware/auth');
const roleCheck = require('./middleware/roleCheck');

// Import models for page-rendering data fetches
const {
  Festival,
  Event,
  Contributor,
  Contribution,
  ContributionAllocation,
  Volunteer,
  VolunteerAssignment,
  Vendor,
  Expense,
  Organizer,
  AuditHistory,
  Department
} = require('./models');

const app = express();

// 1. Register global security and parsing middlewares
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP so Bootstrap 5 CDN dependencies function properly
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Configure templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve public assets folder
app.use(express.static(path.join(__dirname, 'public')));

// 3. Register API Router endpoints
app.use('/api/auth', require('./routes/auth'));
app.use('/api/contributors', require('./routes/contributors'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/events', require('./routes/events'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/allocations', require('./routes/allocations'));
app.use('/api/organizers', require('./routes/organizers'));
app.use('/api/festivals', require('./routes/festivals'));
app.use('/api/audit', require('./routes/audit'));

// 4. View Page rendering routes (EJS Server-side compilation)

// Landing page
app.get('/', async (req, res) => {
  try {
    const ongoingFestivals = await Festival.findAll({ limit: 5 });
    const ongoingEvents = await Event.findAll({ limit: 5 });
    res.render('landing', { title: 'Festival & Event Management', ongoingFestivals, ongoingEvents });
  } catch (err) {
    res.render('landing', { title: 'Festival & Event Management', ongoingFestivals: [], ongoingEvents: [] });
  }
});

// Login Page
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Sign Up Page
app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// Dynamic session redirect endpoint mapping authenticated user to their role dashboard
app.get('/dashboard', auth, (req, res) => {
  const role = req.user.role;
  if (role === 'Admin') return res.redirect('/admin/dashboard');
  if (role === 'Finance') return res.redirect('/finance/dashboard');
  if (role === 'Organizer') return res.redirect('/organizer/dashboard');
  if (role === 'Volunteer') return res.redirect('/volunteer/dashboard');
  if (role === 'Contributor') return res.redirect('/contributor/dashboard');
  if (role === 'Vendor') return res.redirect('/vendor/dashboard');
  return res.redirect('/login');
});

// Admin dashboard rendering
app.get('/admin/dashboard', auth, roleCheck('Admin'), async (req, res) => {
  try {
    const totalFestivals = await Festival.count();
    const totalEvents = await Event.count();
    const totalVolunteers = await Volunteer.count();
    const totalVendors = await Vendor.count();
    const pendingExpenses = await Expense.findAll({
      where: { approval_status: 'Pending' },
      include: [Event, Vendor]
    });
    const logs = await AuditHistory.findAll({ limit: 15, order: [['timestamp', 'DESC']] });
    const organizersList = await Organizer.findAll({ include: [Department] });
    const departments = await Department.findAll();
    const volunteers = await Volunteer.findAll();
    const vendors = await Vendor.findAll();
    const contributors = await Contributor.findAll();
    const financialSummaries = await sequelize.query('SELECT * FROM event_financial_summaries', {
      type: sequelize.QueryTypes.SELECT
    });
    const festivals = await Festival.findAll();

    res.render('admin_dashboard', {
      totalFestivals,
      totalEvents,
      totalVolunteers,
      totalVendors,
      pendingExpenses,
      logs,
      organizersList,
      departments,
      volunteers,
      vendors,
      contributors,
      festivals,
      financialSummaries
    });
  } catch (err) {
    res.status(500).send(`Server Error: ${err.message}`);
  }
});

// Finance dashboard rendering
app.get('/finance/dashboard', auth, roleCheck('Finance', 'Admin'), async (req, res) => {
  try {
    const expenses = await Expense.findAll({ include: [Event, Vendor] });
    const contributions = await Contribution.findAll({ include: [Contributor, Festival] });
    const allocations = await ContributionAllocation.findAll({ include: [Contribution, Event] });
    const vendors = await Vendor.findAll();
    const events = await Event.findAll();

    res.render('finance_dashboard', {
      expenses,
      contributions,
      allocations,
      vendors,
      events
    });
  } catch (err) {
    res.status(500).send(`Server error: ${err.message}`);
  }
});

// Organizer dashboard rendering
app.get('/organizer/dashboard', auth, roleCheck('Organizer', 'Admin'), async (req, res) => {
  try {
    const events = await Event.findAll({ include: [Festival] });
    const festivals = await Festival.findAll();
    const volunteers = await Volunteer.findAll({ where: { background_check_status: 'Passed' } });
    const contributions = await Contribution.findAll({ include: [Contributor] });
    const allocations = await ContributionAllocation.findAll({ include: [Contribution, Event] });
    const vendorEvaluations = await Vendor.findAll();

    res.render('organizer_dashboard', {
      events,
      festivals,
      volunteers,
      contributions,
      allocations,
      vendorEvaluations
    });
  } catch (err) {
    res.status(500).send(`Server error: ${err.message}`);
  }
});

// Volunteer dashboard rendering
app.get('/volunteer/dashboard', auth, roleCheck('Volunteer'), async (req, res) => {
  try {
    const profile = await Volunteer.findByPk(req.user.id);
    const assignments = await VolunteerAssignment.findAll({
      where: { volunteer_id: req.user.id },
      include: [Event]
    });
    res.render('volunteer_dashboard', { profile, assignments });
  } catch (err) {
    res.status(500).send(`Server error: ${err.message}`);
  }
});

// Contributor dashboard rendering
app.get('/contributor/dashboard', auth, roleCheck('Contributor'), async (req, res) => {
  try {
    const profile = await Contributor.findByPk(req.user.id);
    const contributions = await Contribution.findAll({
      where: { contributor_id: req.user.id },
      include: [Festival]
    });
    
    // Sum total donations
    const totalAmount = contributions.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    // Track allocations for their contributions
    const contributionIds = contributions.map(c => c.contribution_id);
    const allocations = await ContributionAllocation.findAll({
      where: { contribution_id: contributionIds },
      include: [Event]
    });

    res.render('contributor_dashboard', { profile, contributions, totalAmount, allocations });
  } catch (err) {
    res.status(500).send(`Server error: ${err.message}`);
  }
});

// Vendor dashboard rendering
app.get('/vendor/dashboard', auth, roleCheck('Vendor'), async (req, res) => {
  try {
    const profile = await Vendor.findByPk(req.user.id);
    const expenses = await Expense.findAll({
      where: { vendor_id: req.user.id },
      include: [Event]
    });
    res.render('vendor_dashboard', { profile, expenses });
  } catch (err) {
    res.status(500).send(`Server error: ${err.message}`);
  }
});

// Shared layout and subpage render routes
app.get('/events', auth, async (req, res) => {
  try {
    const eventsList = await Event.findAll({ include: [Festival, Organizer] });
    res.render('events', { eventsList });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Event printable financial invoice report rendering
app.get('/events/:id/report', auth, roleCheck('Organizer', 'Finance', 'Admin'), async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [Festival, Organizer]
    });
    if (!event) {
      return res.status(404).send('Event not found.');
    }

    const allocations = await ContributionAllocation.findAll({
      where: { event_id: req.params.id },
      include: [
        {
          model: Contribution,
          include: [Contributor]
        }
      ]
    });

    const expenses = await Expense.findAll({
      where: { event_id: req.params.id },
      include: [Vendor]
    });

    res.render('event_report', { event, allocations, expenses });
  } catch (err) {
    res.status(500).send(`Error compiling report: ${err.message}`);
  }
});

app.get('/festivals', auth, async (req, res) => {
  try {
    const festivalsList = await Festival.findAll({ include: [Event] });
    res.render('festivals', { festivalsList });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/organize', auth, async (req, res) => {
  try {
    const events = await Event.findAll({ 
      where: { organizer_id: req.user.id }, 
      include: [Festival, ContributionAllocation] 
    });
    const festivals = await Festival.findAll();
    res.render('organize', { events, festivals });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/vendors', auth, async (req, res) => {
  try {
    const vendors = await Vendor.findAll();
    res.render('vendors', { vendors });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/profile', auth, async (req, res) => {
  try {
    let profile = null;
    let contributions = [];
    let assignments = [];
    let organizedEvents = [];
    
    if (req.user.role === 'Volunteer') {
      profile = await Volunteer.findByPk(req.user.id);
      assignments = await VolunteerAssignment.findAll({ where: { volunteer_id: req.user.id }, include: [Event] });
    } else if (req.user.role === 'Vendor') {
      profile = await Vendor.findByPk(req.user.id);
    } else if (req.user.role === 'Contributor') {
      profile = await Contributor.findByPk(req.user.id);
      contributions = await Contribution.findAll({ where: { contributor_id: req.user.id } });
    } else {
      profile = await Organizer.findByPk(req.user.id);
      organizedEvents = await Event.findAll({ where: { organizer_id: req.user.id } });
    }

    if (profile && req.user.role !== 'Contributor') {
      const contributorRecord = await Contributor.findOne({ where: { email: profile.email } });
      if (contributorRecord) {
        contributions = await Contribution.findAll({ where: { contributor_id: contributorRecord.contributor_id } });
      }
    }

    const totalDonated = contributions.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    res.render('profile', { profile, contributions, totalDonated, assignments, organizedEvents });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/thank-you', (req, res) => {
  res.render('thank_you');
});

// 5. Connect to database and startup server on environmental port
const PORT = process.env.PORT || 3000;
sequelize.authenticate()
  .then(async () => {
    console.log('Database connected successfully.');

    // Programmatically compile database view & automatic triggers
    try {
      await sequelize.query(`
        CREATE OR REPLACE VIEW event_financial_summaries AS
        SELECT 
            e.event_id,
            e.name AS event_name,
            e.budget_estimate,
            COALESCE(alloc.total_alloc, 0) AS total_allocated_contributions,
            COALESCE(exp.total_exp, 0) AS total_approved_expenses
        FROM events e
        LEFT JOIN (
            SELECT event_id, SUM(allocated_amount) AS total_alloc 
            FROM contribution_allocations 
            WHERE status = 'Allocated' 
            GROUP BY event_id
        ) alloc ON e.event_id = alloc.event_id
        LEFT JOIN (
            SELECT event_id, SUM(amount) AS total_exp 
            FROM expenses 
            WHERE approval_status = 'Approved' 
            GROUP BY event_id
        ) exp ON e.event_id = exp.event_id;
      `);

      await sequelize.query(`DROP TRIGGER IF EXISTS trg_audit_expenses_update;`);
      await sequelize.query(`
        CREATE TRIGGER trg_audit_expenses_update
        AFTER UPDATE ON expenses
        FOR EACH ROW
        BEGIN
            INSERT INTO audit_history (entity_type, entity_id, action, changed_by_id, changed_by_role, timestamp, old_value, new_value)
            VALUES (
                'Expense', 
                OLD.expense_id, 
                'UPDATE', 
                NULL, 
                'Admin', 
                NOW(), 
                JSON_OBJECT('description', OLD.description, 'amount', OLD.amount, 'approval_status', OLD.approval_status, 'payment_status', OLD.payment_status), 
                JSON_OBJECT('description', NEW.description, 'amount', NEW.amount, 'approval_status', NEW.approval_status, 'payment_status', NEW.payment_status)
            );
        END;
      `);

      await sequelize.query(`DROP TRIGGER IF EXISTS trg_audit_expenses_delete;`);
      await sequelize.query(`
        CREATE TRIGGER trg_audit_expenses_delete
        AFTER DELETE ON expenses
        FOR EACH ROW
        BEGIN
            INSERT INTO audit_history (entity_type, entity_id, action, changed_by_id, changed_by_role, timestamp, old_value, new_value)
            VALUES (
                'Expense', 
                OLD.expense_id, 
                'DELETE', 
                NULL, 
                'Admin', 
                NOW(), 
                JSON_OBJECT('description', OLD.description, 'amount', OLD.amount, 'approval_status', OLD.approval_status, 'payment_status', OLD.payment_status), 
                NULL
            );
        END;
      `);

      // Seed default active Festival if none exist to prevent empty dropdown issues in organizer dashboard
      const festivalCount = await Festival.count();
      if (festivalCount === 0) {
        await Festival.create({
          name: 'Global Summer Jubilee 2026',
          location: 'City Grand Amphitheater',
          start_date: '2026-06-01',
          end_date: '2026-08-31'
        });
        console.log('Seeded default active Festival because none existed.');
      }

      console.log('Database Views and Triggers verified & synchronized successfully.');
    } catch (dbErr) {
      console.warn('Warning: Could not sync Database Views and Triggers:', dbErr.message);
    }

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection failed:', err);
  });

