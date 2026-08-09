-- ======================================================================
-- CMSCE AI-Powered Complaint Management System - Supabase / Postgres Schema
-- ======================================================================

-- 1. ENUM DEFINITIONS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('STUDENT', 'ADMIN', 'DEPT_HEAD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE department_code AS ENUM ('CANTEEN', 'TRANSPORT', 'HOSTEL', 'SPORTS', 'ACADEMIC', 'HOSPITALITY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM ('Critical', 'High', 'Medium', 'Low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('Submitted', 'AI Analysed', 'Assigned', 'In Progress', 'Resolution Pending Verification', 'Resolved', 'Reopened', 'Closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE announcement_type AS ENUM ('HOLIDAY_GENERAL', 'EMERGENCY_ALERT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE announcement_priority AS ENUM ('NORMAL', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE target_aud AS ENUM ('ALL_STUDENTS', 'ALL_DEPT_HEADS', 'SPECIFIC_DEPT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- 2. TRIGGER FUNCTION FOR STATUS CHANGE AUDIT LOGGING
CREATE OR REPLACE FUNCTION fn_log_complaint_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO complaints_complainthistory (id, complaint_id, changed_by_id, old_status, new_status, remarks, timestamp)
        VALUES (
            gen_random_uuid(),
            NEW.id,
            NULL,
            OLD.status::text,
            NEW.status::text,
            CONCAT('Status changed from ', OLD.status::text, ' to ', NEW.status::text),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_complaint_history ON complaints_complaint;
CREATE TRIGGER trg_log_complaint_history
AFTER UPDATE OF status ON complaints_complaint
FOR EACH ROW EXECUTE FUNCTION fn_log_complaint_history();


-- 3. ADMIN DASHBOARD METRICS VIEW (Calculates avg resolution using resolved_at - created_at)
CREATE OR REPLACE VIEW admin_dashboard_metrics AS
SELECT
    (SELECT COUNT(*) FROM complaints_complaint WHERE status::text IN ('Submitted', 'AI Analysed', 'Assigned', 'In Progress', 'Resolution Pending Verification', 'Reopened')) AS total_open_tickets,
    (SELECT COUNT(*) FROM complaints_complaint WHERE priority::text = 'Critical' AND status::text IN ('Submitted', 'AI Analysed', 'Assigned', 'In Progress', 'Resolution Pending Verification', 'Reopened')) AS critical_escalations,
    (SELECT COUNT(*) FROM complaints_complaint WHERE is_sla_breached = TRUE) AS sla_breaches,
    COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600.0)::numeric, 1), 0.0) AS avg_resolution_time_hours
FROM complaints_complaint;


-- 4. ROW LEVEL SECURITY (RLS) POLICIES ON DJANGO TABLES
ALTER TABLE complaints_customuser ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints_department ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints_complaint ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints_complainthistory ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints_announcement ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Departments are readable by everyone" ON complaints_department;
CREATE POLICY "Departments are readable by everyone" ON complaints_department FOR SELECT USING (true);

DROP POLICY IF EXISTS "Profiles are readable by everyone" ON complaints_customuser;
CREATE POLICY "Profiles are readable by everyone" ON complaints_customuser FOR SELECT USING (true);

DROP POLICY IF EXISTS "Students can read own complaints" ON complaints_complaint;
CREATE POLICY "Students can read own complaints" ON complaints_complaint FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update all complaints" ON complaints_complaint;
CREATE POLICY "Admins can update all complaints" ON complaints_complaint FOR ALL USING (true);


-- 5. SEED DATA
-- 6 Departments
INSERT INTO complaints_department (id, name, code) VALUES
('9491cbcb-1e60-4b8c-9d0b-18e0757fa536', 'Canteen Operations', 'CANTEEN'),
('51b70110-ae85-43bd-89a4-ff08a300821d', 'Campus Transport', 'TRANSPORT'),
('a188fe0f-68bb-4e13-a9b2-051be2596a0a', 'Hostel Management', 'HOSTEL'),
('c543cb75-fd49-4297-aba9-3afc6a0648bb', 'Sports and Athletics', 'SPORTS'),
('c44194df-23f4-4741-8c93-e101df322fda', 'Academic Affairs', 'ACADEMIC'),
('e8fe2c6d-57d3-4951-bc94-ff0e91872ab7', 'Hospitality Services', 'HOSPITALITY')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;

-- Profiles
INSERT INTO complaints_customuser (id, password, is_superuser, username, first_name, last_name, is_staff, is_active, date_joined, email, full_name, reg_number, role, department_id) VALUES
('958f5f78-4980-439c-a1cf-a63eadefeb19', 'pbkdf2_sha256$1000000$l0V8XXE8pAhHPwhllmz5Tj$Mlws2p1XxkmgeXQyp8mOjDQXztHzDEqEopSmNA4G8sk', true, 'admin@cmsce.edu', 'Admin', 'User', true, true, NOW(), 'admin@cmsce.edu', 'Admin System User', 'ADM-001', 'ADMIN', NULL),
('a1111111-1111-1111-1111-111111111111', 'pbkdf2_sha256$1000000$jtyfOypqkAAaR9Giqdx9VR$YY+pYHqOQ4fsdpdVnNWiA6h63pCGrDPtb1v90GigDB4', false, 'student1@cmsce.edu', 'Amit', 'Verma', false, true, NOW(), 'student1@cmsce.edu', 'Amit Verma', '2024-EE-45', 'STUDENT', NULL),
('b2222222-2222-2222-2222-222222222222', 'pbkdf2_sha256$1000000$R4Bh9gxj8VxbvRCTLKi41t$D/VJaP0n0Z+bnT9LiqfnIcOgB6xRQyM1RxkFY0lygRU', false, 'canteen_head@cmsce.edu', 'Suresh', 'Kumar', true, true, NOW(), 'canteen_head@cmsce.edu', 'Chef Suresh Kumar', 'STAFF-01', 'DEPT_HEAD', '9491cbcb-1e60-4b8c-9d0b-18e0757fa536')
ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, password = EXCLUDED.password;

UPDATE complaints_department SET head_user_id = 'b2222222-2222-2222-2222-222222222222' WHERE id = '9491cbcb-1e60-4b8c-9d0b-18e0757fa536';

-- Complaints (including Ticket #1042)
INSERT INTO complaints_complaint (id, ticket_id, student_id, title, description, category, priority, status, assigned_department_id, is_anonymous, sla_deadline_at, is_sla_breached, ai_confidence_score, ai_routing_reasoning, created_at, updated_at) VALUES
('c1042000-0000-0000-0000-000000001042', 'CMP-1042', 'a1111111-1111-1111-1111-111111111111', 'Metal in Canteen Lunch', 'Piece of metal found in Block C lunch today', 'Food / Safety Hazard', 'Critical', 'AI Analysed', '9491cbcb-1e60-4b8c-9d0b-18e0757fa536', false, NOW() + INTERVAL '4 hours', false, 97.0, 'Metal contamination in food is a critical safety risk', NOW() - INTERVAL '30 minutes', NOW()),
('c3921000-0000-0000-0000-000000003921', 'CMS-3921', 'a1111111-1111-1111-1111-111111111111', 'Substandard Lunch Quality', 'Unfresh vegetables served in afternoon mess lunch.', 'Food / Safety Hazard', 'Critical', 'In Progress', '9491cbcb-1e60-4b8c-9d0b-18e0757fa536', false, NOW() - INTERVAL '2 hours', true, 98.2, 'AI routed based on canteen mess keywords', NOW() - INTERVAL '6 hours', NOW()),
('c3922000-0000-0000-0000-000000003922', 'CMS-3922', 'a1111111-1111-1111-1111-111111111111', 'Route 4 Bus Delay', 'College bus for Route 4 was delayed by 45 minutes.', 'Transport', 'High', 'AI Analysed', '51b70110-ae85-43bd-89a4-ff08a300821d', false, NOW() + INTERVAL '22 hours', false, 96.5, 'Matched Route 4 transport keywords', NOW() - INTERVAL '2 hours', NOW()),
('c3923000-0000-0000-0000-000000003923', 'CMS-3923', 'a1111111-1111-1111-1111-111111111111', 'Water Outage in Block-C', 'Hostel Block-C has had no running water.', 'Hostel', 'Critical', 'Assigned', 'a188fe0f-68bb-4e13-a9b2-051be2596a0a', false, NOW() + INTERVAL '3 hours', false, 99.1, 'Matched Hostel Block C water outage keywords', NOW() - INTERVAL '1 hour', NOW()),
('c3924000-0000-0000-0000-000000003924', 'CMS-3924', 'a1111111-1111-1111-1111-111111111111', 'Defective Cricket Kits', 'Issued cracked bats for inter-college matches.', 'Sports', 'Low', 'Submitted', 'c543cb75-fd49-4297-aba9-3afc6a0648bb', false, NOW() + INTERVAL '160 hours', false, 95.0, 'Matched Sports equipment keywords', NOW() - INTERVAL '8 hours', NOW()),
('c3925000-0000-0000-0000-000000003925', 'CMS-3925', 'a1111111-1111-1111-1111-111111111111', 'Midterm Grade Discrepancy', 'CS-301 Midterm exam marksheets contain typo errors.', 'Academic', 'Medium', 'In Progress', 'c44194df-23f4-4741-8c93-e101df322fda', false, NOW() - INTERVAL '5 hours', true, 97.8, 'Matched CS-301 Academic keywords', NOW() - INTERVAL '77 hours', NOW()),
('c3926000-0000-0000-0000-000000003926', 'CMS-3926', 'a1111111-1111-1111-1111-111111111111', 'Lounge AC Malfunctioning', 'Guest house lounge air conditioning blowing hot air.', 'Hospitality', 'Medium', 'Resolved', 'e8fe2c6d-57d3-4951-bc94-ff0e91872ab7', false, NOW() + INTERVAL '12 hours', false, 94.6, 'Matched Guest house lounge hospitality keywords', NOW() - INTERVAL '20 hours', NOW())
ON CONFLICT (id) DO NOTHING;

UPDATE complaints_complaint SET resolved_at = NOW() - INTERVAL '2 hours' WHERE ticket_id = 'CMS-3926';

-- 5 History Rows
INSERT INTO complaints_complainthistory (id, complaint_id, changed_by_id, old_status, new_status, remarks, timestamp) VALUES
('b1000000-0000-0000-0000-000000000001', 'c1042000-0000-0000-0000-000000001042', '958f5f78-4980-439c-a1cf-a63eadefeb19', 'Submitted', 'AI Analysed', 'AI Engine auto-classified complaint text.', NOW() - INTERVAL '25 minutes'),
('b1000000-0000-0000-0000-000000000002', 'c3921000-0000-0000-0000-000000003921', '958f5f78-4980-439c-a1cf-a63eadefeb19', 'Submitted', 'AI Analysed', 'Auto-routed to Canteen Department.', NOW() - INTERVAL '5 hours'),
('b1000000-0000-0000-0000-000000000003', 'c3921000-0000-0000-0000-000000003921', 'b2222222-2222-2222-2222-222222222222', 'AI Analysed', 'Assigned', 'Assigned to head chef.', NOW() - INTERVAL '4 hours'),
('b1000000-0000-0000-0000-000000000004', 'c3921000-0000-0000-0000-000000003921', 'b2222222-2222-2222-2222-222222222222', 'Assigned', 'In Progress', 'Inspection underway in canteen kitchen.', NOW() - INTERVAL '3 hours'),
('b1000000-0000-0000-0000-000000000005', 'c3926000-0000-0000-0000-000000003926', '958f5f78-4980-439c-a1cf-a63eadefeb19', 'In Progress', 'Resolved', 'AC compressor unit replaced by maintenance team.', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- 2 Announcements
INSERT INTO complaints_announcement (id, title, message, type, priority, target_audience, department_id, created_by_id, created_at) VALUES
('a9812000-0000-0000-0000-000000009812', 'Hostel Water Supply Maintenance Notice', 'Maintenance Notice: C-Block Hostel water supply will be suspended on Aug 10 from 9:00 AM to 1:00 PM for pipeline repairs.', 'EMERGENCY_ALERT', 'URGENT', 'ALL_STUDENTS', 'a188fe0f-68bb-4e13-a9b2-051be2596a0a', '958f5f78-4980-439c-a1cf-a63eadefeb19', NOW() - INTERVAL '1 day'),
('a9811000-0000-0000-0000-000000009811', 'Bus Route 4 Timetable Schedule Change', 'Please note: Bus Route 4 will depart 15 minutes earlier starting tomorrow due to highway construction delays.', 'HOLIDAY_GENERAL', 'NORMAL', 'SPECIFIC_DEPT', '51b70110-ae85-43bd-89a4-ff08a300821d', '958f5f78-4980-439c-a1cf-a63eadefeb19', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;
