import { useState, useEffect } from 'react';
import Hero from '@/components/Hero';
import BookingForm from '@/components/BookingForm';
import BusinessInfo from '@/components/BusinessInfo';

const Index = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Simulated bookings data - replace with your actual data fetching
  useEffect(() => {
    // This would normally be an API call to your backend
    const sampleBookings = [
      { id: 1, name: "John Doe", date: "2023-11-15", service: "Haircut" },
      { id: 2, name: "Jane Smith", date: "2023-11-16", service: "Beard Trim" }
    ];
    setBookings(sampleBookings);
  }, []);

  const handleAdminLogin = () => {
    const username = prompt("Enter admin username:");
    const password = prompt("Enter admin password:");
    
    if (username === "admin" && password === "iambarber1") {
      setIsAdmin(true);
      setShowAdminPanel(true);
    } else {
      alert("Invalid credentials");
    }
  };

  const handleDeleteBooking = (id) => {
    if (confirm("Are you sure you want to delete this booking?")) {
      setBookings(bookings.filter(booking => booking.id !== id));
      // Here you would also make an API call to delete from your database
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Toggle Button (top-right corner) */}
      <button 
        onClick={isAdmin ? () => setShowAdminPanel(!showAdminPanel) : handleAdminLogin}
        className="fixed top-4 right-4 bg-primary text-white px-4 py-2 rounded-md z-50"
      >
        {isAdmin ? (showAdminPanel ? 'Hide Admin' : 'Show Admin') : 'Admin Login'}
      </button>

      {/* Admin Panel Overlay */}
      {showAdminPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-start pt-20">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Manage Bookings</h2>
            {bookings.length === 0 ? (
              <p>No bookings found</p>
            ) : (
              <div className="space-y-4">
                {bookings.map(booking => (
                  <div key={booking.id} className="border p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">{booking.name}</h3>
                        <p className="text-sm text-gray-600">
                          {booking.date} • {booking.service}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowAdminPanel(false)}
              className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
            >
              Close Admin Panel
            </button>
          </div>
        </div>
      )}

import Hero from '@/components/Hero';
import BookingForm from '@/components/BookingForm';
import BusinessInfo from '@/components/BusinessInfo';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <Hero />
      
      {/* Business Information */}
      <section className="py-12 px-4">
        <BusinessInfo />
      </section>
      
      {/* Booking Form */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Book Your Appointment</h2>
          <p className="text-muted-foreground text-lg">
            Select your preferred date, time, barber, and services below
          </p>
        </div>
        <BookingForm />
      </section>
      
      {/* Footer */}
      <footer className="py-8 px-4 text-center border-t border-border">
        <p className="text-muted-foreground">
          © 2024 Ze Elias Barbershop. Professional grooming services in your neighborhood.
        </p>
      </footer>
    </div>
  );
};

export default Index;
