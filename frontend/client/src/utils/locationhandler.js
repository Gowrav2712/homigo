// locationHandler.js
export const handleLocationAccess = () => {
  return new Promise((resolve) => {
    const defaultLocation = {
      latitude: 12.2799972,
      longitude: 76.6520893,
      address: "Mysore, Karnataka, India",
      timestamp: new Date().toISOString()
    };

    if (!navigator.geolocation) {
      const stored = localStorage.getItem('userLocation');
      const data = stored ? JSON.parse(stored) : defaultLocation;
      localStorage.setItem('userLocation', JSON.stringify(data));
      resolve(data);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`
          );
          const data = await response.json();

          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: data.display_name || `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`,
            timestamp: new Date().toISOString()
          };

          localStorage.setItem('userLocation', JSON.stringify(locationData));
          resolve(locationData);
        } catch (error) {
          const fallbackData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem('userLocation', JSON.stringify(fallbackData));
          resolve(fallbackData);
        }
      },
      (error) => {
        const stored = localStorage.getItem('userLocation');
        let data = defaultLocation;
        if (stored) {
          try {
            data = JSON.parse(stored);
          } catch(e) {}
        }
        localStorage.setItem('userLocation', JSON.stringify(data));
        resolve(data);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  });
};

export const requestAndStoreLocation = async (onSuccess, onError) => {
  try {
    const locationData = await handleLocationAccess();
    if (onSuccess) onSuccess(locationData);
    return true;
  } catch (error) {
    if (onError) onError(error.message);
    return false;
  }
};



  