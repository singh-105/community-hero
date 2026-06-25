import { useJsApiLoader } from '@react-google-maps/api';

const LIBRARIES: ['visualization', 'places'] = ['visualization', 'places'];

export const useGoogleMaps = () => {
  return useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });
};
