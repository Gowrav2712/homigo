import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button, Box } from '@mui/material';

const LocationPicker = ({ onConfirm, initialPosition = [12.2799972, 76.6520893] }) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const [mapCenter, setMapCenter] = useState(initialPosition);

    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) return;

        // Initialize pure Leaflet map instance
        const map = L.map(mapContainerRef.current).setView(initialPosition, 13);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        map.on('moveend', () => {
            const center = map.getCenter();
            setMapCenter([center.lat, center.lng]);
        });

        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 300);

        return () => {
            clearTimeout(timer);
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [initialPosition]);

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm(mapCenter[0], mapCenter[1]);
        }
    };

    return (
        <Box sx={{
            height: "100%",
            width: "100%",
            position: "relative",
            bgcolor: "grey.100"
        }}>
            {/* Direct Leaflet Map DOM Container */}
            <div 
                ref={mapContainerRef} 
                style={{ height: "calc(100% - 80px)", width: "100%" }} 
            />

            {/* Fixed Marker Icon */}
            <Box sx={{
                position: "absolute",
                top: "calc(50% - 40px)",
                left: "50%",
                transform: "translate(-50%, -100%)",
                zIndex: 1000,
                pointerEvents: "none",
            }}>
                <img
                    src="https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png"
                    alt="marker"
                    style={{ width: "30px", height: "41px" }}
                />
            </Box>

            {/* Confirm Button */}
            <Box sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",   
                p: 2,
                backgroundColor: 'background.paper',
                borderTop: '1px solid',
                borderColor: 'divider',
                position: 'sticky',
                bottom: 0,
                width: '100%',
                zIndex: 1000
            }}>
                <Button
                    variant="contained"
                    onClick={handleConfirm}
                    sx={{
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        px: 4
                    }}
                >
                    Confirm Location
                </Button>
            </Box>
        </Box>
    );
};

export default LocationPicker;