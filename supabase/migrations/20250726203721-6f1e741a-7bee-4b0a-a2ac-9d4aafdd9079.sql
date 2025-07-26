-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT '+357',
  barber_id TEXT NOT NULL,
  services TEXT[] NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  total_price INTEGER NOT NULL,
  verification_code TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create verification_codes table for SMS verification
CREATE TABLE public.verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  country_code TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no authentication required)
CREATE POLICY "Allow public insert on bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public select on bookings" 
ON public.bookings 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public update on bookings" 
ON public.bookings 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public insert on verification_codes" 
ON public.verification_codes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public select on verification_codes" 
ON public.verification_codes 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public update on verification_codes" 
ON public.verification_codes 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to clean expired verification codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.verification_codes 
  WHERE expires_at < now() OR is_used = true;
END;
$$ LANGUAGE plpgsql;

-- Add index for phone number lookups
CREATE INDEX idx_verification_codes_phone ON public.verification_codes(phone_number, country_code);
CREATE INDEX idx_verification_codes_expires ON public.verification_codes(expires_at);
CREATE INDEX idx_bookings_phone ON public.bookings(phone_number, country_code);
CREATE INDEX idx_bookings_date_time ON public.bookings(booking_date, booking_time);