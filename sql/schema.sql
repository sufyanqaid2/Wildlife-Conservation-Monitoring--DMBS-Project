-- ============================================================
--  WILDLIFE CONSERVATION MONITORING SYSTEM
--  Database: PostgreSQL (Supabase)
--  Course: CMPE344 -- Cyprus International University
-- ============================================================


-- ============================================================
--  PART 1: DDL -- CREATE TABLES
--  Run these in order. Do not change the order.
-- ============================================================

-- Table 1: zones (no foreign keys, create first)
CREATE TABLE zones (
    zone_id      SERIAL PRIMARY KEY,
    zone_name    VARCHAR(100) NOT NULL,
    area_km2     NUMERIC(10,2) CHECK (area_km2 > 0),
    habitat_type VARCHAR(50)  NOT NULL DEFAULT 'forest'
                 CHECK (habitat_type IN ('forest','grassland','wetland','desert')),
    country      VARCHAR(100) NOT NULL DEFAULT 'Unknown'
);

-- Table 2: users (no foreign keys, create second)
CREATE TABLE users (
    user_id    SERIAL PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    email      VARCHAR(100) UNIQUE,
    role       VARCHAR(20)  NOT NULL DEFAULT 'viewer'
               CHECK (role IN ('admin','ranger','researcher','viewer')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table 3: animals (needs zones)
CREATE TABLE animals (
    animal_id  SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    species    VARCHAR(100) NOT NULL,
    gender     VARCHAR(10)  DEFAULT 'unknown'
               CHECK (gender IN ('male','female','unknown')),
    birth_year INT          CHECK (birth_year > 1900 AND birth_year <= 2026),
    status     VARCHAR(20)  NOT NULL DEFAULT 'alive'
               CHECK (status IN ('alive','dead','unknown')),
    zone_id    INT REFERENCES zones(zone_id) ON DELETE SET NULL
);

-- Table 4: rangers (needs users and zones)
CREATE TABLE rangers (
    ranger_id  SERIAL PRIMARY KEY,
    user_id    INT  NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    zone_id    INT  REFERENCES zones(zone_id) ON DELETE SET NULL,
    full_name  VARCHAR(100) NOT NULL,
    phone      VARCHAR(20),
    hire_date  DATE DEFAULT CURRENT_DATE
);

-- Table 5: sightings (needs animals, users, zones)
CREATE TABLE sightings (
    sighting_id   SERIAL PRIMARY KEY,
    animal_id     INT  NOT NULL REFERENCES animals(animal_id) ON DELETE CASCADE,
    user_id       INT  NOT NULL REFERENCES users(user_id),
    zone_id       INT  REFERENCES zones(zone_id),
    sighting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    count_seen    INT  NOT NULL DEFAULT 1 CHECK (count_seen >= 1),
    notes         TEXT
);

-- Table 6: health_records (needs animals and users)
CREATE TABLE health_records (
    record_id     SERIAL PRIMARY KEY,
    animal_id     INT          NOT NULL REFERENCES animals(animal_id) ON DELETE CASCADE,
    user_id       INT          NOT NULL REFERENCES users(user_id),
    check_date    DATE         NOT NULL DEFAULT CURRENT_DATE,
    health_status VARCHAR(20)  NOT NULL DEFAULT 'healthy'
                  CHECK (health_status IN ('healthy','sick','injured','recovering')),
    weight_kg     NUMERIC(8,2) CHECK (weight_kg > 0),
    notes         TEXT
);

-- Table 7: threats (needs zones and users)
CREATE TABLE threats (
    threat_id   SERIAL PRIMARY KEY,
    zone_id     INT         NOT NULL REFERENCES zones(zone_id) ON DELETE CASCADE,
    reported_by INT         NOT NULL REFERENCES users(user_id),
    threat_type VARCHAR(50) NOT NULL
                CHECK (threat_type IN ('poaching','fire','flood','drought','disease')),
    severity    VARCHAR(10) NOT NULL DEFAULT 'low'
                CHECK (severity IN ('low','medium','high')),
    report_date DATE        NOT NULL DEFAULT CURRENT_DATE,
    resolved    BOOLEAN     NOT NULL DEFAULT FALSE
);


-- ============================================================
--  PART 2: DML -- INSERT SAMPLE DATA
--  Run these after creating all tables.
-- ============================================================

-- Insert zones
INSERT INTO zones (zone_name, area_km2, habitat_type, country) VALUES
('North Forest',   250.50, 'forest',    'Kenya'),
('South Plains',   180.00, 'grassland', 'Kenya'),
('East Wetlands',   95.30, 'wetland',   'Tanzania'),
('West Desert',    310.00, 'desert',    'Namibia'),
('Central Reserve',120.00, 'forest',    'Uganda');

-- Insert users
INSERT INTO users (username, password, email, role) VALUES
('admin1',      'pass123', 'admin@wild.org',     'admin'),
('ranger_tom',  'pass123', 'tom@wild.org',       'ranger'),
('ranger_sara', 'pass123', 'sara@wild.org',      'ranger'),
('dr_james',    'pass123', 'james@wild.org',     'researcher'),
('viewer1',     'pass123', 'viewer1@wild.org',   'viewer');

-- Insert animals
INSERT INTO animals (name, species, gender, birth_year, status, zone_id) VALUES
('Leo',   'Lion',     'male',    2015, 'alive',   1),
('Ella',  'Elephant', 'female',  2010, 'alive',   2),
('Zara',  'Zebra',    'female',  2018, 'alive',   2),
('Rocky', 'Rhino',    'male',    2008, 'alive',   3),
('Mia',   'Cheetah',  'female',  2019, 'alive',   1),
('Titan', 'Giraffe',  'male',    2012, 'unknown', 4),
('Bora',  'Buffalo',  'male',    2016, 'alive',   5),
('Lena',  'Leopard',  'female',  2017, 'alive',   1);

-- Insert rangers
INSERT INTO rangers (user_id, zone_id, full_name, phone, hire_date) VALUES
(2, 1, 'Tom Green',  '+254700001111', '2020-03-15'),
(3, 2, 'Sara White', '+254700002222', '2021-06-01');

-- Insert sightings
INSERT INTO sightings (animal_id, user_id, zone_id, sighting_date, count_seen, notes) VALUES
(1, 2, 1, '2026-04-01', 1, 'Leo seen near the river'),
(2, 3, 2, '2026-04-02', 3, 'Group of elephants moving south'),
(3, 2, 2, '2026-04-03', 5, 'Zebra herd at the water hole'),
(4, 3, 3, '2026-04-04', 1, 'Rocky alone near the trees'),
(5, 2, 1, '2026-04-05', 2, 'Two cheetahs running fast'),
(1, 3, 1, '2026-04-06', 1, 'Leo again, looks strong'),
(6, 2, 4, '2026-04-07', 1, 'Titan spotted at sunrise'),
(7, 3, 5, '2026-04-08', 4, 'Buffalo group drinking water'),
(8, 2, 1, '2026-04-09', 1, 'Lena resting on a rock'),
(2, 2, 2, '2026-04-10', 2, 'Two elephants seen again');

-- Insert health records
INSERT INTO health_records (animal_id, user_id, check_date, health_status, weight_kg, notes) VALUES
(1, 4, '2026-04-01', 'healthy',    190.50, 'Good weight, teeth look normal'),
(2, 4, '2026-04-02', 'healthy',   4200.00, 'Very strong and active'),
(3, 4, '2026-04-03', 'healthy',    320.00, 'No problems found'),
(4, 4, '2026-04-04', 'injured',   1100.00, 'Cut on the left back leg'),
(5, 4, '2026-04-05', 'recovering',  55.30, 'Was sick last week, now better'),
(6, 4, '2026-04-06', 'healthy',    900.00, 'Titan looks good'),
(7, 4, '2026-04-07', 'sick',       620.00, 'Signs of fever, needs watching'),
(8, 4, '2026-04-08', 'healthy',     62.00, 'Lena is in great shape');

-- Insert threats
INSERT INTO threats (zone_id, reported_by, threat_type, severity, report_date, resolved) VALUES
(1, 2, 'poaching', 'high',   '2026-04-01', FALSE),
(2, 3, 'drought',  'medium', '2026-04-02', FALSE),
(3, 2, 'flood',    'low',    '2026-04-03', TRUE),
(4, 1, 'fire',     'high',   '2026-04-04', FALSE),
(5, 3, 'disease',  'medium', '2026-04-05', FALSE);

-- UPDATE examples
UPDATE animals  SET status   = 'dead'  WHERE animal_id = 6;
UPDATE threats  SET resolved = TRUE    WHERE threat_id = 1;
UPDATE animals  SET zone_id  = 2       WHERE animal_id = 3;
UPDATE users    SET password = 'newpass999' WHERE username = 'viewer1';

-- DELETE examples
DELETE FROM threats  WHERE resolved = TRUE AND severity = 'low';
DELETE FROM sightings WHERE notes = 'test entry';


-- ============================================================
--  PART 3: SQL QUERIES (5-7 required)
-- ============================================================

-- Query 1: Total sightings per animal (JOIN + GROUP BY + COUNT + SUM)
-- Shows which animals are seen the most
SELECT
    a.name                        AS animal_name,
    a.species,
    COUNT(s.sighting_id)          AS total_sightings,
    SUM(s.count_seen)             AS total_animals_seen
FROM animals a
JOIN sightings s ON a.animal_id = s.animal_id
GROUP BY a.name, a.species
ORDER BY total_sightings DESC;


-- Query 2: Number of animals per zone with habitat type (LEFT JOIN + GROUP BY)
-- Helps management see which zones have the most animals
SELECT
    z.zone_name,
    z.habitat_type,
    z.country,
    COUNT(a.animal_id)            AS animal_count
FROM zones z
LEFT JOIN animals a ON z.zone_id = a.zone_id
GROUP BY z.zone_name, z.habitat_type, z.country
ORDER BY animal_count DESC;


-- Query 3: Average weight per species from health records (JOIN + AVG + GROUP BY)
-- Shows the average weight of each species
SELECT
    a.species,
    ROUND(AVG(h.weight_kg), 2)    AS avg_weight_kg,
    ROUND(MIN(h.weight_kg), 2)    AS min_weight_kg,
    ROUND(MAX(h.weight_kg), 2)    AS max_weight_kg,
    COUNT(h.record_id)            AS total_checks
FROM animals a
JOIN health_records h ON a.animal_id = h.animal_id
GROUP BY a.species
ORDER BY avg_weight_kg DESC;


-- Query 4: All unresolved high severity threats with zone info (JOIN + WHERE + ORDER BY)
-- Critical report for management: active dangers in each zone
SELECT
    z.zone_name,
    z.country,
    t.threat_type,
    t.severity,
    t.report_date,
    u.username                    AS reported_by,
    u.role
FROM threats t
JOIN zones z ON t.zone_id     = z.zone_id
JOIN users u ON t.reported_by = u.user_id
WHERE t.severity IN ('high','medium')
  AND t.resolved = FALSE
ORDER BY t.report_date DESC;


-- Query 5: Search all sightings by a specific user ID (required from project notes)
-- Replace 2 with any user_id to search
SELECT
    u.username,
    u.role,
    a.name                        AS animal_name,
    a.species,
    s.sighting_date,
    s.count_seen,
    s.notes,
    z.zone_name
FROM sightings s
JOIN users   u ON s.user_id   = u.user_id
JOIN animals a ON s.animal_id = a.animal_id
JOIN zones   z ON s.zone_id   = z.zone_id
WHERE u.user_id = 2
ORDER BY s.sighting_date DESC;


-- Query 6: Search sightings by zone name / address (required from project notes)
-- Replace 'forest' with any zone name or part of a name
SELECT
    z.zone_name,
    z.habitat_type,
    a.name                        AS animal_name,
    a.species,
    s.sighting_date,
    s.count_seen,
    u.username                    AS reported_by
FROM sightings s
JOIN zones   z ON s.zone_id   = z.zone_id
JOIN animals a ON s.animal_id = a.animal_id
JOIN users   u ON s.user_id   = u.user_id
WHERE LOWER(z.zone_name) LIKE LOWER('%forest%')
ORDER BY s.sighting_date DESC;


-- Query 7: Animals not seen in the last 30 days -- conservation alert (subquery)
-- Finds alive animals with no recent sighting -- needs attention
SELECT
    a.animal_id,
    a.name,
    a.species,
    a.status,
    z.zone_name
FROM animals a
LEFT JOIN zones z ON a.zone_id = z.zone_id
WHERE a.animal_id NOT IN (
    SELECT DISTINCT animal_id
    FROM sightings
    WHERE sighting_date >= CURRENT_DATE - INTERVAL '30 days'
)
AND a.status = 'alive'
ORDER BY a.name;


-- ============================================================
--  PART 4: PL/SQL BLOCKS (5 required)
--  Written in PL/pgSQL for PostgreSQL / Supabase
-- ============================================================

-- ------------------------------------
-- Block 1: PROCEDURE -- Search sightings by user ID
-- ------------------------------------
CREATE OR REPLACE PROCEDURE get_sightings_by_user(p_user_id INT)
LANGUAGE plpgsql AS $$
DECLARE
    v_username VARCHAR;
    v_count    INT;
BEGIN
    -- Get the username
    SELECT username INTO v_username
    FROM users WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE NOTICE 'No user found with ID = %', p_user_id;
        RETURN;
    END IF;

    -- Count sightings for this user
    SELECT COUNT(*) INTO v_count
    FROM sightings WHERE user_id = p_user_id;

    RAISE NOTICE 'User: % | Total sightings reported: %', v_username, v_count;
END;
$$;

-- How to call:
CALL get_sightings_by_user(2);
-- Output: User: ranger_tom | Total sightings reported: 5


-- ------------------------------------
-- Block 2: PROCEDURE -- Search animals by zone name (address)
-- ------------------------------------
CREATE OR REPLACE PROCEDURE search_by_zone(p_zone_name VARCHAR)
LANGUAGE plpgsql AS $$
DECLARE
    v_zone_id   INT;
    v_zone_name VARCHAR;
    v_count     INT;
BEGIN
    -- Find the zone
    SELECT zone_id, zone_name INTO v_zone_id, v_zone_name
    FROM zones
    WHERE LOWER(zone_name) LIKE LOWER('%' || p_zone_name || '%')
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE NOTICE 'No zone found matching: %', p_zone_name;
        RETURN;
    END IF;

    -- Count animals in this zone
    SELECT COUNT(*) INTO v_count
    FROM animals WHERE zone_id = v_zone_id;

    RAISE NOTICE 'Zone found: % | Animals living here: %', v_zone_name, v_count;
END;
$$;

-- How to call:
CALL search_by_zone('Forest');
-- Output: Zone found: North Forest | Animals living here: 3


-- ------------------------------------
-- Block 3: PROCEDURE -- Add a new sighting record
-- ------------------------------------
CREATE OR REPLACE PROCEDURE add_sighting(
    p_animal_id INT,
    p_user_id   INT,
    p_zone_id   INT,
    p_count     INT,
    p_notes     TEXT
)
LANGUAGE plpgsql AS $$
DECLARE
    v_animal_name VARCHAR;
BEGIN
    -- Check the animal exists
    SELECT name INTO v_animal_name
    FROM animals WHERE animal_id = p_animal_id;

    IF NOT FOUND THEN
        RAISE NOTICE 'Animal with ID % does not exist.', p_animal_id;
        RETURN;
    END IF;

    -- Insert the sighting
    INSERT INTO sightings (animal_id, user_id, zone_id, count_seen, notes)
    VALUES (p_animal_id, p_user_id, p_zone_id, p_count, p_notes);

    RAISE NOTICE 'Sighting added for animal: % (ID = %)', v_animal_name, p_animal_id;
END;
$$;

-- How to call:
CALL add_sighting(1, 2, 1, 1, 'Leo seen near the north river at 7am');
-- Output: Sighting added for animal: Leo (ID = 1)


-- ------------------------------------
-- Block 4: FUNCTION -- Count total sightings for one animal
-- ------------------------------------
CREATE OR REPLACE FUNCTION count_animal_sightings(p_animal_id INT)
RETURNS INT
LANGUAGE plpgsql AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM sightings
    WHERE animal_id = p_animal_id;

    RETURN v_count;
END;
$$;

-- How to call:
SELECT count_animal_sightings(1) AS leo_sighting_count;
-- Output: leo_sighting_count = 2


-- ------------------------------------
-- Block 5: TRIGGER -- Auto-update animal status after health check
-- When a health record is inserted with status 'sick' or 'injured',
-- the trigger automatically changes the animal status to 'unknown'
-- ------------------------------------
CREATE OR REPLACE FUNCTION update_animal_status_on_health()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_animal_name VARCHAR;
BEGIN
    SELECT name INTO v_animal_name
    FROM animals WHERE animal_id = NEW.animal_id;

    IF NEW.health_status IN ('sick', 'injured') THEN
        UPDATE animals
        SET status = 'unknown'
        WHERE animal_id = NEW.animal_id;

        RAISE NOTICE 'TRIGGER: Animal "%" status changed to unknown due to health status: %',
                     v_animal_name, NEW.health_status;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_animal_health_update
AFTER INSERT ON health_records
FOR EACH ROW
EXECUTE FUNCTION update_animal_status_on_health();

-- How to test the trigger:
INSERT INTO health_records (animal_id, user_id, check_date, health_status, weight_kg, notes)
VALUES (1, 4, CURRENT_DATE, 'injured', 185.0, 'Leo has a wound on right leg');
-- Output: TRIGGER: Animal "Leo" status changed to unknown due to health status: injured
-- Check result:
SELECT animal_id, name, status FROM animals WHERE animal_id = 1;


-- ============================================================
--  END OF FILE
-- ============================================================
