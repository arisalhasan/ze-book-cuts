import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, Clock, User, Scissors, Phone, Euro, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Booking {
  id: string;
  barber_id: string;
  services: string[];
  booking_date: string;
  booking_time: string;
  total_price: number;
  phone_number: string;
  country_code: string;
  is_verified: boolean;
  created_at: string;
}

const services: { [key: string]: string } = {
  'haircut': 'Haircut',
  'beard': 'Beard Trimming',
};

const barbers: { [key: string]: string } = {
  'elias': 'Elias',
  'george': 'George',
  'charalambos': 'Charalambos',
};

const BookingsAdmin: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('adminAuthenticated');
    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('is_verified', true)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (error) {
        throw error;
      }

      setBookings(data || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getServiceNames = (serviceIds: string[]) => {
    return serviceIds.map(id => services[id] || id).join(', ');
  };

  const getBarberName = (barberId: string) => {
    return barbers[barberId] || barberId;
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    navigate('/admin/login');
  };
const handleDelete = async (bookingId: string) => {
  const confirmDelete = window.confirm("Are you sure you want to delete this booking?");
  if (!confirmDelete) return;

  try {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (error) {
      throw error;
    }

    toast({
      title: "Booking Deleted",
      description: "The booking has been successfully removed.",
    });

    setBookings((prev) => prev.filter(b => b.id !== bookingId));
  } catch (err) {
    console.error("Failed to delete booking:", err);
    toast({
      title: "Error",
      description: "Failed to delete the booking. Please try again.",
      variant: "destructive",
    });
  }
};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-between mb-2">
              <div></div>
              <div className="flex items-center gap-2">
                <Scissors className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-gold-muted bg-clip-text text-transparent">
                  Bookings Dashboard
                </CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
            <CardDescription className="text-lg">
              View and manage all confirmed appointments
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Bookings Found</h3>
                <p className="text-muted-foreground">
                  There are no confirmed appointments at the moment.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Date</TableHead>
                      <TableHead className="w-[80px]">Time</TableHead>
                      <TableHead>Barber</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[100px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            {format(new Date(booking.booking_date), 'MMM d')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            {booking.booking_time}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            {getBarberName(booking.barber_id)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Scissors className="h-4 w-4 text-primary" />
                            {getServiceNames(booking.services)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-primary" />
                            {booking.country_code} {booking.phone_number}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Euro className="h-4 w-4 text-primary" />
                            {booking.total_price}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                            Confirmed
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableCell>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(booking.id)}
                    >
                      Delete
                    </Button>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingsAdmin;
