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

    // Use watchPosition for progressive GPS refinement
    let bestAccuracy = Infinity;
    let resolved = false;
    let timeoutId;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // Only process if this reading is more accurate
        if (accuracy < bestAccuracy) {
          bestAccuracy = accuracy;

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=18`
            );
            const data = await response.json();

            let formattedAddress = data.display_name;
            if (data && data.address) {
              const addr = data.address;
              const place = addr.village || addr.town || addr.suburb || addr.city || addr.municipality || addr.county || '';
              const district = addr.state_district || addr.county || '';
              const state = addr.state || '';
              const postcode = addr.postcode || '';
              const parts = [place, district, state, postcode].filter(Boolean);
              if (parts.length > 0) {
                formattedAddress = parts.join(', ');
              }
            }

            const locationData = {
              latitude,
              longitude,
              address: formattedAddress || `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
              timestamp: new Date().toISOString()
            };

            localStorage.setItem('userLocation', JSON.stringify(locationData));

            // Resolve on good accuracy or keep updating
            if (accuracy < 100 && !resolved) {
              resolved = true;
              navigator.geolocation.clearWatch(watchId);
              clearTimeout(timeoutId);
              resolve(locationData);
            }
          } catch (error) {
            const fallbackData = {
              latitude,
              longitude,
              address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
              timestamp: new Date().toISOString()
            };
            localStorage.setItem('userLocation', JSON.stringify(fallbackData));
            if (!resolved) {
              resolved = true;
              navigator.geolocation.clearWatch(watchId);
              clearTimeout(timeoutId);
              resolve(fallbackData);
            }
          }
        }
      },
      (error) => {
        console.warn("Geolocation positioning fallback:", error);
        navigator.geolocation.clearWatch(watchId);
        clearTimeout(timeoutId);
        if (!resolved) {
          resolved = true;
          const stored = localStorage.getItem('userLocation');
          let data = defaultLocation;
          if (stored) {
            try {
              data = JSON.parse(stored);
            } catch(e) {}
          }
          localStorage.setItem('userLocation', JSON.stringify(data));
          resolve(data);
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    // Safety timeout — resolve with best available after 10 seconds
    timeoutId = setTimeout(() => {
      navigator.geolocation.clearWatch(watchId);
      if (!resolved) {
        resolved = true;
        const stored = localStorage.getItem('userLocation');
        let data = defaultLocation;
        if (stored) {
          try {
            data = JSON.parse(stored);
          } catch(e) {}
        }
        resolve(data);
      }
    }, 10000);
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