import React, { useState, useEffect } from 'react';
import { format, isToday, isTomorrow, addDays, setHours, setMinutes, isAfter, startOfDay } from 'date-fns';
import { CalendarIcon, Clock, User, Scissors, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Service {
  id: string;
  name: string;
  price: number;
}

interface Barber {
  id: string;
  name: string;
}

const services: Service[] = [
  { id: 'haircut', name: 'Haircut', price: 10 },
  { id: 'beard', name: 'Beard Trimming', price: 5 },
];

const barbers: Barber[] = [
  { id: 'elias', name: 'Elias' },
  { id: 'george', name: 'George' },
  { id: 'charalambos', name: 'Charalambos' },
];

const countryCodes = [
  { code: '+357', country: 'Cyprus' },
  { code: '+30', country: 'Greece' },
  { code: '+44', country: 'UK' },
  { code: '+1', country: 'US/Canada' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
];

const BookingForm: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [countryCode, setCountryCode] = useState<string>('+357');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [showVerification, setShowVerification] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingTimes, setIsLoadingTimes] = useState<boolean>(false);
  const { toast } = useToast();

  // Business hours: 9 AM - 7 PM, closed Thursday & Sunday
  const isBusinessDay = (date: Date): boolean => {
    const day = date.getDay();
    return day !== 0 && day !== 4; // 0 = Sunday, 4 = Thursday
  };

  // Generate available time slots in 30-minute intervals, excluding booked slots
  const generateTimeSlots = async (date: Date, barberId: string): Promise<string[]> => {
    const slots: string[] = [];
    const startHour = 9;
    const endHour = 19;
    const now = new Date();
    
    for (let hour = startHour; hour < endHour; hour++) {
      // Add full hour slot
      const hourSlot = setMinutes(setHours(date, hour), 0);
      if (isAfter(hourSlot, now)) {
        slots.push(format(hourSlot, 'HH:mm'));
      }
      
      // Add 30-minute slot
      const halfHourSlot = setMinutes(setHours(date, hour), 30);
      if (isAfter(halfHourSlot, now)) {
        slots.push(format(halfHourSlot, 'HH:mm'));
      }
    }
    
    // Filter out slots that are already booked
    try {
      const { data: bookedSlots, error } = await supabase
        .from('bookings')
        .select('booking_time, barber_id')
        .eq('booking_date', format(date, 'yyyy-MM-dd'))
        .eq('is_verified', true);

      if (error) {
        console.error('Error fetching booked slots:', error);
        return slots;
      }

      // Filter based on barber selection
      const bookedTimes = bookedSlots?.filter(slot => 
        slot.barber_id === barberId
      ).map(slot => slot.booking_time) || [];
      
      return slots.filter(slot => !bookedTimes.includes(slot));
    } catch (error) {
      console.error('Error filtering slots:', error);
      return slots;
    }
  };

  // Update available times when date or barber changes
  useEffect(() => {
    const updateAvailableTimes = async () => {
      if (selectedDate && selectedBarber) {
        setIsLoadingTimes(true);
        try {
          const times = await generateTimeSlots(selectedDate, selectedBarber);
          setAvailableTimes(times);
          
          // If currently selected time is no longer available, clear it
          if (selectedTime && !times.includes(selectedTime)) {
            setSelectedTime('');
            toast({
              title: "Time Updated",
              description: "Your selected time is no longer available. Please choose another time.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error updating available times:', error);
          setAvailableTimes([]);
        } finally {
          setIsLoadingTimes(false);
        }
      } else {
        setAvailableTimes([]);
        setSelectedTime('');
      }
    };

    updateAvailableTimes();
  }, [selectedDate, selectedBarber]);

  // Handle service selection
  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Calculate total price
  const totalPrice = selectedServices.reduce((total, serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return total + (service?.price || 0);
  }, 0);

  // Send SMS verification code
  const sendVerificationCode = async () => {
    if (!selectedDate || !selectedTime || !selectedBarber || selectedServices.length === 0 || !phoneNumber.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all booking details and phone number.",
        variant: "destructive",
      });
      return;
    }

    if (phoneNumber.trim().length < 8) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number.",
        variant: "destructive",
      });
      return;
    }

    // Final check that the selected time is still available before sending SMS
    try {
      const currentAvailableTimes = await generateTimeSlots(selectedDate, selectedBarber);
      if (!currentAvailableTimes.includes(selectedTime)) {
        toast({
          title: "Time Slot Unavailable",
          description: "This time slot has just been booked. Please select a different time.",
          variant: "destructive",
        });
        setAvailableTimes(currentAvailableTimes);
        setSelectedTime('');
        return;
      }
    } catch (error) {
      console.error('Error checking availability before SMS:', error);
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phoneNumber: phoneNumber.trim(),
          countryCode: countryCode,
        },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setShowVerification(true);
        toast({
          title: "Verification Code Sent! 📱",
          description: "Please check your phone for a 6-digit verification code.",
          duration: 5000,
        });
      } else {
        throw new Error(data.error || 'Failed to send verification code');
      }
    } catch (error: any) {
      console.error('SMS error:', error);
      toast({
        title: "SMS Error",
        description: error.message || "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify code and complete booking with enhanced double booking prevention
  const verifyAndBooking = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the complete 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // CRITICAL: Final availability check right before booking
      const { data: existingBooking, error: checkError } = await supabase
        .from('bookings')
        .select('id')
        .eq('barber_id', selectedBarber)
        .eq('booking_date', format(selectedDate!, 'yyyy-MM-dd'))
        .eq('booking_time', selectedTime)
        .eq('is_verified', true);

      if (checkError) {
        throw new Error('Error checking slot availability: ' + checkError.message);
      }

      if (existingBooking && existingBooking.length > 0) {
        toast({
          title: "Booking Failed ❌",
          description: "This time slot has just been booked by someone else. Please select a different time.",
          variant: "destructive",
        });
        
        // Refresh available times and reset form
        const times = await generateTimeSlots(selectedDate!, selectedBarber);
        setAvailableTimes(times);
        setSelectedTime('');
        setShowVerification(false);
        setVerificationCode('');
        setIsLoading(false);
        return;
      }

      // Proceed with booking if slot is still available
      const bookingData = {
        barberId: selectedBarber,
        services: selectedServices,
        bookingDate: format(selectedDate!, 'yyyy-MM-dd'),
        bookingTime: selectedTime,
        totalPrice: totalPrice,
      };

      const { data, error } = await supabase.functions.invoke('verify-code', {
        body: {
          phoneNumber: phoneNumber.trim(),
          countryCode: countryCode,
          code: verificationCode,
          bookingData: bookingData,
        },
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        const selectedServiceNames = selectedServices.map(id => 
          services.find(s => s.id === id)?.name
        ).join(', ');

        const barberName = barbers.find(b => b.id === selectedBarber)?.name;

        toast({
          title: "Booking Confirmed! ✂️",
          description: `Your appointment with ${barberName} on ${format(selectedDate!, 'EEEE, MMMM d')} at ${selectedTime} for ${selectedServiceNames} (€${totalPrice}) has been booked successfully!`,
          duration: 8000,
        });

        // Reset form
        setSelectedDate(undefined);
        setSelectedTime('');
        setSelectedBarber('');
        setSelectedServices([]);
        setPhoneNumber('');
        setVerificationCode('');
        setShowVerification(false);
      } else {
        throw new Error(data.error || 'Failed to verify code');
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateLabel = (date: Date | undefined) => {
    if (!date) return "Pick a date";
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "PPP");
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card border-border">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Scissors className="h-8 w-8 text-primary" />
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-gold-muted bg-clip-text text-transparent">
            Ze Elias Barbershop
          </CardTitle>
        </div>
        <CardDescription className="text-lg">
          Book your appointment with our professional barbers
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Date Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            Select Date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format
