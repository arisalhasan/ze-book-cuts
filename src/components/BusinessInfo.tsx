import React from 'react';
import { Clock, Calendar, MapPin, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BusinessInfo: React.FC = () => {
  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {/* Opening Hours */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-5 w-5 text-primary" />
            Opening Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="font-medium text-success">Monday</span>
            <span>9:00 AM - 7:00 PM</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="font-medium text-success">Tuesday</span>
            <span>9:00 AM - 7:00 PM</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="font-medium text-success">Wednesday</span>
            <span>9:00 AM - 7:00 PM</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="font-medium text-destructive">Thursday</span>
            <span className="text-muted-foreground">Closed</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="font-medium text-success">Friday</span>
            <span>9:00 AM - 7:00 PM</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="font-medium text-success">Saturday</span>
            <span>9:00 AM - 7:00 PM</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="font-medium text-destructive">Sunday</span>
            <span className="text-muted-foreground">Closed</span>
          </div>
        </CardContent>
      </Card>

      {/* Services & Prices */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5 text-primary" />
            Our Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
            <div>
              <h3 className="font-semibold text-lg">Haircut</h3>
              <p className="text-muted-foreground text-sm">Professional cut & styling</p>
            </div>
            <span className="text-2xl font-bold text-primary">€10</span>
          </div>
          <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
            <div>
              <h3 className="font-semibold text-lg">Beard Trimming</h3>
              <p className="text-muted-foreground text-sm">Precise beard shaping</p>
            </div>
            <span className="text-2xl font-bold text-primary">€5</span>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-center">
              <span className="font-semibold">Combo Deal:</span> Both services for just <span className="text-primary font-bold">€15</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessInfo;