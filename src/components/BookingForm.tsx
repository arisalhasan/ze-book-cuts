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
    
    // If barber is selected, filter out booked slots
    if (barberId) {
      try {
        const { data: bookedSlots, error } = await supabase
          .from('bookings')
          .select('booking_time')
          .eq('barber_id', barberId)
          .eq('booking_date', format(date, 'yyyy-MM-dd'))
          .eq('is_verified', true);

        if (error) {
          console.error('Error fetching booked slots:', error);
          return slots;
        }

        const bookedTimes = bookedSlots?.map(slot => slot.booking_time) || [];
        return slots.filter(slot => !bookedTimes.includes(slot));
      } catch (error) {
        console.error('Error filtering slots:', error);
        return slots;
      }
    }
    
    return slots;
  };

  // Update available times when date or barber changes
  useEffect(() => {
    const updateAvailableTimes = async () => {
      if (selectedDate && selectedBarber) {
        const times = await generateTimeSlots(selectedDate, selectedBarber);
        setAvailableTimes(times);
        setSelectedTime(''); // Reset time selection
      } else if (selectedDate) {
        const times = await generateTimeSlots(selectedDate, '');
        setAvailableTimes(times);
        setSelectedTime(''); // Reset time selection
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

  // Verify code and complete booking
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
      console.error('Verification error:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired verification code. Please try again.",
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
                {formatDateLabel(selectedDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => 
                  date < startOfDay(new Date()) || !isBusinessDay(date)
                }
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Select Time
          </label>
          <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!selectedDate}>
            <SelectTrigger>
              <SelectValue placeholder="Choose appointment time" />
            </SelectTrigger>
            <SelectContent>
              {availableTimes.length === 0 ? (
                <SelectItem value="no-slots" disabled>
                  No available slots for this day
                </SelectItem>
              ) : (
                availableTimes.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Barber Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Choose Your Barber
          </label>
          <Select value={selectedBarber} onValueChange={setSelectedBarber}>
            <SelectTrigger>
              <SelectValue placeholder="Select a barber" />
            </SelectTrigger>
            <SelectContent>
              {barbers.map((barber) => (
                <SelectItem key={barber.id} value={barber.id}>
                  {barber.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Service Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <Scissors className="h-4 w-4 text-primary" />
            Select Services
          </label>
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.id} className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
                <Checkbox
                  id={service.id}
                  checked={selectedServices.includes(service.id)}
                  onCheckedChange={() => handleServiceToggle(service.id)}
                />
                <label
                  htmlFor={service.id}
                  className="flex-1 cursor-pointer flex justify-between items-center"
                >
                  <span className="font-medium">{service.name}</span>
                  <span className="text-primary font-bold">€{service.price}</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Phone Number Input */}
        {!showVerification && (
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Phone Number
            </label>
            <div className="flex gap-2">
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countryCodes.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.code} {country.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="tel"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        )}

        {/* Verification Code Input */}
        {showVerification && (
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              Enter Verification Code
            </label>
            <div className="flex flex-col items-center space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                We sent a 6-digit code to {countryCode} {phoneNumber}
              </p>
              <InputOTP
                maxLength={6}
                value={verificationCode}
                onChange={setVerificationCode}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
        )}

        {/* Price Summary */}
        {selectedServices.length > 0 && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Price:</span>
              <span className="text-2xl font-bold text-primary">€{totalPrice}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!showVerification ? (
          <Button 
            onClick={sendVerificationCode}
            className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={!selectedDate || !selectedTime || !selectedBarber || selectedServices.length === 0 || !phoneNumber.trim() || isLoading}
          >
            {isLoading ? "Sending Code..." : "Send Verification Code"}
          </Button>
        ) : (
          <div className="space-y-3">
            <Button 
              onClick={verifyAndBooking}
              className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={verificationCode.length !== 6 || isLoading}
            >
              {isLoading ? "Verifying..." : "Verify & Book Appointment"}
            </Button>
            <Button 
              onClick={() => {
                setShowVerification(false);
                setVerificationCode('');
              }}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              Change Phone Number
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingForm;