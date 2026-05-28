-- SQL schema creation script for the Festival & Event Management System
CREATE DATABASE IF NOT EXISTS festival_db;
USE festival_db;

-- 1. Departments table
CREATE TABLE IF NOT EXISTS departments (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- 2. Organizers table (Handles Admin, Finance, Organizer roles)
CREATE TABLE IF NOT EXISTS organizers (
    organizer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('Admin', 'Finance', 'Organizer') NOT NULL,
    department_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL
);

-- 3. Festivals table
CREATE TABLE IF NOT EXISTS festivals (
    festival_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_festival_dates (start_date, end_date)
);

-- 4. Festival Organizers table (Tracks history of roles)
CREATE TABLE IF NOT EXISTS festival_organizers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organizer_id INT,
    festival_id INT,
    organizer_role_in_festival VARCHAR(100),
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (organizer_id) REFERENCES organizers(organizer_id) ON DELETE CASCADE,
    FOREIGN KEY (festival_id) REFERENCES festivals(festival_id) ON DELETE CASCADE,
    UNIQUE KEY uq_organizer_festival (organizer_id, festival_id)
);

-- 5. Events table (Linked to a Festival and Organizer)
CREATE TABLE IF NOT EXISTS events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    festival_id INT,
    organizer_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    date DATETIME NOT NULL,
    location VARCHAR(255),
    budget_estimate DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (festival_id) REFERENCES festivals(festival_id) ON DELETE CASCADE,
    FOREIGN KEY (organizer_id) REFERENCES organizers(organizer_id) ON DELETE SET NULL,
    INDEX idx_event_date (date)
);

-- 6. Contributors table (Handles Contributor role)
CREATE TABLE IF NOT EXISTS contributors (
    contributor_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    contributor_type ENUM('Individual', 'Organization', 'Service') NOT NULL,
    age INT,
    gender ENUM('Male', 'Female', 'Other', 'PreferNotToSay'),
    location VARCHAR(255),
    membership_status VARCHAR(50),
    preferred_communication VARCHAR(50),
    compliance_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. Contributions table
CREATE TABLE IF NOT EXISTS contributions (
    contribution_id INT AUTO_INCREMENT PRIMARY KEY,
    contributor_id INT,
    festival_id INT,
    amount DECIMAL(10, 2),
    contribution_type ENUM('Cash', 'In-Kind', 'Service') NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    attachment_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contributor_id) REFERENCES contributors(contributor_id) ON DELETE SET NULL,
    FOREIGN KEY (festival_id) REFERENCES festivals(festival_id) ON DELETE SET NULL
);

-- 8. Contribution Allocations table
CREATE TABLE IF NOT EXISTS contribution_allocations (
    allocation_id INT AUTO_INCREMENT PRIMARY KEY,
    contribution_id INT,
    event_id INT,
    allocated_item VARCHAR(255),
    allocated_amount DECIMAL(10, 2),
    allocation_date DATE NOT NULL,
    status ENUM('Allocated', 'Pending_Review', 'Used') DEFAULT 'Allocated',
    FOREIGN KEY (contribution_id) REFERENCES contributions(contribution_id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
);

-- 9. Vendors table (With password field for dashboard authentication)
CREATE TABLE IF NOT EXISTS vendors (
    vendor_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    service_type VARCHAR(100) NOT NULL,
    compliance_info TEXT,
    past_performance DECIMAL(3, 2) DEFAULT 5.00,
    compliance_status ENUM('Verified', 'Pending', 'Flagged') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 10. Expenses table (With two-level approval keys)
CREATE TABLE IF NOT EXISTS expenses (
    expense_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    vendor_id INT,
    description TEXT NOT NULL,
    expense_type VARCHAR(100),
    amount DECIMAL(10, 2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_status ENUM('Pending', 'Partial', 'Paid') DEFAULT 'Pending',
    approval_status ENUM('Pending', 'Recommended', 'Approved', 'Rejected') DEFAULT 'Pending',
    invoice_path VARCHAR(255),
    approved_by INT,
    recommended_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES organizers(organizer_id) ON DELETE SET NULL,
    FOREIGN KEY (recommended_by) REFERENCES organizers(organizer_id) ON DELETE SET NULL
);

-- 11. Volunteers table (Handles Volunteer role)
CREATE TABLE IF NOT EXISTS volunteers (
    volunteer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    skillset TEXT,
    age INT,
    gender ENUM('Male', 'Female', 'Other', 'PreferNotToSay'),
    location VARCHAR(255),
    membership_status VARCHAR(50),
    preferred_communication VARCHAR(50),
    compliance_info TEXT,
    past_participation TEXT,
    availability_schedule TEXT,
    certifications TEXT,
    certification_path VARCHAR(255),
    background_check_status ENUM('NotStarted', 'Pending', 'Passed', 'Failed') DEFAULT 'NotStarted',
    feedback_rating DECIMAL(3, 2) DEFAULT 5.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 12. Volunteer Assignments table
CREATE TABLE IF NOT EXISTS volunteer_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    volunteer_id INT,
    event_id INT,
    role VARCHAR(100) NOT NULL,
    assigned_date DATE,
    hours_committed INT,
    shift_time VARCHAR(100),
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(volunteer_id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
);

-- 13. Audit History table
CREATE TABLE IF NOT EXISTS audit_history (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    action ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    changed_by_id INT,
    changed_by_role ENUM('Admin', 'Finance', 'Organizer', 'Volunteer', 'Contributor', 'Vendor'),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_value JSON,
    new_value JSON,
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_time (timestamp)
);

-- --- SEED DATA ---
-- Password for all seeds is: password123
-- (Bcrypt hash: $2b$10$fVl6/ARaB.Mh8qgjsdY9S.N3qG5rOkXg8M0.B7K.G/N8sY.s9t.o2)

-- 1. Departments
INSERT INTO departments (name, description) VALUES
('Administration', 'Overall management and administration'),
('Finance', 'Handles all expenses, contributions, and budgets'),
('Logistics', 'Manages vendors, locations, and event setup'),
('Human Resources', 'Manages volunteers and organizers');

-- 2. Organizers
INSERT INTO organizers (name, email, password, role, department_id) VALUES
('Admin User', 'admin@fest.com', '$2b$10$KP2LG9mdOBhog5xLMz/xI.Erxg32KvAKu6hvLwYT0XiyYw9H1r0R2', 'Admin', 1),
('Finance User', 'finance@fest.com', '$2b$10$KP2LG9mdOBhog5xLMz/xI.Erxg32KvAKu6hvLwYT0XiyYw9H1r0R2', 'Finance', 2),
('Organizer User', 'organizer@fest.com', '$2b$10$KP2LG9mdOBhog5xLMz/xI.Erxg32KvAKu6hvLwYT0XiyYw9H1r0R2', 'Organizer', 3);

-- 3. Volunteer User
INSERT INTO volunteers (name, email, password, phone, skillset, background_check_status, availability_schedule) VALUES
('Valerie Volunteer', 'volunteer@fest.com', '$2b$10$KP2LG9mdOBhog5xLMz/xI.Erxg32KvAKu6hvLwYT0XiyYw9H1r0R2', '555-1234', 'First Aid, Crowd Control', 'Passed', 'Available Weekends and Evenings');

-- 4. Contributor User
INSERT INTO contributors (name, email, password, contributor_type) VALUES
('Connie Contributor', 'contributor@fest.com', '$2b$10$KP2LG9mdOBhog5xLMz/xI.Erxg32KvAKu6hvLwYT0XiyYw9H1r0R2', 'Individual');

-- 5. Vendor User
INSERT INTO vendors (name, email, password, phone, service_type, compliance_status) VALUES
('Vinnie Vendor', 'vendor@fest.com', '$2b$10$KP2LG9mdOBhog5xLMz/xI.Erxg32KvAKu6hvLwYT0XiyYw9H1r0R2', '555-9876', 'Logistics & Audio', 'Verified');

-- --- DATABASE VIEWS ---
-- View pre-aggregates event budget, cash allocations, and approved expenses
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

-- --- DATABASE TRIGGERS ---
-- Trigger automatically logs UPDATE actions on expenses table to audit_history
DROP TRIGGER IF EXISTS trg_audit_expenses_update;
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

-- Trigger automatically logs DELETE actions on expenses table to audit_history
DROP TRIGGER IF EXISTS trg_audit_expenses_delete;
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

