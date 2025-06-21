/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  ScrollView,
  TextInput,
  PermissionsAndroid,
  Keyboard,
} from 'react-native';
import MapView, { Marker, Polyline, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';


import { GOOGLE_MAPS_API_KEY } from '../services/google_map';

// Navigation props definition
type RootStackParamList = {
  MarketMap: undefined;
  Home: undefined;
};
type Props = NativeStackScreenProps<RootStackParamList, 'MarketMap'>;

// Price categories
type PriceCategory = 'Tous' | 'Bas' | 'Moyen' | 'Élevé';

// Market data interface
interface Market {
  place_id: string;
  name: string;
  vicinity: string; // Address or proximity description
  latitude: number;
  longitude: number;
  rating?: number; // Average rating, if available
  user_ratings_total?: number; // Total number of ratings
  price_level?: number; // Price level (e.g., 1=cheap, 4=expensive) for some place types
  simulatedPriceCategory: PriceCategory; // Manually assigned for display
  types: string[]; // Place types (e.g., supermarket, grocery_store, food)
  distance?: number; // Distance from the user
}

// Autocomplete prediction interface
interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

// Route information interface
interface RouteInfo {
  distance: string;
  duration: string;
}

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Utility function to calculate distance between two points (simplified Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

// Function to decode polyline from Google Directions API
const decodePolyline = (encoded: string) => {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({ latitude: (lat / 1e5), longitude: (lng / 1e5) });
  }
  return points;
};


const MarketMapScreen: React.FC<Props> = ({ navigation }) => {
  const [currentRegion, setCurrentRegion] = useState({
    latitude: 4.0511, // Default to Douala, Cameroon
    longitude: 9.7679,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [nearbyMarkets, setNearbyMarkets] = useState<Market[]>([]); // Markets from "Nearby" search
  const [textSearchResults, setTextSearchResults] = useState<Market[]>([]); // Results from direct text search
  const [displayedMarkets, setDisplayedMarkets] = useState<Market[]>([]); // Currently displayed markets (filtered or searched)
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<PlacePrediction[]>([]); // Autocomplete suggestions
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

  // States for radius and price filter
  const [searchQuery, setSearchQuery] = useState(''); // For search bar
  const [searchRadius, setSearchRadius] = useState('5'); // Search radius in km
  const [selectedPriceCategory, setSelectedPriceCategory] = useState<PriceCategory>('Tous'); // Price filter

  // States for route
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[] | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  // Refs for timeouts
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nearbyFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null); // For radius debounce
  const mapRef = useRef<MapView>(null); // Ref for MapView to control map animations

  // DEBUG STATE: Temporarily force show detail card
  const [debugForceShowDetailCard, setDebugForceShowDetailCard] = useState(false);

  // Function to simulate a price category for display purposes
  const getSimulatedPriceCategory = (marketName: string, types: string[]): PriceCategory => {
    const lowerName = marketName.toLowerCase();
    if (lowerName.includes('marché') || lowerName.includes('public') || types.includes('farmers_market') || types.includes('street_market')) {
      return 'Bas';
    }
    if (lowerName.includes('supermarché') || lowerName.includes('carrefour') || lowerName.includes('casino') || types.includes('supermarket') || types.includes('grocery_store')) {
      return 'Moyen';
    }
    if (lowerName.includes('hypermarché') || lowerName.includes('grand') || types.includes('department_store') || types.includes('shopping_mall')) {
      return 'Élevé';
    }
    // Fallback based on Google's price_level if available, or random if not
    // Google Places API price_level: 0 (free) to 4 (very expensive)
    if (types.includes('store') || types.includes('point_of_interest')) {
        const categories: PriceCategory[] = ['Bas', 'Moyen', 'Élevé'];
        return categories[Math.floor(Math.random() * categories.length)];
    }
    return 'Bas'; // Default to Bas if no clear indication
  };

  // Function to get color based on price category
  const getPriceCategoryColor = (category: PriceCategory) => {
    switch (category) {
      case 'Bas':
        return '#10B981'; // Green
      case 'Moyen':
        return '#FACC15'; // Yellow
      case 'Élevé':
        return '#EF4444'; // Red
      default:
        return '#6B7280'; // Gray
    }
  };

  // Generic function to format Places API results into a Market object
  const formatPlacesResults = useCallback((results: any[], referenceLat?: number, referenceLon?: number): Market[] => {
    console.log("[Format Results] Raw results received for formatting:", results);
    const useReferenceLocation = referenceLat !== undefined && referenceLon !== undefined;
    if (!useReferenceLocation) {
        console.warn("[Format Results] No reference location provided, distance will not be calculated.");
    }
    return results.map((place: any) => {
      const marketLat = place.geometry?.location?.lat;
      const marketLon = place.geometry?.location?.lng;

      // Ensure latitude and longitude are valid numbers
      if (typeof marketLat !== 'number' || typeof marketLon !== 'number') {
        console.warn(`[Format Results] Invalid coordinates for place: ${place.name || place.place_id}`);
        return null; // Return null for invalid entries
      }

      const dist = useReferenceLocation ? calculateDistance(referenceLat!, referenceLon!, marketLat, marketLon) : undefined;

      return {
        place_id: place.place_id,
        name: place.name,
        vicinity: place.vicinity || place.formatted_address || 'Adresse inconnue',
        latitude: marketLat,
        longitude: marketLon,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        price_level: place.price_level,
        types: place.types || [],
        simulatedPriceCategory: getSimulatedPriceCategory(place.name, place.types || []),
        distance: dist,
      };
    }).filter((market): market is Market => market !== null && market.name !== undefined && market.name.trim() !== ''); // Filter out nulls and entries without a name
  }, []); // Removed currentLocation from dependencies.

  // 1. Function for "Nearby" search
  const fetchNearbyMarkets = useCallback(async (latitude: number, longitude: number, radiusMeters: number) => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error("ERREUR: GOOGLE_MAPS_API_KEY est manquante. Vérifiez src/config.ts");
      Alert.alert("Erreur API", "La clé API Google Maps est manquante. Impossible de charger les marchés.");
      setIsLoading(false);
      return;
    }
    console.log(`[API CALL] Début de la recherche de marchés proches: lat=${latitude}, lon=${longitude}, rayon=${radiusMeters}m`);
    setIsLoading(true);
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radiusMeters}&type=supermarket|grocery_or_supermarket|market|food|store&key=${GOOGLE_MAPS_API_KEY}`
      );
      console.log("[API RESPONSE] Réponse recherche proche:", JSON.stringify(response.data, null, 2));

      if (response.data.results) {
        // Pass the current latitude and longitude to formatPlacesResults
        const formatted = formatPlacesResults(response.data.results, latitude, longitude);
        console.log(`[NEARBY SEARCH] Nombre de marchés formatés: ${formatted.length}`);
        setNearbyMarkets(formatted);
      } else {
        console.log("[NEARBY SEARCH] Pas de résultats pour la recherche proche.");
        setNearbyMarkets([]);
      }
    } catch (error: any) {
      console.error('Erreur lors de la recherche de marchés (Nearby):', error.response?.data || error.message);
      if (error.response?.data?.error_message) {
        Alert.alert('Erreur API Google', `Problème avec la recherche de proximité. Détails: ${error.response.data.error_message}. Vérifiez les activations d'API et la clé.`);
      } else {
        Alert.alert('Erreur Réseau/API', `Impossible de charger les marchés proches. Vérifiez votre connexion. Détails: ${error.message}`);
      }
      setNearbyMarkets([]);
    } finally {
      setIsLoading(false);
    }
  }, [formatPlacesResults]);

  // 2. Function for autocomplete search
  const fetchAutocompleteSuggestions = useCallback(async (input: string) => {
    if (!input.trim()) {
      setAutocompleteSuggestions([]);
      return;
    }
    if (!GOOGLE_MAPS_API_KEY) {
      console.error("ERREUR: GOOGLE_MAPS_API_KEY est manquante pour l'autocomplétion.");
      return;
    }

    const locationBias = currentLocation ? `&location=${currentLocation.latitude},${currentLocation.longitude}&radius=50000` : '';
    console.log(`[API CALL] Début de l'autocomplétion pour: "${input}"`);
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=establishment&language=fr&components=country:cm${locationBias}&key=${GOOGLE_MAPS_API_KEY}`
      );
      console.log("[API RESPONSE] Réponse autocomplétion:", JSON.stringify(response.data, null, 2));

      if (response.data.predictions) {
        setAutocompleteSuggestions(response.data.predictions);
      } else {
        console.log("[AUTOCOMPLETE] Pas de prédictions.");
        setAutocompleteSuggestions([]);
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'autocomplétion:', error.response?.data || error.message);
      if (error.response?.data?.error_message) {
        Alert.alert('Erreur API Google', `Problème avec l'autocomplétion. Détails: ${error.response.data.error_message}.`);
      } else {
        Alert.alert('Erreur Réseau/API', `Impossible de récupérer les suggestions. Détails: ${error.message}`);
      }
      setAutocompleteSuggestions([]);
    }
  }, [currentLocation]);

  // 3. Function to fetch place details (after autocomplete or marker click)
  const fetchPlaceDetails = useCallback(async (placeId: string) => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error("ERREUR: GOOGLE_MAPS_API_KEY est manquante pour les détails de lieu.");
      Alert.alert("Erreur API", "La clé API Google Maps est manquante.");
      return;
    }
    setIsLoading(true);
    console.log(`[API CALL] Début de la recherche de détails pour place_id: ${placeId}`);
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,rating,user_ratings_total,price_level,types,vicinity&language=fr&key=${GOOGLE_MAPS_API_KEY}`
      );
      console.log("[API RESPONSE] Réponse détails de lieu:", JSON.stringify(response.data, null, 2));

      if (response.data.result) {
        const place = response.data.result;
        // Pass currentLocation's lat/lng to formatPlacesResults for single market distance calculation
        const formattedResults = formatPlacesResults([place], currentLocation?.latitude, currentLocation?.longitude);
        if (formattedResults.length > 0) {
            const newSelectedMarket = formattedResults[0];
            setTextSearchResults([newSelectedMarket]); // Set this as the only text search result
            setNearbyMarkets([]); // Clear nearby markets so only this search result shows

            setSelectedMarket(newSelectedMarket);
            setCurrentRegion({
              latitude: newSelectedMarket.latitude,
              longitude: newSelectedMarket.longitude,
              latitudeDelta: LATITUDE_DELTA / 2,
              longitudeDelta: LONGITUDE_DELTA / 2,
            });
            setSearchQuery(newSelectedMarket.name);
            setAutocompleteSuggestions([]);
            Keyboard.dismiss();
            console.log(`[PLACE DETAILS] Détails obtenus pour: ${newSelectedMarket.name}`);
        } else {
            console.warn("[PLACE DETAILS] Détails obtenus mais formatage échoué ou nom manquant.");
            Alert.alert("Détails non trouvés", "Le lieu trouvé ne contient pas d'informations valides pour l'affichage.");
        }
      } else {
        console.log("[PLACE DETAILS] Pas de résultat pour ce place_id.");
        Alert.alert("Détails non trouvés", "Impossible de récupérer les détails pour ce lieu. Le place_id n'est peut-être plus valide.");
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des détails du lieu:', error.response?.data || error.message);
      if (error.response?.data?.error_message) {
        Alert.alert('Erreur API Google', `Problème avec les détails du lieu. Détails: ${error.response.data.error_message}.`);
      } else {
        Alert.alert('Erreur Réseau/API', `Impossible de charger les détails du lieu. Vérifiez votre connexion. Détails: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation, formatPlacesResults]); // currentLocation is still a dependency here because its values are passed to formatPlacesResults

  // 4. Function to get directions
  const fetchDirections = useCallback(async (originLat: number, originLng: number, destLat: number, destLng: number) => {
    if (!GOOGLE_MAPS_API_KEY) {
      Alert.alert("Erreur de configuration", "La clé API Google Maps n'est pas configurée.");
      return;
    }
    if (!originLat || !originLng || !destLat || !destLng) {
      Alert.alert("Coordonnées manquantes", "Impossible de calculer l'itinéraire sans les coordonnées.");
      return;
    }

    console.log(`[API CALL] Début de la recherche d'itinéraire de ${originLat},${originLng} à ${destLat},${destLng}`);
    try {
      setRouteCoordinates(null);
      setRouteInfo(null);

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`
      );
      console.log("[API RESPONSE] Réponse itinéraire:", JSON.stringify(response.data, null, 2));

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const polyline = route.overview_polyline.points;
        const decoded = decodePolyline(polyline);
        setRouteCoordinates(decoded);

        if (route.legs && route.legs.length > 0) {
          setRouteInfo({
            distance: route.legs[0].distance.text,
            duration: route.legs[0].duration.text,
          });
          console.log(`[DIRECTIONS] Itinéraire trouvé: Distance=${route.legs[0].distance.text}, Durée=${route.legs[0].duration.text}`);
        }

        mapRef.current?.fitToCoordinates(decoded, {
          edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
          animated: true,
        });

      } else {
        console.log("[DIRECTIONS] Aucun itinéraire trouvé.");
        Alert.alert("Itinéraire non trouvé", "Impossible de trouver un itinéraire pour cette destination.");
        setRouteCoordinates(null);
        setRouteInfo(null);
      }
    } catch (error: any) {
      console.error('Erreur lors de la recherche d\'itinéraire:', error.response?.data || error.message);
      if (error.response?.data?.error_message) {
        Alert.alert('Erreur API Google', `Problème avec l'itinéraire. Détails: ${error.response.data.error_message}.`);
      } else {
        Alert.alert('Erreur Réseau/API', `Impossible de charger l'itinéraire. Détails: ${error.message}`);
      }
      setRouteCoordinates(null);
      setRouteInfo(null);
    }
  }, []);


  // --- Effets pour l'initialisation et la synchronisation ---

  // Request permission and get current location
  useEffect(() => {
    const getLocation = () => {
      setIsLoading(true);
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`[GEOLOCATION] Position actuelle obtenue: ${latitude}, ${longitude}`);
          setCurrentLocation({ latitude, longitude });
          setCurrentRegion({
            latitude,
            longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          });
          setIsLoading(false);
          // Trigger initial nearby markets search once location is obtained
          // Ensure radius is parsed correctly
          fetchNearbyMarkets(latitude, longitude, parseFloat(searchRadius) * 1000);
        },
        (error) => {
          console.error('Erreur Géolocalisation:', error);
          Alert.alert(
            'Erreur de localisation',
            "Impossible d'obtenir votre position actuelle. Vérifiez les permissions de localisation et réessayez. La carte affichera une position par défaut."
          );
          setIsLoading(false);
          // Fallback to default region for nearby search if location fails
          // Use currentRegion's lat/lng as fallback for fetchNearbyMarkets
          fetchNearbyMarkets(currentRegion.latitude, currentRegion.longitude, parseFloat(searchRadius) * 1000);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    };

    const requestLocationPermission = async () => {
      if (Platform.OS === 'ios') {
        const authStatus = await Geolocation.requestAuthorization('whenInUse');
        if (authStatus === 'granted') {
          getLocation();
        } else {
          Alert.alert('Permission refusée', 'La permission de localisation est nécessaire pour afficher les marchés proches de vous.');
          setIsLoading(false);
          // Fallback if permission denied
          fetchNearbyMarkets(currentRegion.latitude, currentRegion.longitude, parseFloat(searchRadius) * 1000);
        }
      } else if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: "Permission de Localisation",
              message: "CookEasy a besoin d'accéder à votre localisation pour trouver les marchés proches.",
              buttonNeutral: "Demander plus tard",
              buttonNegative: "Annuler",
              buttonPositive: "OK",
            }
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log("Permission de localisation accordée sur Android.");
            getLocation();
          } else {
            Alert.alert('Permission refusée', 'La permission de localisation est nécessaire pour afficher les marchés proches de vous.');
            setIsLoading(false);
            // Fallback if permission denied
            fetchNearbyMarkets(currentRegion.latitude, currentRegion.longitude, parseFloat(searchRadius) * 1000);
          }
        } catch (err) {
          console.warn('Erreur lors de la demande de permission de localisation:', err);
          Alert.alert('Erreur de permission', 'Une erreur est survenue lors de la demande de permission de localisation.');
          setIsLoading(false);
          // Fallback if permission request fails
          fetchNearbyMarkets(currentRegion.latitude, currentRegion.longitude, parseFloat(searchRadius) * 1000);
        }
      }
    };

    requestLocationPermission();
  }, []);

  // Effect to trigger Nearby search when radius or location changes (debounced)
  useEffect(() => {
    const radius = parseFloat(searchRadius);
    if (currentLocation && radius > 0) {
      if (nearbyFetchTimeoutRef.current) {
        clearTimeout(nearbyFetchTimeoutRef.current);
      }
      nearbyFetchTimeoutRef.current = setTimeout(() => {
        console.log(`[DEBOUNCE] Déclenchement de la recherche proche (rayon/localisation changée). Rayon: ${radius}km`);
        fetchNearbyMarkets(currentLocation.latitude, currentLocation.longitude, radius * 1000);
      }, 700);
    } else if (radius <= 0 && searchRadius !== '') {
      console.log("[RADIUS ERROR] Rayon invalide. La recherche ne sera pas déclenchée.");
      setNearbyMarkets([]);
    }
    return () => {
      if (nearbyFetchTimeoutRef.current) {
        clearTimeout(nearbyFetchTimeoutRef.current);
      }
    };
  }, [searchRadius, currentLocation, fetchNearbyMarkets]);

  // Effect to manage market display (Nearby vs Text Search, and Price Filtering)
  useEffect(() => {
    let marketsToFilter: Market[] = [];

    console.log(`[DISPLAY LOGIC] État actuel: Recherche: "${searchQuery.trim()}", Résultats texte: ${textSearchResults.length}, Marchés proches: ${nearbyMarkets.length}`);

    if (searchQuery.trim() !== '' && textSearchResults.length > 0) {
      console.log("[DISPLAY LOGIC] Priorité aux résultats de recherche textuelle.");
      marketsToFilter = textSearchResults;
    } else {
      console.log("[DISPLAY LOGIC] Affichage des marchés proches.");
      marketsToFilter = nearbyMarkets;
    }

    let filteredMarkets = marketsToFilter;
    if (selectedPriceCategory !== 'Tous') {
        console.log(`[FILTER] Filtrage par catégorie de prix: ${selectedPriceCategory}`);
        filteredMarkets = marketsToFilter.filter(
            (market) => market.simulatedPriceCategory === selectedPriceCategory
        );
    }

    // Sort markets by distance if current location is available
    if (currentLocation) {
      filteredMarkets.sort((a, b) => {
        const distA = a.distance !== undefined ? a.distance : Infinity;
        const distB = b.distance !== undefined ? b.distance : Infinity;
        return distA - distB;
      });
      console.log("[DISPLAY LOGIC] Marchés triés par distance.");
    }

    setDisplayedMarkets(filteredMarkets);
    console.log(`[DISPLAYED MARKETS] Nombre total de marchés à afficher après filtre: ${filteredMarkets.length}`);
  }, [nearbyMarkets, textSearchResults, currentLocation, searchQuery, selectedPriceCategory]);

  // When a marker is pressed
  const handleMarkerPress = (market: Market) => {
    console.log(`[MARKER PRESS - INITIATED] Clic sur le marqueur du marché: ${market.name} (${market.place_id})`);
    setSelectedMarket(market);
    setRouteCoordinates(null);
    setRouteInfo(null);
    mapRef.current?.animateToRegion({
      latitude: market.latitude,
      longitude: market.longitude,
      latitudeDelta: LATITUDE_DELTA / 5,
      longitudeDelta: LONGITUDE_DELTA / 5,
    }, 500);
    console.log(`[MARKER PRESS - COMPLETED] selectedMarket mis à jour pour: ${market.name}`);
  };

  // Display global loader if loading
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Chargement de la carte et de votre position...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with search bar */}
      <LinearGradient colors={['#f97316', '#ef4444']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" style={styles.searchBarIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un marché ou une adresse..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (searchTimeoutRef.current) {
                  clearTimeout(searchTimeoutRef.current);
                }
                searchTimeoutRef.current = setTimeout(() => {
                  fetchAutocompleteSuggestions(text);
                }, 300);
              }}
              onFocus={() => {
                // If there's text, refresh suggestions on focus
                if (searchQuery.trim().length > 0) {
                  fetchAutocompleteSuggestions(searchQuery);
                }
                // Clear any displayed markets from previous nearby search when focusing on search bar
                // This prepares the map for showing search results
                setDisplayedMarkets([]);
                setNearbyMarkets([]); // Clear nearby markets when focusing search
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                console.log("[SEARCH CLEAR] Effacement de la recherche.");
                setSearchQuery('');
                setAutocompleteSuggestions([]);
                setTextSearchResults([]); // Clear text search results
                setSelectedMarket(null);
                setRouteCoordinates(null);
                setRouteInfo(null);
                Keyboard.dismiss();
                // Re-fetch nearby markets with current radius after clearing search
                if (currentLocation && parseFloat(searchRadius) > 0) {
                  fetchNearbyMarkets(currentLocation.latitude, currentLocation.longitude, parseFloat(searchRadius) * 1000);
                } else if (currentRegion && parseFloat(searchRadius) > 0) { // Fallback if no current location
                    fetchNearbyMarkets(currentRegion.latitude, currentRegion.longitude, parseFloat(searchRadius) * 1000);
                }
              }} style={styles.clearSearchButton}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={() => Alert.alert('Filtres', 'La fonctionnalité de filtre avancée sera bientôt disponible.')} style={styles.headerButton}>
            <MaterialCommunityIcons name="filter-variant" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Autocomplete suggestions list */}
      {searchQuery.trim().length > 0 && autocompleteSuggestions.length > 0 && (
        <ScrollView style={styles.predictionsContainer} keyboardShouldPersistTaps="handled">
          {autocompleteSuggestions.map((prediction) => (
            <TouchableOpacity
              key={prediction.place_id}
              style={styles.predictionItem}
              onPress={() => {
                console.log(`[SUGGESTION SELECTED] Sélection: ${prediction.description}`);
                setSearchQuery(prediction.description);
                fetchPlaceDetails(prediction.place_id); // Fetch and display the place
              }}
            >
              <Text style={styles.predictionMainText}>{prediction.structured_formatting.main_text}</Text>
              <Text style={styles.predictionSecondaryText}>{prediction.structured_formatting.secondary_text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Radius and Price filter options */}
      {searchQuery.trim() === '' && ( // Only show radius and price filters if search bar is empty
          <View style={styles.filterOptionsContainer}>
            <View style={styles.radiusInputContainer}>
              <Text style={styles.radiusLabel}>Rayon (km) :</Text>
              <TextInput
                style={styles.radiusInput}
                keyboardType="numeric"
                value={searchRadius}
                onChangeText={(text) => {
                  const numericValue = parseFloat(text);
                  if (!isNaN(numericValue) || text === '') {
                    setSearchRadius(text);
                  }
                }}
                onEndEditing={() => {
                  const radius = parseFloat(searchRadius);
                  if (isNaN(radius) || radius <= 0) {
                    Alert.alert('Rayon invalide', 'Veuillez entrer un rayon numérique positif.');
                    setSearchRadius('5');
                  }
                }}
                maxLength={3}
              />
              {isLoading && (
                <ActivityIndicator size="small" color="#f97316" style={styles.radiusLoadingIndicator} />
              )}
            </View>

            <View style={styles.priceFilterContainer}>
              <Text style={styles.priceFilterLabel}>Prix :</Text>
              {['Tous', 'Bas', 'Moyen', 'Élevé'].map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.priceFilterButton,
                    selectedPriceCategory === category && styles.selectedPriceFilterButton,
                  ]}
                  onPress={() => setSelectedPriceCategory(category as PriceCategory)}
                >
                  <Text
                    style={[
                      styles.priceFilterButtonText,
                      selectedPriceCategory === category && styles.priceFilterButtonTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.priceLegendContainer}>
                <View style={[styles.legendItem, { backgroundColor: getPriceCategoryColor('Bas') }]} />
                <Text style={styles.legendText}>Bas</Text>
                <View style={[styles.legendItem, { backgroundColor: getPriceCategoryColor('Moyen') }]} />
                <Text style={styles.legendText}>Moyen</Text>
                <View style={[styles.legendItem, { backgroundColor: getPriceCategoryColor('Élevé') }]} />
                <Text style={styles.legendText}>Élevé</Text>
            </View>
          </View>
      )}


      {/* Map View */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={currentRegion}
        showsUserLocation={true}
        followsUserLocation={true}
        onRegionChangeComplete={setCurrentRegion}
      >
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Ma Position"
            description="Vous êtes ici"
            pinColor="blue"
          />
        )}
        {currentLocation && parseFloat(searchRadius) > 0 && searchQuery.trim() === '' && ( // Only show circle for nearby search
          <Circle
            center={currentLocation}
            radius={parseFloat(searchRadius) * 1000} // Radius in meters
            strokeWidth={2}
            strokeColor="rgba(249, 115, 22, 0.8)" // Orange color
            fillColor="rgba(249, 115, 22, 0.2)" // Light orange fill
          />
        )}
        {displayedMarkets.map((market) => (
          <Marker
            key={market.place_id}
            coordinate={{ latitude: market.latitude, longitude: market.longitude }}
            title={market.name}
            description={market.vicinity + (market.distance !== undefined ? ` (${market.distance.toFixed(1)} km)` : '')}
            onPress={(e) => { // Added e.nativeEvent log for deeper debugging
              console.log(`[DEBUG - MARKER PRESS EVENT] Marker ${market.name} pressed. Native Event:`, e.nativeEvent);
              handleMarkerPress(market);
            }}
            pinColor={getPriceCategoryColor(market.simulatedPriceCategory)} // Pin color based on price category
          />
        ))}
        {routeCoordinates && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={5}
            strokeColor="#3b82f6"
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>


      {/* Selected market details */}
      { (selectedMarket || debugForceShowDetailCard) && (
        <>
        {console.log(`[DEBUG - RENDER CARD] Tentative d'affichage de la carte pour: ${selectedMarket?.name || 'Debug Market'}. debugForceShowDetailCard est ${debugForceShowDetailCard}`)}
        <View style={styles.marketDetailCard}>
          <Text style={styles.marketDetailName}>{selectedMarket?.name || 'Marché de débogage'}</Text>
          <Text style={styles.marketDetailAddress}>
            {selectedMarket?.vicinity || 'Adresse de débogage'}
            {selectedMarket?.distance !== undefined ? ` (${selectedMarket.distance.toFixed(1)} km)` : ''}
          </Text>
          {selectedMarket?.rating !== undefined && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text style={styles.marketDetailRating}>
                <MaterialCommunityIcons name="star" size={18} color="#facc15" />
                {' '}{selectedMarket.rating.toFixed(1)} ({selectedMarket.user_ratings_total || 0} avis)
              </Text>
            </View>
          )}
          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
              <Text style={[styles.marketDetailPrice, {color: getPriceCategoryColor(selectedMarket?.simulatedPriceCategory || 'Bas')}]}>
                  {selectedMarket?.simulatedPriceCategory === 'Bas' && '€'}
                  {selectedMarket?.simulatedPriceCategory === 'Moyen' && '€€'}
                  {selectedMarket?.simulatedPriceCategory === 'Élevé' && '€€€'}
                  {!selectedMarket && '€'} {/* For debug mode */}
                  {' '}
                  <Text style={{color: '#4B5563'}}>({selectedMarket?.simulatedPriceCategory || 'Bas'})</Text>
              </Text>
          </View>

          {routeInfo && (
            <View style={styles.routeInfoContainer}>
              <Text style={styles.routeInfoText}>
                <MaterialCommunityIcons name="map-marker-distance" size={16} color="#374151" /> {routeInfo.distance}
              </Text>
              <Text style={styles.routeInfoText}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#374151" /> {routeInfo.duration}
              </Text>
            </View>
          )}

          <View style={styles.marketDetailActions}>
            <TouchableOpacity
              style={styles.getDirectionsButton}
              onPress={() => {
                if (currentLocation && selectedMarket) {
                  fetchDirections(
                    currentLocation.latitude,
                    currentLocation.longitude,
                    selectedMarket.latitude,
                    selectedMarket.longitude
                  );
                } else {
                  Alert.alert('Localisation inconnue', 'Veuillez activer la localisation pour obtenir l\'itinéraire.');
                }
              }}
            >
              <MaterialCommunityIcons name="routes" size={20} color="#fff" />
              <Text style={styles.getDirectionsButtonText}>Itinéraire</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeDetailButton} onPress={() => { setSelectedMarket(null); setRouteCoordinates(null); setRouteInfo(null); setDebugForceShowDetailCard(false); }}>
              <MaterialCommunityIcons name="close-circle" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
        </>
      )}

      {/* List of markets */}
      {searchQuery.trim() === '' && ( // Only display nearby markets list if search bar is empty
        <>
          <Text style={styles.listTitle}>
            Marchés proches ({displayedMarkets.length})
          </Text>
          <ScrollView
            style={styles.marketListContainer}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
          >
            {displayedMarkets.length === 0 ? (
              <Text style={styles.noMarketsText}>
                {isLoading ? 'Chargement des marchés...' : 'Aucun marché trouvé dans le rayon actuel ou correspondant aux filtres.'}
              </Text>
            ) : (
              displayedMarkets.map((market) => (
                <TouchableOpacity
                  key={market.place_id}
                  style={[
                    styles.marketListItem,
                    selectedMarket?.place_id === market.place_id && styles.selectedMarketListItem,
                  ]}
                  onPress={() => handleMarkerPress(market)}
                >
                  <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>
                    <Text style={styles.marketListItemName}>{market.name}</Text>
                    <View style={[styles.priceTag, {backgroundColor: getPriceCategoryColor(market.simulatedPriceCategory)}]}>
                        <Text style={styles.priceTagText}>
                            {market.simulatedPriceCategory === 'Bas' && '€'}
                            {market.simulatedPriceCategory === 'Moyen' && '€€'}
                            {market.simulatedPriceCategory === 'Élevé' && '€€€'}
                        </Text>
                    </View>
                  </View>
                  <Text style={styles.marketListItemAddress}>
                    {market.vicinity}
                    {market.distance !== undefined ? ` (${market.distance.toFixed(1)} km)` : ''}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 12,
    marginHorizontal: 10,
    height: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchBarIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 0,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  predictionsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 90,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    maxHeight: Dimensions.get('window').height * 0.3,
    zIndex: 15,
  },
  predictionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  predictionMainText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  predictionSecondaryText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  filterOptionsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 9,
  },
  radiusInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    marginBottom: 10,
  },
  radiusLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginRight: 8,
    fontWeight: '600',
  },
  radiusInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    width: 60,
    textAlign: 'center',
    fontSize: 14,
    color: '#1F2937',
  },
  radiusLoadingIndicator: {
    marginLeft: 10,
  },
  priceFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  priceFilterLabel: {
    fontSize: 14,
    color: '#4B5563',
    marginRight: 10,
    fontWeight: '600',
  },
  priceFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginHorizontal: 4,
    backgroundColor: '#F9FAFB',
  },
  selectedPriceFilterButton: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  priceFilterButtonText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  priceFilterButtonTextActive: {
    color: '#fff',
  },
  priceLegendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    marginBottom: 5,
  },
  legendItem: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
  map: {
    width: '100%',
    height: Dimensions.get('window').height * 0.45,
    zIndex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#F3F4F6',
    zIndex: 3,
  },
  marketDetailCard: {
    position: 'absolute',
    bottom: 120, // Position above the horizontal market list
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 20, // Increased zIndex to ensure it's on top of everything
  },
  marketDetailName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  marketDetailAddress: {
    fontSize: 14,
    color: '#6B7280',
  },
  marketDetailRating: {
    fontSize: 14,
    marginLeft: 0,
    color: '#374151',
  },
  marketDetailPrice: {
      fontSize: 15,
      fontWeight: 'bold',
      marginTop: 4,
  },
  closeDetailButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  marketDetailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  getDirectionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
  },
  getDirectionsButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  routeInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  routeInfoText: {
    fontSize: 14,
    color: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  marketListContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    maxHeight: 120, // Keep this relatively small so the detail card can be above it
    zIndex: 2,
  },
  marketListItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    width: width * 0.7,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedMarketListItem: {
    borderColor: '#f97316',
  },
  marketListItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  marketListItemAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  priceTag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
  },
  priceTagText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#fff',
  },
});

export default MarketMapScreen;