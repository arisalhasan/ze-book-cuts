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
