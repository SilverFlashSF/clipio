import React, { useEffect } from 'react';
import mobileAds from 'react-native-google-mobile-ads';
import HomeScreen from './screens/HomeScreen';

export default function App() {
  useEffect(() => {
    mobileAds()
      .initialize()
      .then(() => {
        // Initialization complete
      })
      .catch(() => {});
  }, []);

  return <HomeScreen />;
}
