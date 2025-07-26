import React, { useState, useEffect } from 'react';
import { format, isToday, isTomorrow, addDays, setHours, setMinutes, isAfter, startOfDay } from 'date-fns';
import { CalendarIcon, Clock, User, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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

const BookingForm: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const { toast } = useToast();

  // Business hours: 9 AM - 7 PM, closed Thursday & Sunday
  const isBusinessDay = (date: Date): boolean => {
    const day = date.getDay();
    return day !== 0 && day !== 4; // 0 = Sunday, 4 = Thursday
  };

  // Generate available time slots
  const generateTimeSlots = (date: Date): string[] => {
    const slots: string[] = [];
    const startHour = 9;
    const endHour = 19;
    const now = new Date();
    
    for (let hour = startHour; hour < endHour; hour++) {
      const slotTime = setMinutes(setHours(date, hour), 0);
      
      // Only show slots that are in the future
      if (isAfter(slotTime, now)) {
        slots.push(format(slotTime, 'HH:mm'));
      }
    }
    
    return slots;
  };

  // Update available times when date changes
  useEffect(() => {
    if (selectedDate) {
      const times = generateTimeSlots(selectedDate);
      setAvailableTimes(times);
      setSelectedTime(''); // Reset time selection
    }
  }, [selectedDate]);

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

  // Handle booking submission
  const handleBooking = () => {
    if (!selectedDate || !selectedTime || !selectedBarber || selectedServices.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all booking details.",
        variant: "destructive",
      });
      return;
    }

    const selectedServiceNames = selectedServices.map(id => 
      services.find(s => s.id === id)?.name
    ).join(', ');

    const barberName = barbers.find(b => b.id === selectedBarber)?.name;

    toast({
      title: "Booking Confirmed! ✂️",
      description: `Your appointment with ${barberName} on ${format(selectedDate, 'EEEE, MMMM d')} at ${selectedTime} for ${selectedServiceNames} (€${totalPrice}) has been booked successfully!`,
      duration: 6000,
    });

    // Reset form
    setSelectedDate(undefined);
    setSelectedTime('');
    setSelectedBarber('');
    setSelectedServices([]);
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

        {/* Price Summary */}
        {selectedServices.length > 0 && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Price:</span>
              <span className="text-2xl font-bold text-primary">€{totalPrice}</span>
            </div>
          </div>
        )}

        {/* Book Button */}
        <Button 
          onClick={handleBooking}
          className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={!selectedDate || !selectedTime || !selectedBarber || selectedServices.length === 0}
        >
          Book Appointment
        </Button>
      </CardContent>
    </Card>
  );
};

export default BookingForm;