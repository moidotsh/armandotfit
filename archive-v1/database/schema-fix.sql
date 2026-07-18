-- Supabase Database Schema Fix for Profile Creation
-- Run this in your Supabase SQL Editor to fix the RLS issue

-- First, drop the existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;  
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Recreate policies with proper permissions for profile creation
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow profile insertion during signup (more permissive)
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Update the trigger function to handle profile creation properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Could not create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative approach: Create a function that can be called directly
CREATE OR REPLACE FUNCTION public.create_profile_for_user(
  user_id UUID,
  user_email TEXT,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT DEFAULT NULL,
  preferred_split TEXT DEFAULT 'oneADay',
  weekly_goal INTEGER DEFAULT 4
)
RETURNS public.profiles AS $$
DECLARE
  new_profile public.profiles;
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    display_name,
    preferred_split,
    weekly_goal
  ) VALUES (
    user_id,
    user_email,
    first_name,
    last_name,
    COALESCE(display_name, first_name || ' ' || last_name),
    preferred_split,
    weekly_goal
  ) RETURNING * INTO new_profile;
  
  RETURN new_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.create_profile_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_profile_for_user TO anon;