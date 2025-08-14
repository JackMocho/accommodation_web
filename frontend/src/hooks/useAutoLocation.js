import { useEffect } from 'react';

export default function useAutoLocation(setLat, setLng) {
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        }
      );
    }
  }, [setLat, setLng]);
}