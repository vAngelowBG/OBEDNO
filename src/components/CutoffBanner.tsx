import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Tables } from '../lib/supabase';

interface CutoffBannerProps {
  selectedCity: string;
}

export function CutoffBanner({ selectedCity }: CutoffBannerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [latestCutoffTime, setLatestCutoffTime] = useState<string | null>(null);
  const [latestRestaurant, setLatestRestaurant] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchLatestCutoffTime();
  }, [selectedCity]);

  const fetchLatestCutoffTime = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('name, cutoff_time')
        .eq('city', selectedCity)
        .eq('status', 'active')
        .order('cutoff_time', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setLatestCutoffTime(data[0].cutoff_time);
        setLatestRestaurant(data[0].name);
      } else {
        setLatestCutoffTime(null);
        setLatestRestaurant(null);
      }
    } catch (error) {
      console.error('Error fetching latest cutoff time:', error);
      setLatestCutoffTime(null);
      setLatestRestaurant(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !latestCutoffTime || !latestRestaurant) {
    return null;
  }

  const cutoffTime = new Date();
  const [hours, minutes] = latestCutoffTime.split(':');
  cutoffTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  const timeUntilCutoff = cutoffTime.getTime() - currentTime.getTime();
  const isPastCutoff = timeUntilCutoff <= 0;
  const hoursUntilCutoff = Math.floor(timeUntilCutoff / (1000 * 60 * 60));
  const minutesUntilCutoff = Math.floor((timeUntilCutoff % (1000 * 60 * 60)) / (1000 * 60));

  if (isPastCutoff && currentTime.getHours() < 23) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-r">
        <div className="flex items-center">
          <AlertTriangle className="mr-2" size={20} />
          <div>
            <p className="font-medium">Времето за поръчки за днес е изтекло</p>
            <p className="text-sm">
              Последният ресторант ({latestRestaurant}) спря да приема поръчки в {latestCutoffTime.slice(0, 5)}. 
              Поръчките за утре ще бъдат налични от утре сутринта.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isPastCutoff && hoursUntilCutoff < 2) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-r">
        <div className="flex items-center">
          <Clock className="mr-2" size={20} />
          <div>
            <p className="font-medium">
              Остават {hoursUntilCutoff}ч {minutesUntilCutoff}м до края на поръчките в {selectedCity}
            </p>
            <p className="text-sm">
              Последният ресторант ({latestRestaurant}) спира да приема поръчки в {latestCutoffTime.slice(0, 5)}. 
              Бързайте да направите вашата поръчка!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}