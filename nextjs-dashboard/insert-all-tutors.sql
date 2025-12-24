-- Insert All Tutors into Supabase
-- This script creates users and tutors for all tutors from the schedule
-- Run this in Supabase SQL Editor

-- ============================================
-- INSERT USERS (if not exists)
-- ============================================

INSERT INTO users (email, full_name, role, active)
VALUES
    ('aizireka@tutor.gannon.edu', 'Aizirek A', 'tutor', true),
    ('alixa@tutor.gannon.edu', 'Alix A', 'tutor', true),
    ('avishm@tutor.gannon.edu', 'Avish M', 'tutor', true),
    ('baileyh@tutor.gannon.edu', 'Bailey H', 'tutor', true),
    ('blossoma@tutor.gannon.edu', 'Blossom A', 'tutor', true),
    ('camrynb@tutor.gannon.edu', 'Camryn B', 'tutor', true),
    ('clarab@tutor.gannon.edu', 'Clara B', 'tutor', true),
    ('claudiao@tutor.gannon.edu', 'Claudia O', 'tutor', true),
    ('elizabethh@tutor.gannon.edu', 'Elizabeth H', 'tutor', true),
    ('emilyb@tutor.gannon.edu', 'Emily B', 'tutor', true),
    ('ethanw@tutor.gannon.edu', 'Ethan W', 'tutor', true),
    ('evas@tutor.gannon.edu', 'Eva S', 'tutor', true),
    ('gloryn@tutor.gannon.edu', 'Glory N', 'tutor', true),
    ('gonzalop@tutor.gannon.edu', 'Gonzalo P', 'tutor', true),
    ('hannahp@tutor.gannon.edu', 'Hannah P', 'tutor', true),
    ('hivern@tutor.gannon.edu', 'Hiver N', 'tutor', true),
    ('hoangt@tutor.gannon.edu', 'Hoang T', 'tutor', true),
    ('hopet@tutor.gannon.edu', 'Hope T', 'tutor', true),
    ('issacw@tutor.gannon.edu', 'Issac W', 'tutor', true),
    ('izzyg@tutor.gannon.edu', 'Izzy G', 'tutor', true),
    ('jonathanh@tutor.gannon.edu', 'Jonathan H', 'tutor', true),
    ('juhim@tutor.gannon.edu', 'Juhi M', 'tutor', true),
    ('karab@tutor.gannon.edu', 'Kara B', 'tutor', true),
    ('kaylat@tutor.gannon.edu', 'Kayla T', 'tutor', true),
    ('kensya@tutor.gannon.edu', 'Kensy A', 'tutor', true),
    ('khangm@tutor.gannon.edu', 'Khang M', 'tutor', true),
    ('khanhl@tutor.gannon.edu', 'Khanh L', 'tutor', true),
    ('liliu@tutor.gannon.edu', 'Lili U', 'tutor', true),
    ('lillym@tutor.gannon.edu', 'Lilly M', 'tutor', true),
    ('maddye@tutor.gannon.edu', 'Maddy E', 'tutor', true),
    ('makalyal@tutor.gannon.edu', 'Makalya L', 'tutor', true),
    ('mariam@tutor.gannon.edu', 'Maria M', 'tutor', true),
    ('matthewt@tutor.gannon.edu', 'Matthew T', 'tutor', true),
    ('myn@tutor.gannon.edu', 'My N', 'tutor', true),
    ('natalieh@tutor.gannon.edu', 'Natalie H', 'tutor', true),
    ('ojusd@tutor.gannon.edu', 'Ojus D', 'tutor', true),
    ('pedroa@tutor.gannon.edu', 'Pedro A', 'tutor', true),
    ('phuongt@tutor.gannon.edu', 'Phuong T', 'tutor', true),
    ('prashritia@tutor.gannon.edu', 'Prashriti A', 'tutor', true),
    ('princessm@tutor.gannon.edu', 'Princess M', 'tutor', true),
    ('quocn@tutor.gannon.edu', 'Quoc N', 'tutor', true),
    ('rajihm@tutor.gannon.edu', 'Rajih M', 'tutor', true),
    ('robertt@tutor.gannon.edu', 'Robert T', 'tutor', true),
    ('zaida@tutor.gannon.edu', 'Zaid A', 'tutor', true),
    ('zoeg@tutor.gannon.edu', 'Zoe G', 'tutor', true)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    active = EXCLUDED.active;

-- ============================================
-- INSERT TUTORS (if not exists)
-- ============================================

INSERT INTO tutors (user_id, is_available)
SELECT user_id, true
FROM users
WHERE email IN (
    'aizireka@tutor.gannon.edu',
    'alixa@tutor.gannon.edu',
    'avishm@tutor.gannon.edu',
    'baileyh@tutor.gannon.edu',
    'blossoma@tutor.gannon.edu',
    'camrynb@tutor.gannon.edu',
    'clarab@tutor.gannon.edu',
    'claudiao@tutor.gannon.edu',
    'elizabethh@tutor.gannon.edu',
    'emilyb@tutor.gannon.edu',
    'ethanw@tutor.gannon.edu',
    'evas@tutor.gannon.edu',
    'gloryn@tutor.gannon.edu',
    'gonzalop@tutor.gannon.edu',
    'hannahp@tutor.gannon.edu',
    'hivern@tutor.gannon.edu',
    'hoangt@tutor.gannon.edu',
    'hopet@tutor.gannon.edu',
    'issacw@tutor.gannon.edu',
    'izzyg@tutor.gannon.edu',
    'jonathanh@tutor.gannon.edu',
    'juhim@tutor.gannon.edu',
    'karab@tutor.gannon.edu',
    'kaylat@tutor.gannon.edu',
    'kensya@tutor.gannon.edu',
    'khangm@tutor.gannon.edu',
    'khanhl@tutor.gannon.edu',
    'liliu@tutor.gannon.edu',
    'lillym@tutor.gannon.edu',
    'maddye@tutor.gannon.edu',
    'makalyal@tutor.gannon.edu',
    'mariam@tutor.gannon.edu',
    'matthewt@tutor.gannon.edu',
    'myn@tutor.gannon.edu',
    'natalieh@tutor.gannon.edu',
    'ojusd@tutor.gannon.edu',
    'pedroa@tutor.gannon.edu',
    'phuongt@tutor.gannon.edu',
    'prashritia@tutor.gannon.edu',
    'princessm@tutor.gannon.edu',
    'quocn@tutor.gannon.edu',
    'rajihm@tutor.gannon.edu',
    'robertt@tutor.gannon.edu',
    'zaida@tutor.gannon.edu',
    'zoeg@tutor.gannon.edu'
)
AND NOT EXISTS (
    SELECT 1 FROM tutors WHERE tutors.user_id = users.user_id
)
ON CONFLICT (user_id) DO UPDATE SET
    is_available = EXCLUDED.is_available;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check how many tutors were created
SELECT 
    COUNT(*) as total_tutors,
    COUNT(CASE WHEN is_available = true THEN 1 END) as available_tutors
FROM tutors;

-- List all tutors with their names
SELECT 
    u.full_name,
    u.email,
    t.tutor_id,
    t.is_available
FROM tutors t
JOIN users u ON t.user_id = u.user_id
ORDER BY u.full_name;

