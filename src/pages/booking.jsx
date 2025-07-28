import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const AdminBookings = () => {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    if (!auth || auth !== 'authenticated') {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
      fetchBookings();
    }
  }, []);

  const fetchBookings = async () => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch('/api/bookings');
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleDelete = async (bookingId) => {
    if (confirm('Are you sure you want to delete this booking?')) {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setBookings(bookings.filter(booking => booking.id !== bookingId));
          alert('Booking deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting booking:', error);
      }
    }
  };

  if (!isAuthenticated) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold mb-8">Manage Bookings</h1>
      
      <div className="grid gap-4">
        {bookings.length === 0 ? (
          <p>No bookings found</p>
        ) : (
          bookings.map(booking => (
            <div key={booking.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{booking.customerName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(booking.date).toLocaleString()} • {booking.service}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(booking.id)}
                  className="bg-destructive text-white px-3 py-1 rounded text-sm hover:bg-destructive/90"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminBookings;
