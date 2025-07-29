-- Create a unique constraint to prevent double bookings at database level
ALTER TABLE public.bookings 
ADD CONSTRAINT unique_booking_slot 
UNIQUE (barber_id, booking_date, booking_time);