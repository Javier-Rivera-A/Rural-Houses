-- ============================================================
--  RURAL HOUSES - Script de datos de prueba para Neon
--  3 registros por tabla, respetando claves foráneas
-- ============================================================
--  Contraseña de todos los usuarios: password123
--  Cómo ejecutar:
--    npx neonctl@latest sql --file data-neon.sql
-- ============================================================

BEGIN;

-- ============================================================
-- 1. USERS
-- (base de owners y customers - herencia JOINED en JPA)
-- ============================================================
INSERT INTO users (id, user_name, password, email, phone, account_state, created_at) VALUES
  ('o1', 'propietario1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9y', 'p1@rural.com', '600100001', 'ACTIVE', CURRENT_DATE),
  ('o2', 'propietario2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9y', 'p2@rural.com', '600100002', 'ACTIVE', CURRENT_DATE),
  ('o3', 'propietario3', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9y', 'p3@rural.com', '600100003', 'ACTIVE', CURRENT_DATE),
  ('c1', 'cliente1',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9y', 'c1@rural.com', '600200001', 'ACTIVE', CURRENT_DATE),
  ('c2', 'cliente2',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9y', 'c2@rural.com', '600200002', 'ACTIVE', CURRENT_DATE),
  ('c3', 'cliente3',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9y', 'c3@rural.com', '600200003', 'ACTIVE', CURRENT_DATE);

-- ============================================================
-- 2. OWNERS  (hereda de users, mismo id)
-- ============================================================
INSERT INTO owners (id, access_word) VALUES
  ('o1', 'acceso001'),
  ('o2', 'acceso002'),
  ('o3', 'acceso003');

-- ============================================================
-- 3. CUSTOMERS  (hereda de users, mismo id)
-- ============================================================
INSERT INTO customers (id) VALUES ('c1'), ('c2'), ('c3');

-- ============================================================
-- 4. POPULATIONS
-- ============================================================
INSERT INTO populations (id, name, zip_code) VALUES
  ('p1', 'Salento',           '631001'),
  ('p2', 'Villa de Leyva',    '154001'),
  ('p3', 'Jardín',            '056001');

-- ============================================================
-- 5. COUNTRY_HOUSES
-- ============================================================
INSERT INTO country_houses (id, code, description, garage_places, private_bathrooms, public_bathrooms, state_country_house, owner_id, population_id) VALUES
  ('h1', 'CASA-101', 'Casa campestre en los Andes colombianos',    2, 3, 1, 'ACTIVE', 'o1', 'p1'),
  ('h2', 'CASA-102', 'Finca cafetera con vista al valle',           1, 2, 1, 'ACTIVE', 'o2', 'p2'),
  ('h3', 'CASA-103', 'Cabaña en zona de reserva natural',           0, 2, 2, 'ACTIVE', 'o3', 'p3');

-- ============================================================
-- 6. BEDROOMS
-- ============================================================
INSERT INTO bedrooms (id, bathroom, bedroom_code, number_beds, country_house_id) VALUES
  ('b1', true,  101, 2, 'h1'),
  ('b2', false, 201, 3, 'h2'),
  ('b3', true,  301, 1, 'h3');

-- ============================================================
-- 7. BEDROOM_BED_TYPES
-- ============================================================
INSERT INTO bedroom_bed_types (bedroom_id, type_of_bed) VALUES
  ('b1', 'DOUBLE'),
  ('b2', 'SIMPLE'),
  ('b3', 'DOUBLE');

-- ============================================================
-- 8. KITCHENS  (comedores/cocinas)
-- ============================================================
INSERT INTO kitchens (id_cocina, dish_washer, washing_machine, country_house_id) VALUES
  ('k1', true,  true,  'h1'),
  ('k2', false, true,  'h2'),
  ('k3', true,  false, 'h3');

-- ============================================================
-- 9. PHOTOS
-- ============================================================
INSERT INTO photos (id, url, description, country_house_id) VALUES
  ('ph1', 'https://example.com/casa101.jpg', 'Fachada exterior',     'h1'),
  ('ph2', 'https://example.com/casa102.jpg', 'Vista desde terraza',  'h2'),
  ('ph3', 'https://example.com/casa103.jpg', 'Área de descanso',     'h3');

-- ============================================================
-- 10. RENTAL_PACKAGES
-- ============================================================
INSERT INTO rental_packages (id, starting_date, ending_date, price_night, type_rental, country_house_id) VALUES
  ('rp1', '2025-06-01', '2025-06-30', 80.0, 'ENTIRE_HOUSE', 'h1'),
  ('rp2', '2025-07-01', '2025-07-31', 60.0, 'ROOMS',        'h2'),
  ('rp3', '2025-08-01', '2025-08-31', 70.0, 'BOTH',         'h3');

-- ============================================================
-- 11. RENTALS
-- ============================================================
INSERT INTO rentals (id, rental_code, check_in_date, check_out_date, rental_day_made, number_nights, total_price, contact_phone_number, state, country_house_id, customer_id) VALUES
  ('r1', 'RNT-001', '2025-06-05', '2025-06-08', '2025-05-01', 3, 240.0, '3101000001', 'CONFIRMED', 'h1', 'c1'),
  ('r2', 'RNT-002', '2025-07-10', '2025-07-14', '2025-06-15', 4, 240.0, '3101000002', 'PENDING',   'h2', 'c2'),
  ('r3', 'RNT-003', '2025-08-20', '2025-08-23', '2025-07-20', 3, 210.0, '3101000003', 'PENDING',   'h3', 'c3');

-- ============================================================
-- 12. RENTAL_PLACE_IDS  (tablilla de habitaciones ocupadas)
-- ============================================================
INSERT INTO rental_place_ids (rental_id, place_id) VALUES
  ('r1', 'b1'),
  ('r2', 'b2'),
  ('r3', 'b3');

-- ============================================================
-- 13. BANK_ACCOUNTS
-- ============================================================
INSERT INTO bank_accounts (id, bank, number_account, mount, account_type, user_id) VALUES
  ('ba1', 'Bancolombia', '200-300-401', 5000.0, 'AHORROS',   'o1'),
  ('ba2', 'Davivienda',  '200-300-402', 3200.0, 'AHORROS',   'o2'),
  ('ba3', 'BBVA',        '200-300-403', 7800.0, 'CORRIENTE', 'o3');

-- ============================================================
-- 14. PAYMENTS
-- (rental_ref_id = código del alquiler como referencia de texto)
-- ============================================================
INSERT INTO payments (id, amount, paid_date, paid_state, rental_ref_id, bank_account_id, rental_id) VALUES
  ('pay1', 240.0, '2025-05-02', 'CONFIRMED', 'RNT-001', 'ba1', 'r1'),
  ('pay2', 240.0, '2025-06-16', 'PENDING',   'RNT-002', 'ba2', 'r2'),
  ('pay3', 210.0, '2025-07-21', 'PENDING',   'RNT-003', 'ba3', 'r3');

COMMIT;

-- Verificar que se insertaron los datos:
-- SELECT 'users'           AS tabla, COUNT(*) FROM users;
-- SELECT 'owners'          AS tabla, COUNT(*) FROM owners;
-- SELECT 'customers'       AS tabla, COUNT(*) FROM customers;
-- SELECT 'populations'     AS tabla, COUNT(*) FROM populations;
-- SELECT 'country_houses'  AS tabla, COUNT(*) FROM country_houses;
-- SELECT 'bedrooms'        AS tabla, COUNT(*) FROM bedrooms;
-- SELECT 'kitchens'        AS tabla, COUNT(*) FROM kitchens;
-- SELECT 'photos'          AS tabla, COUNT(*) FROM photos;
-- SELECT 'rental_packages' AS tabla, COUNT(*) FROM rental_packages;
-- SELECT 'rentals'         AS tabla, COUNT(*) FROM rentals;
-- SELECT 'bank_accounts'   AS tabla, COUNT(*) FROM bank_accounts;
-- SELECT 'payments'        AS tabla, COUNT(*) FROM payments;
