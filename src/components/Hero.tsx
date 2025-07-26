import React from 'react';
import { Scissors, Star, Users } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="text-center py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Logo and Title */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-3 rounded-full bg-primary/20">
            <Scissors className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-gold to-gold-muted bg-clip-text text-transparent">
              Ze Elias
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium">
              Barbershop
            </p>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-foreground mb-8 max-w-2xl mx-auto">
          Experience the finest in men's grooming with our skilled barbers and premium services
        </p>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="flex flex-col items-center p-6 rounded-lg bg-card border border-border">
            <Star className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold text-lg mb-2">Premium Quality</h3>
            <p className="text-muted-foreground text-center">Professional cuts with attention to detail</p>
          </div>
          <div className="flex flex-col items-center p-6 rounded-lg bg-card border border-border">
            <Users className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold text-lg mb-2">Expert Barbers</h3>
            <p className="text-muted-foreground text-center">Choose from our team of skilled professionals</p>
          </div>
          <div className="flex flex-col items-center p-6 rounded-lg bg-card border border-border">
            <Scissors className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold text-lg mb-2">Full Service</h3>
            <p className="text-muted-foreground text-center">Haircuts, beard trimming, and styling</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready for a fresh new look?</h2>
          <p className="text-muted-foreground mb-6">Book your appointment online and experience the Ze Elias difference</p>
        </div>
      </div>
    </div>
  );
};

export default Hero;