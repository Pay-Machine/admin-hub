-- Fix security issues from previous migration

-- Enable RLS on keep_alive table
ALTER TABLE public.keep_alive ENABLE ROW LEVEL SECURITY;

-- Create policy for keep_alive (only authenticated users can access)
CREATE POLICY "Authenticated users can access keep_alive" 
ON public.keep_alive 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Fix search_path for functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, cpf, full_name)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'cpf',
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;