-- AI Verse Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (Extended Profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'jury', 'public')),
  phone TEXT,
  college TEXT,
  department TEXT,
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('hackathon', 'seminar', 'workshop', 'tech_event')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  location TEXT,
  banner_url TEXT,
  max_participants INTEGER,
  team_size_min INTEGER DEFAULT 1,
  team_size_max INTEGER DEFAULT 1,
  is_published BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- REGISTRATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  team_name TEXT,
  is_team_registration BOOLEAN DEFAULT false,
  team_leader_name TEXT NOT NULL,
  team_leader_email TEXT NOT NULL,
  team_leader_phone TEXT NOT NULL,
  team_members JSONB, -- Array of team member objects
  college TEXT,
  department TEXT,
  registration_status TEXT DEFAULT 'pending' CHECK (registration_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- JURY ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.jury_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jury_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(jury_id, event_id)
);

-- ============================================
-- SCORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  jury_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  innovation_score INTEGER CHECK (innovation_score >= 0 AND innovation_score <= 10),
  technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 10),
  presentation_score INTEGER CHECK (presentation_score >= 0 AND presentation_score <= 10),
  impact_score INTEGER CHECK (impact_score >= 0 AND impact_score <= 10),
  total_score INTEGER GENERATED ALWAYS AS (
    COALESCE(innovation_score, 0) + 
    COALESCE(technical_score, 0) + 
    COALESCE(presentation_score, 0) + 
    COALESCE(impact_score, 0)
  ) STORED,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(registration_id, jury_id)
);

-- ============================================
-- RESULTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  final_score DECIMAL(5,2),
  rank INTEGER,
  prize TEXT,
  is_published BOOLEAN DEFAULT false,
  published_by UUID REFERENCES public.users(id),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, registration_id)
);

-- ============================================
-- GALLERY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.users(id),
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT false
);

-- ============================================
-- CONTENT PAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.content_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_name TEXT UNIQUE NOT NULL CHECK (page_name IN ('home', 'about', 'team', 'contact')),
  content JSONB NOT NULL, -- Flexible JSON structure for different page types
  updated_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jury_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON public.users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Events table policies
CREATE POLICY "Anyone can view published events" ON public.events
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all events" ON public.events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Jury can view assigned events" ON public.events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jury_assignments 
      WHERE jury_id = auth.uid() AND event_id = events.id
    )
  );

-- Registrations table policies
CREATE POLICY "Anyone can register for events" ON public.registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own registrations" ON public.registrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all registrations" ON public.registrations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Jury can view registrations for assigned events" ON public.registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jury_assignments 
      WHERE jury_id = auth.uid() AND event_id = registrations.event_id
    )
  );

-- Jury assignments policies
CREATE POLICY "Admins can manage jury assignments" ON public.jury_assignments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Jury can view their own assignments" ON public.jury_assignments
  FOR SELECT USING (jury_id = auth.uid());

-- Scores table policies
CREATE POLICY "Jury can manage scores for assigned events" ON public.scores
  FOR ALL USING (
    jury_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.jury_assignments 
      WHERE jury_id = auth.uid() AND event_id = scores.event_id
    )
  );

CREATE POLICY "Admins can view all scores" ON public.scores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Results table policies
CREATE POLICY "Anyone can view published results" ON public.results
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all results" ON public.results
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Gallery table policies
CREATE POLICY "Anyone can view gallery images" ON public.gallery
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage gallery" ON public.gallery
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Content pages policies
CREATE POLICY "Anyone can view content pages" ON public.content_pages
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage content pages" ON public.content_pages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    'public', -- Default role
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_scores_updated_at BEFORE UPDATE ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage buckets (run these in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('gallery-images', 'gallery-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('team-photos', 'team-photos', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('event-banners', 'event-banners', true);

-- Storage policies for gallery-images bucket
-- CREATE POLICY "Anyone can view gallery images" ON storage.objects
--   FOR SELECT USING (bucket_id = 'gallery-images');

-- CREATE POLICY "Admins can upload gallery images" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'gallery-images' AND
--     EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
--   );
