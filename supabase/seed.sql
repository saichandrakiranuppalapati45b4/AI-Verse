-- AI Verse Database Seed Data

-- ============================================
-- SEED ADMIN USER
-- ============================================
-- NOTE: First create an admin user through Supabase Auth
-- Then update their role to 'admin'
-- Example: UPDATE public.users SET role = 'admin' WHERE email = 'admin@aiverse.com';

-- ============================================
-- SEED CONTENT PAGES
-- ============================================

-- Home Page Content
INSERT INTO public.content_pages (page_name, content) VALUES
('home', '{
  "hero": {
    "title": "AI Verse",
    "subtitle": "Department of CSE – Artificial Intelligence & Data Science",
    "description": "Empowering innovation through hackathons, seminars, workshops, and tech events",
    "ctaText": "Explore Events",
    "ctaLink": "/events"
  },
  "vision": "To create a vibrant community of AI enthusiasts and data scientists",
  "highlights": [
    {
      "title": "100+",
      "description": "Events Conducted",
      "icon": "trophy"
    },
    {
      "title": "500+",
      "description": "Active Members",
      "icon": "users"
    },
    {
      "title": "50+",
      "description": "Workshops Hosted",
      "icon": "book"
    }
  ]
}'::jsonb)
ON CONFLICT (page_name) DO NOTHING;

-- About Page Content
INSERT INTO public.content_pages (page_name, content) VALUES
('about', '{
  "mission": "To foster innovation, creativity, and technical excellence in the field of Artificial Intelligence and Data Science",
  "vision": "To be a leading hub for AI and Data Science education, research, and industry collaboration",
  "description": "AI Verse is the premier club of the Department of CSE - Artificial Intelligence & Data Science. We organize cutting-edge hackathons, insightful seminars, hands-on workshops, and exciting tech events to nurture the next generation of AI professionals.",
  "values": [
    "Innovation",
    "Collaboration",
    "Excellence",
    "Integrity"
  ]
}'::jsonb)
ON CONFLICT (page_name) DO NOTHING;

-- Team Page Content (Sample)
INSERT INTO public.content_pages (page_name, content) VALUES
('team', '{
  "members": [
    {
      "name": "John Doe",
      "position": "President",
      "department": "AI & DS",
      "year": 4,
      "image": "/team/john.jpg",
      "linkedin": "https://linkedin.com",
      "github": "https://github.com"
    },
    {
      "name": "Jane Smith",
      "position": "Vice President",
      "department": "AI & DS",
      "year": 3,
      "image": "/team/jane.jpg",
      "linkedin": "https://linkedin.com",
      "github": "https://github.com"
    }
  ]
}'::jsonb)
ON CONFLICT (page_name) DO NOTHING;

-- Contact Page Content
INSERT INTO public.content_pages (page_name, content) VALUES
('contact', '{
  "email": "aiverse@college.edu",
  "phone": "+91 1234567890",
  "address": "Department of CSE - AI & DS, College Name, City, State",
  "social": {
    "instagram": "https://instagram.com/aiverse",
    "linkedin": "https://linkedin.com/company/aiverse",
    "twitter": "https://twitter.com/aiverse",
    "github": "https://github.com/aiverse"
  }
}'::jsonb)
ON CONFLICT (page_name) DO NOTHING;

-- ============================================
-- SAMPLE EVENTS
-- ============================================

-- Sample Hackathon
INSERT INTO public.events (
  title,
  description,
  event_type,
  start_date,
  end_date,
  registration_deadline,
  location,
  max_participants,
  team_size_min,
  team_size_max,
  is_published,
  status
) VALUES (
  'AI Innovation Hackathon 2026',
  'A 48-hour hackathon to build innovative AI solutions for real-world problems',
  'hackathon',
  NOW() + INTERVAL '30 days',
  NOW() + INTERVAL '32 days',
  NOW() + INTERVAL '25 days',
  'Main Auditorium',
  100,
  2,
  4,
  true,
  'upcoming'
);

-- Sample Workshop
INSERT INTO public.events (
  title,
  description,
  event_type,
  start_date,
  end_date,
  registration_deadline,
  location,
  max_participants,
  team_size_min,
  team_size_max,
  is_published,
  status
) VALUES (
  'Machine Learning Fundamentals Workshop',
  'Learn the basics of machine learning with hands-on projects',
  'workshop',
  NOW() + INTERVAL '15 days',
  NOW() + INTERVAL '15 days',
  NOW() + INTERVAL '10 days',
  'Lab 301',
  50,
  1,
  1,
  true,
  'upcoming'
);
