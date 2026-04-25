-- Migration: Seed Report Focus Options
-- Description: Populates initial checkbox options for client report forms
-- Created: 2026-04-24

-- Seed Broad Appointment Focus options (16 items)
INSERT INTO report_focus_options (category, option_text, display_order) VALUES
('broad_focus', 'Research & Synthesizing Sources', 1),
('broad_focus', 'Citation & Formatting', 2),
('broad_focus', 'Thesis, Argument, Organization, Clarity', 3),
('broad_focus', 'Grammar & Mechanics', 4),
('broad_focus', 'Audience, Purpose, Genre, Style', 5),
('broad_focus', 'Presentation', 6),
('broad_focus', 'Brainstorming, Outlining, Idea Development', 7),
('broad_focus', 'Multimodal Compositions / Design', 8),
('broad_focus', 'General Planning & Goal Setting (Academic, Career, Personal)', 9),
('broad_focus', 'Development of Study Skills', 10),
('broad_focus', 'Time Management', 11),
('broad_focus', 'Course Material Review', 12),
('broad_focus', 'Test Review / Preparation', 13),
('broad_focus', 'Stress Management / Academic Strategies', 14),
('broad_focus', 'Reading Strategies', 15),
('broad_focus', 'Wellness Topics', 16);

-- Seed Equipment/Resources Utilized options (13 items)
INSERT INTO report_focus_options (category, option_text, display_order) VALUES
('resources', 'Dictionaries, Thesaurus, Handbooks', 1),
('resources', 'Style Manual', 2),
('resources', 'Database Research', 3),
('resources', 'OWL', 4),
('resources', 'Other Online Resources', 5),
('resources', 'Printed Handouts', 6),
('resources', 'Models / Sample Papers', 7),
('resources', 'Microsoft Office (Word, Excel, PowerPoint)', 8),
('resources', 'Equipment (Poster Printer, Video/Audio Equip., VR, Etc.)', 9),
('resources', 'Brainstorming Techniques (Clustering, Listing, Etc.)', 10),
('resources', 'Graphic Organizers (Mapping, Outlining, Etc.)', 11),
('resources', 'Course Reserves', 12),
('resources', 'Other Materials / Tools (Not Listed Above)', 13);

-- Seed WRC Detailed Focus options (37 items)
INSERT INTO report_focus_options (category, option_text, display_order) VALUES
('wrc_detailed', 'Understanding Assignment', 1),
('wrc_detailed', 'Brainstorming', 2),
('wrc_detailed', 'Outlining', 3),
('wrc_detailed', 'Idea Development', 4),
('wrc_detailed', 'Topic Selection / Narrowing', 5),
('wrc_detailed', 'Research Skills', 6),
('wrc_detailed', 'Gathering Sources', 7),
('wrc_detailed', 'Evaluating Sources', 8),
('wrc_detailed', 'Database Searching', 9),
('wrc_detailed', 'Annotated Bibliography', 10),
('wrc_detailed', 'Integrating / Synthesizing Sources', 11),
('wrc_detailed', 'Paraphrasing / Summarizing', 12),
('wrc_detailed', 'Quotation', 13),
('wrc_detailed', 'Plagiarism', 14),
('wrc_detailed', 'Citation (In-Text)', 15),
('wrc_detailed', 'Citation (Works Cited / References)', 16),
('wrc_detailed', 'Citation Format', 17),
('wrc_detailed', 'Thesis', 18),
('wrc_detailed', 'Claim', 19),
('wrc_detailed', 'Evidence', 20),
('wrc_detailed', 'Reasoning', 21),
('wrc_detailed', 'Organization', 22),
('wrc_detailed', 'Paragraph Structure', 23),
('wrc_detailed', 'Introduction', 24),
('wrc_detailed', 'Conclusion', 25),
('wrc_detailed', 'Clarity', 26),
('wrc_detailed', 'Conciseness', 27),
('wrc_detailed', 'Transitions', 28),
('wrc_detailed', 'Grammar', 29),
('wrc_detailed', 'Punctuation', 30),
('wrc_detailed', 'Mechanics', 31),
('wrc_detailed', 'Tone / Voice', 32),
('wrc_detailed', 'Audience Awareness', 33),
('wrc_detailed', 'Presentation Prep', 34),
('wrc_detailed', 'Visual Design (Poster, Website, Video)', 35),
('wrc_detailed', 'Cover Letter / Resume', 36),
('wrc_detailed', 'Personal Statement / Scholarship Essay', 37);

-- Seed WRC Student Categories options (8 items)
INSERT INTO report_focus_options (category, option_text, display_order) VALUES
('wrc_categories', 'Undergraduate', 1),
('wrc_categories', 'Graduate', 2),
('wrc_categories', 'International', 3),
('wrc_categories', 'Student-Athlete', 4),
('wrc_categories', 'First Generation', 5),
('wrc_categories', 'Honors', 6),
('wrc_categories', 'Online', 7),
('wrc_categories', 'Non-Traditional', 8);

-- Seed Missing Information options (5 items)
INSERT INTO report_focus_options (category, option_text, display_order) VALUES
('missing_info', 'Course', 1),
('missing_info', 'Instructor', 2),
('missing_info', 'Department', 3),
('missing_info', 'Email', 4),
('missing_info', 'Other', 5);

-- Add comment
COMMENT ON TABLE report_focus_options IS 'Seeded with initial checkbox options based on existing form data';
