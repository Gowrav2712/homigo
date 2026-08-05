import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button, Box, CircularProgress, TextField, Paper, List, ListItem, ListItemText, InputAdornment } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SearchIcon from '@mui/icons-material/Search';

const LocationPicker = ({ onConfirm, initialPosition = [12.2799972, 76.6520893] }) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const [mapCenter, setMapCenter] = useState(initialPosition);
    const [isLocating, setIsLocating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) return;

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

    const handleSearchLocation = async (query) => {
        setSearchQuery(query);
        if (!query || query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
            );
            const data = await response.json();
            setSearchResults(data || []);
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectSearchResult = (result) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lon], 15);
        }
        setMapCenter([lat, lon]);
        setSearchResults([]);
        setSearchQuery(result.display_name.split(',')[0]);
    };

    const handleLocateUser = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.setView([latitude, longitude], 16);
                }
                setMapCenter([latitude, longitude]);
                setIsLocating(false);
            },
            (err) => {
                console.error("Location access error:", err);
                setIsLocating(false);
                alert("Could not fetch current GPS location. Please use the search bar to type your town (e.g., Maddur).");
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

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
            {/* Search Bar Overlay */}
            <Box sx={{
                position: "absolute",
                top: 16,
                left: 16,
                right: { xs: 16, sm: 160 },
                zIndex: 1000,
            }}>
                <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search town, city or area (e.g. Maddur)..."
                        value={searchQuery}
                        onChange={(e) => handleSearchLocation(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                            endAdornment: isSearching ? <CircularProgress size={18} /> : null
                        }}
                        sx={{ bgcolor: 'background.paper' }}
                    />
                </Paper>

                {searchResults.length > 0 && (
                    <Paper elevation={4} sx={{ mt: 0.5, maxHeight: 200, overflowY: 'auto', borderRadius: 2 }}>
                        <List size="small" disablePadding>
                            {searchResults.map((item) => (
                                <ListItem
                                    key={item.place_id}
                                    button
                                    onClick={() => handleSelectSearchResult(item)}
                                    sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}
                                >
                                    <ListItemText
                                        primary={item.display_name.split(',')[0]}
                                        secondary={item.display_name}
                                        primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                                        secondaryTypographyProps={{ fontSize: '0.75rem', noWrap: true }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                )}
            </Box>

            {/* Direct Leaflet Map DOM Container */}
            <div 
                ref={mapContainerRef} 
                style={{ height: "calc(100% - 80px)", width: "100%" }} 
            />

            {/* Floating 'Locate Me' Button on Map */}
            <Box sx={{
                position: "absolute",
                top: { xs: 70, sm: 16 },
                right: 16,
                zIndex: 1000,
            }}>
                <Button
                    variant="contained"
                    startIcon={isLocating ? <CircularProgress size={18} color="inherit" /> : <MyLocationIcon />}
                    disabled={isLocating}
                    onClick={handleLocateUser}
                    sx={{
                        backgroundColor: 'background.paper',
                        color: 'primary.main',
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                        '&:hover': {
                            backgroundColor: 'grey.100',
                        }
                    }}
                >
                    {isLocating ? "Locating..." : "Locate Me"}
                </Button>
            </Box>

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

            {/* Bottom Actions Container */}
            <Box sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",   
                gap: 2,
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