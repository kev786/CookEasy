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
// import axios from 'axios'; // Still commented out for market data
// import { Maps_API_KEY } from '../services/google_map'; // Still commented out

// Navigation props definition
type RootStackParamList = {
  MarketMap: undefined;
  Home: undefined;
};
type Props = NativeStackScreenProps<RootStackParamList, 'MarketMap'>;

// Market data interface (simplified, no price category)
interface Market {
  place_id: string;
  name: string;
  vicinity: string; // Address or proximity description
  latitude: number;
  longitude: number;
  rating?: number; // Average rating, if available
  user_ratings_total?: number; // Total number of ratings
  types: string[]; // Place types (e.g., supermarket, grocery_store, food)
  distance?: number; // Distance from the user, will be calculated dynamically
}

// Prediction for Autocomplete
interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

type MarketCategory = 'Tous' | 'Marché' | 'Supermarché';

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

// --- SIMULATED MARKET DATA (with updated real/estimated coordinates) ---
const RAW_SIMULATED_MARKETS: Market[] = [
  {
    place_id: 'new_market_yaounde1',
    name: 'Marché Central',
    vicinity: 'Centre-ville, Yaoundé',
    latitude: 3.8663,
    longitude: 11.5179,
    rating: 4.5,
    user_ratings_total: 2500,
    types: ['market', 'food', 'point_of_interest'],
  },
  {
    place_id: 'new_market_yaounde2',
    name: 'Marché Mokolo',
    vicinity: 'Mokolo, Yaoundé',
    latitude: 3.8746,
    longitude: 11.4998,
    rating: 4.2,
    user_ratings_total: 3000,
    types: ['market', 'food', 'point_of_interest'],
  },
  {
    place_id: 'new_market_yaounde3',
    name: 'Marché du Mfoundi',
    vicinity: 'Centre, Yaoundé',
    latitude: 3.8660,
    longitude: 11.5245,
    rating: 4.3,
    user_ratings_total: 2200,
    types: ['market', 'food', 'point_of_interest'],
  },
  {
    place_id: 'new_market_yaounde4',
    name: 'Marché d\'Essos',
    vicinity: 'Essos, Yaoundé',
    latitude: 3.8700,
    longitude: 11.5422,
    rating: 4.0,
    user_ratings_total: 1500,
    types: ['market', 'food', 'point_of_interest'],
  },
  {
    place_id: 'new_market_yaounde5',
    name: 'Marché Nkolndongo',
    vicinity: 'Nkolndongo, Yaoundé',
    latitude: 3.4900,
    longitude: 11.5100,
    rating: 3.8,
    user_ratings_total: 900,
    types: ['market', 'food', 'point_of_interest'],
  },
  {
    place_id: 'new_market_yaounde6',
    name: 'Marché Mvog-Mbi',
    vicinity: 'Mvog-Mbi, Yaoundé',
    latitude: 3.8506,
    longitude: 11.5208,
    rating: 4.1,
    user_ratings_total: 1200,
    types: ['market', 'food', 'point_of_interest'],
  },
  {
    place_id: 'new_market_yaounde7',
    name: 'Marché de Biyem-Assi',
    vicinity: 'Biyem-Assi, Yaoundé',
    latitude: 3.8357,
    longitude: 11.4865,
    rating: 4.0,
    user_ratings_total: 1800,
    types: ['market', 'food', 'point_of_interest'],
  },
  {
    place_id: 'new_market_yaounde8',
    name: 'Marché de Madagascar',
    vicinity: 'Madagascar, Yaoundé',
    latitude: 3.8804,
    longitude: 11.4927,
    rating: 3.9,
    user_ratings_total: 1000,
    types: ['market', 'food', 'point_of_interest'],
  },
  {
    place_id: 'new_market_yaounde9',
    name: 'Marché de Mendong',
    vicinity: 'Mendong, Yaoundé',
    latitude: 3.8321,
    longitude: 11.4701,
    rating: 3.7,
    user_ratings_total: 700,
    types: ['market', 'food', 'point_of_interest'],
  },
  {
    place_id: 'new_market_yaounde10',
    name: 'Marché de Nsam',
    vicinity: 'Nsam, Yaoundé',
    latitude: 3.8292,
    longitude: 11.5103,
    rating: 3.9,
    user_ratings_total: 850,
    types: ['market', 'food', 'point_of_interest'],
  },
  {
    place_id: 'new_market_yaounde11',
    name: 'Marché de la Gare',
    vicinity: 'Gare, Yaoundé',
    latitude: 3.8705,
    longitude: 11.5259,
    rating: 4.1,
    user_ratings_total: 1100,
    types: ['market', 'food', 'point_of_interest'],
  },
  {
    place_id: 'new_supermarket_yaounde1',
    name: 'Casino (Bastos)',
    vicinity: 'Bastos, Yaoundé',
    latitude: 3.8879,
    longitude: 11.5135,
    rating: 4.4,
    user_ratings_total: 1500,
    types: ['supermarket', 'store', 'point_of_interest'],
  },
  {
    place_id: 'new_supermarket_yaounde2',
    name: 'Casino (Centre-ville)',
    vicinity: 'Centre-ville, Yaoundé',
    latitude: 3.8593,
    longitude: 11.5123,
    rating: 4.3,
    user_ratings_total: 1300,
    types: ['supermarket', 'store', 'point_of_interest'],
  },
  {
    place_id: 'new_supermarket_yaounde3',
    name: 'Dôvv Bastos',
    vicinity: 'Bastos, Yaoundé',
    latitude: 3.8925,
    longitude: 11.5101,
    rating: 4.6,
    user_ratings_total: 900,
    types: ['supermarket', 'store', 'point_of_interest'],
  },
  {
    place_id: 'new_supermarket_yaounde4',
    name: 'Dôvv Mokolo',
    vicinity: 'Mokolo, Yaoundé',
    latitude: 3.8734,
    longitude: 11.5016,
    rating: 4.0,
    user_ratings_total: 750,
    types: ['supermarket', 'store', 'point_of_interest'],
  },
  {
    place_id: 'new_supermarket_yaounde5',
    name: 'Carrefour Ekie',
    vicinity: 'Ekie, Yaoundé',
    latitude: 3.8344,
    longitude: 11.5408,
    rating: 4.5,
    user_ratings_total: 2000,
    types: ['supermarket', 'shopping_mall', 'store', 'point_of_interest'],
  },
  {
    place_id: 'new_supermarket_yaounde6',
    name: 'Rayco (Nkol-Eton)',
    vicinity: 'Nkol-Eton, Yaoundé',
    latitude: 3.8887,
    longitude: 11.5189,
    rating: 3.8,
    user_ratings_total: 400,
    types: ['supermarket', 'store', 'point_of_interest'],
  },
];


const SIMULATED_PREDICTIONS: PlacePrediction[] = [
  {
    place_id: 'new_market_yaounde1',
    description: 'Marché Central, Centre-ville, Yaoundé',
    structured_formatting: { main_text: 'Marché Central', secondary_text: 'Centre-ville, Yaoundé' },
  },
  {
    place_id: 'new_market_yaounde2',
    description: 'Marché Mokolo, Mokolo, Yaoundé',
    structured_formatting: { main_text: 'Marché Mokolo', secondary_text: 'Mokolo, Yaoundé' },
  },
  {
    place_id: 'new_market_yaounde3',
    description: 'Marché du Mfoundi, Centre, Yaoundé',
    structured_formatting: { main_text: 'Marché du Mfoundi', secondary_text: 'Centre, Yaoundé' },
  },
  {
    place_id: 'new_market_yaounde4',
    description: 'Marché d\'Essos, Essos, Yaoundé',
    structured_formatting: { main_text: 'Marché d\'Essos', secondary_text: 'Essos, Yaoundé' },
  },
  {
    place_id: 'new_market_yaounde5',
    description: 'Marché Nkolndongo, Nkolndongo, Yaoundé',
    structured_formatting: { main_text: 'Marché Nkolndongo', secondary_text: 'Nkolndongo, Yaoundé' },
  },
  {
    place_id: 'new_market_yaounde6',
    description: 'Marché Mvog-Mbi, Mvog-Mbi, Yaoundé',
    structured_formatting: { main_text: 'Marché Mvog-Mbi', secondary_text: 'Mvog-Mbi, Yaoundé' },
  },
  {
    place_id: 'new_market_yaounde7',
    description: 'Marché de Biyem-Assi, Biyem-Assi, Yaoundé',
    structured_formatting: { main_text: 'Marché de Biyem-Assi', secondary_text: 'Biyem-Assi, Yaoundé' },
  },
  {
    place_id: 'new_market_yaounde8',
    description: 'Marché de Madagascar, Madagascar, Yaoundé',
    structured_formatting: { main_text: 'Marché de Madagascar', secondary_text: 'Madagascar, Yaoundé' },
  },
  {
    place_id: 'new_market_yaounde9',
    description: 'Marché de Mendong, Mendong, Yaoundé',
    structured_formatting: { main_text: 'Marché de Mendong', secondary_text: 'Mendong, Yaoundé' },
  },
  {
    place_id: 'new_market_yaounde10',
    description: 'Marché de Nsam, Nsam, Yaoundé',
    structured_formatting: { main_text: 'Marché de Nsam', secondary_text: 'Nsam, Yaoundé' },
  },
  {
    place_id: 'new_market_yaounde11',
    description: 'Marché de la Gare, Gare, Yaoundé',
    structured_formatting: { main_text: 'Marché de la Gare', secondary_text: 'Gare, Yaoundé' },
  },
  {
    place_id: 'new_supermarket_yaounde1',
    description: 'Casino (Bastos), Bastos, Yaoundé',
    structured_formatting: { main_text: 'Casino (Bastos)', secondary_text: 'Bastos, Yaoundé' },
  },
  {
    place_id: 'new_supermarket_yaounde2',
    description: 'Casino (Centre-ville), Centre-ville, Yaoundé',
    structured_formatting: { main_text: 'Casino (Centre-ville)', secondary_text: 'Centre-ville, Yaoundé' },
  },
  {
    place_id: 'new_supermarket_yaounde3',
    description: 'Dôvv Bastos, Bastos, Yaoundé',
    structured_formatting: { main_text: 'Dôvv Bastos', secondary_text: 'Bastos, Yaoundé' },
  },
  {
    place_id: 'new_supermarket_yaounde4',
    description: 'Dôvv Mokolo, Mokolo, Yaoundé',
    structured_formatting: { main_text: 'Dôvv Mokolo', secondary_text: 'Mokolo, Yaoundé' },
  },
  {
    place_id: 'new_supermarket_yaounde5',
    description: 'Carrefour Ekie, Ekie, Yaoundé',
    structured_formatting: { main_text: 'Carrefour Ekie', secondary_text: 'Ekie, Yaoundé' },
  },
  {
    place_id: 'new_supermarket_yaounde6',
    description: 'Rayco (Nkol-Eton), Nkol-Eton, Yaoundé',
    structured_formatting: { main_text: 'Rayco (Nkol-Eton)', secondary_text: 'Nkol-Eton, Yaoundé' },
  },
];

const MarketMapScreen: React.FC<Props> = ({ navigation }) => {
  const [currentRegion, setCurrentRegion] = useState({
    latitude: 3.866667, // Default to Yaoundé center for initial map load
    longitude: 11.516667,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [nearbyMarkets, setNearbyMarkets] = useState<Market[]>([]); // Markets found by nearby search
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null); // For detail card
  const [searchRadius, setSearchRadius] = useState('5'); // Search radius in km
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory>('Tous'); // New state for category filter

  // States for search bar and autocomplete
  const [searchText, setSearchText] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false); // True when search bar is focused/active
  const [searchedMarket, setSearchedMarket] = useState<Market | null>(null); // Market found via text search

  // States for route
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[] | null>(null);
  const [routeDuration, setRouteDuration] = useState<string | null>(null);
  const [routeDistance, setRouteDistance] = useState<string | null>(null);


  // Refs for timeouts
  const nearbyFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null); // For radius debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null); // For autocomplete debounce
  const mapRef = useRef<MapView>(null); // Ref for MapView to control map animations


  // Function for "Nearby" search (SIMULATED)
  const fetchNearbyMarkets = useCallback(async (latitude: number, longitude: number, radiusMeters: number, category: MarketCategory) => {
    if (isSearching && searchText.length > 0) {
      return;
    }
    setIsLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Calculate distances dynamically and filter simulated markets
    const marketsWithDistances = RAW_SIMULATED_MARKETS.map(market => {
      const dist = calculateDistance(latitude, longitude, market.latitude, market.longitude);
      return { ...market, distance: dist };
    });

    const filteredByRadius = marketsWithDistances.filter(market => {
      return (market.distance || 0) * 1000 <= radiusMeters;
    });

    const filteredByCategory = filteredByRadius.filter(market => {
      if (category === 'Tous') {
        return true;
      }
      if (category === 'Marché') {
        return market.types.includes('market') || market.types.includes('food');
      }
      if (category === 'Supermarché') {
        return market.types.includes('supermarket');
      }
      return false;
    });

    setNearbyMarkets(filteredByCategory.sort((a,b) => (a.distance || 0) - (b.distance || 0)));
    setIsLoading(false);
  }, [isSearching, searchText]);


  // --- Autocomplete and Place Details functions (SIMULATED) ---

  const fetchAutocompletePredictions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setPredictions([]);
      return;
    }
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    const filteredPredictions = SIMULATED_PREDICTIONS.filter(pred =>
      pred.description.toLowerCase().includes(input.toLowerCase())
    );
    setPredictions(filteredPredictions);
  }, []);

  const fetchPlaceDetails = useCallback(async (placeId: string) => {
    setIsLoading(true);
    Keyboard.dismiss();
    setRouteCoordinates(null); // Clear any existing route
    setRouteDuration(null);
    setRouteDistance(null);

    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

    // Find the market from raw simulated data to ensure it has no distance initially
    const foundMarket = RAW_SIMULATED_MARKETS.find(m => m.place_id === placeId);

    if (foundMarket && currentLocation) {
      // Calculate distance for the found market relative to current location
      const marketWithDistance = {
        ...foundMarket,
        distance: calculateDistance(currentLocation.latitude, currentLocation.longitude, foundMarket.latitude, foundMarket.longitude),
      };

      setNearbyMarkets([]); // Clear nearby markets to show only the searched one
      setSearchedMarket(marketWithDistance);
      setSelectedMarket(marketWithDistance);

      mapRef.current?.animateToRegion({
        latitude: marketWithDistance.latitude,
        longitude: marketWithDistance.longitude,
        latitudeDelta: LATITUDE_DELTA / 5,
        longitudeDelta: LONGITUDE_DELTA / 5,
      }, 800);
    } else {
      Alert.alert('Lieu non trouvé', 'Le lieu sélectionné n\'a pas pu être trouvé ou la position actuelle est inconnue.');
      setSearchedMarket(null);
    }
    setPredictions([]);
    setSearchText('');
    setIsSearching(false);
    setIsLoading(false);
  }, [currentLocation]);


  // --- Itinerary / Directions function (SIMULATED) ---
  const handleGetDirections = useCallback((destinationMarket: Market) => {
    if (!currentLocation) {
      Alert.alert('Position inconnue', 'Impossible de calculer l\'itinéraire. Votre position actuelle n\'est pas disponible.');
      return;
    }

    // Clear any previous route
    setRouteCoordinates(null);
    setRouteDuration(null);
    setRouteDistance(null);

    // Simulate route coordinates (simple straight line)
    const route = [
      { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
      { latitude: destinationMarket.latitude, longitude: destinationMarket.longitude },
    ];
    setRouteCoordinates(route);

    // Simulate duration based on distance (e.g., 15 mins per 5 km, plus 5 mins base)
    const dist = destinationMarket.distance || calculateDistance(currentLocation.latitude, currentLocation.longitude, destinationMarket.latitude, destinationMarket.longitude);
    const simulatedDurationMinutes = Math.round((dist / 5) * 15 + 5); // Example: 15 min per 5km, + 5 min base
    setRouteDuration(`${simulatedDurationMinutes} min`);
    setRouteDistance(`${dist.toFixed(1)} km`);

    // Animate map to show both start and end points of the route
    mapRef.current?.fitToCoordinates(route, {
        edgePadding: { top: 50, right: 50, bottom: 200, left: 50 }, // Adjust padding to avoid clipping markers and UI
        animated: true,
    });

    setSelectedMarket(destinationMarket); // Keep the market details open
  }, [currentLocation]);


  // --- Effets pour l'initialisation et la synchronisation ---

  // Request location permission and get current location
  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Permission de localisation',
              message: 'Cette application a besoin d\'accéder à votre position pour afficher les marchés proches.',
              buttonNeutral: 'Demander plus tard',
              buttonNegative: 'Annuler',
              buttonPositive: 'OK',
            },
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Permission de localisation accordée');
            getCurrentLocation();
          } else {
            console.log('Permission de localisation refusée');
            Alert.alert(
              'Permission refusée',
              'Nous ne pouvons pas afficher les marchés proches sans accès à votre position.',
            );
            setIsLoading(false); // Stop loading if permission denied
            // Optionally, set a default region if location is denied
            setCurrentLocation({ latitude: 3.866667, longitude: 11.516667 }); // Default to Yaounde
            setCurrentRegion({
              latitude: 3.866667,
              longitude: 11.516667,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            });
            fetchNearbyMarkets(3.866667, 11.516667, parseFloat(searchRadius) * 1000, selectedCategory); // Fetch around default
          }
        } catch (err) {
          console.warn(err);
          setIsLoading(false);
        }
      } else { // For iOS and others
        getCurrentLocation();
      }
    };

    const getCurrentLocation = () => {
      setIsLoading(true);
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          setCurrentRegion({
            latitude,
            longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          });
          setIsLoading(false);
          // Trigger initial nearby markets search once real location is obtained
          if (!isSearching && !searchText) {
            fetchNearbyMarkets(latitude, longitude, parseFloat(searchRadius) * 1000, selectedCategory);
          }
        },
        (error) => {
          console.log(error);
          Alert.alert(
            'Erreur de localisation',
            'Impossible de récupérer votre position. Veuillez vérifier vos paramètres GPS.',
          );
          setIsLoading(false);
          // Optionally, set a default region if location fails
          setCurrentLocation({ latitude: 3.866667, longitude: 11.516667 }); // Default to Yaounde
          setCurrentRegion({
            latitude: 3.866667,
            longitude: 11.516667,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          });
          fetchNearbyMarkets(3.866667, 11.516667, parseFloat(searchRadius) * 1000, selectedCategory); // Fetch around default
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    };

    requestLocationPermission();
  }, [isSearching, searchText, fetchNearbyMarkets, searchRadius, selectedCategory]); // Added selectedCategory to dependencies


  // Effect to trigger Nearby search when radius, location or category changes (debounced)
  useEffect(() => {
    const radius = parseFloat(searchRadius);
    if (currentLocation && radius > 0 && !isSearching && searchText === '') {
      if (nearbyFetchTimeoutRef.current) {
        clearTimeout(nearbyFetchTimeoutRef.current);
      }
      nearbyFetchTimeoutRef.current = setTimeout(() => {
        fetchNearbyMarkets(currentLocation.latitude, currentLocation.longitude, radius * 1000, selectedCategory);
      }, 700);
    }
    return () => {
      if (nearbyFetchTimeoutRef.current) {
        clearTimeout(nearbyFetchTimeoutRef.current);
      }
    };
  }, [searchRadius, currentLocation, isSearching, searchText, fetchNearbyMarkets, selectedCategory]);

  // Effect to debounce autocomplete requests
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (searchText.length > 2) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchAutocompletePredictions(searchText);
      }, 500);
    } else {
      setPredictions([]);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchText, fetchAutocompletePredictions]);


  // When a marker is pressed
  const handleMarkerPress = (market: Market) => {
    setSelectedMarket(market);
    setRouteCoordinates(null); // Clear route when a new marker is selected
    setRouteDuration(null);
    setRouteDistance(null);
    mapRef.current?.animateToRegion({
      latitude: market.latitude,
      longitude: market.longitude,
      latitudeDelta: LATITUDE_DELTA / 5,
      longitudeDelta: LONGITUDE_DELTA / 5,
    }, 500);
  };

  // Display global loader if loading
  if (isLoading && !currentLocation) { // Show loader until initial location is set
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Récupération de votre position...</Text>
      </View>
    );
  }

  // Determine which markets to display on the map and in the list
  const marketsToDisplay = searchedMarket ? [searchedMarket] : nearbyMarkets;
  // Determine which markets to show in the scrollable list
  const listMarkets = searchedMarket ? [searchedMarket] : nearbyMarkets;


  return (
    <View style={styles.container}>
      {/* Header with search bar */}
      <LinearGradient colors={['#f97316', '#ef4444']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un marché, un lieu..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => {
              setIsSearching(true);
              setSearchedMarket(null);
              setSelectedMarket(null);
              setRouteCoordinates(null); // Clear route when searching
              setRouteDuration(null);
              setRouteDistance(null);
            }}
            onBlur={() => {
              // Only reset search state if search text is empty and no predictions are showing
              if (searchText === '' && predictions.length === 0) {
                setIsSearching(false);
                if (currentLocation) {
                  fetchNearbyMarkets(currentLocation.latitude, currentLocation.longitude, parseFloat(searchRadius) * 1000, selectedCategory);
                }
              }
            }}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchText('');
              setPredictions([]);
              setSearchedMarket(null);
              setSelectedMarket(null);
              setIsSearching(false);
              Keyboard.dismiss();
              setRouteCoordinates(null); // Clear route
              setRouteDuration(null);
              setRouteDistance(null);
              if (currentLocation) {
                fetchNearbyMarkets(currentLocation.latitude, currentLocation.longitude, parseFloat(searchRadius) * 1000, selectedCategory);
              }
            }} style={styles.clearSearchButton}>
              <MaterialCommunityIcons name="close-circle" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Autocomplete Predictions */}
      {isSearching && searchText.length > 2 && predictions.length > 0 && (
        <ScrollView style={styles.predictionsContainer} keyboardShouldPersistTaps="always">
          {predictions.map((prediction) => (
            <TouchableOpacity
              key={prediction.place_id}
              style={styles.predictionItem}
              onPress={() => fetchPlaceDetails(prediction.place_id)}
            >
              <Text style={styles.predictionMainText}>{prediction.structured_formatting.main_text}</Text>
              <Text style={styles.predictionSecondaryText}>{prediction.structured_formatting.secondary_text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}


      {/* Radius filter options (only visible if not actively searching) */}
      {!isSearching && (
        <View style={styles.filterOptionsContainer}>
          <View style={styles.radiusInputContainer}>
            <Text style={styles.radiusLabel}>Rayon de recherche (km) :</Text>
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

          {/* Category Filter Buttons */}
          <View style={styles.categoryFilterContainer}>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === 'Tous' && styles.selectedCategoryButton,
              ]}
              onPress={() => setSelectedCategory('Tous')}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === 'Tous' && styles.selectedCategoryButtonText,
                ]}
              >
                Tous
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === 'Marché' && styles.selectedCategoryButton,
              ]}
              onPress={() => setSelectedCategory('Marché')}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === 'Marché' && styles.selectedCategoryButtonText,
                ]}
              >
                Marché
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === 'Supermarché' && styles.selectedCategoryButton,
              ]}
              onPress={() => setSelectedCategory('Supermarché')}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === 'Supermarché' && styles.selectedCategoryButtonText,
                ]}
              >
                Supermarché
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}


      {/* Map View */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={currentRegion} // Uses default or actual location once set
        showsUserLocation={true}
        followsUserLocation={true}
        onRegionChangeComplete={setCurrentRegion}
        onPress={() => {
            setSelectedMarket(null);
            setRouteCoordinates(null); // Clear route when map is pressed
            setRouteDuration(null);
            setRouteDistance(null);
            if (!searchText) { // Only reset search if not actively typing
                setIsSearching(false);
                setSearchedMarket(null);
                if (currentLocation) { // Re-fetch nearby markets if current location is known
                    fetchNearbyMarkets(currentLocation.latitude, currentLocation.longitude, parseFloat(searchRadius) * 1000, selectedCategory);
                }
            }
        }}
      >
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Ma Position"
            description="Vous êtes ici"
            pinColor="blue"
          />
        )}
        {currentLocation && parseFloat(searchRadius) > 0 && !isSearching && (
          <Circle
            center={currentLocation}
            radius={parseFloat(searchRadius) * 1000} // Radius in meters
            strokeWidth={2}
            strokeColor="rgba(249, 115, 22, 0.8)" // Orange color
            fillColor="rgba(249, 115, 22, 0.2)" // Light orange fill
          />
        )}
        {marketsToDisplay.map((market) => (
          <Marker
            key={market.place_id}
            coordinate={{ latitude: market.latitude, longitude: market.longitude }}
            title={market.name}
            description={market.vicinity + (market.distance !== undefined ? ` (${market.distance.toFixed(1)} km)` : '')}
            onPress={e => handleMarkerPress(market)}
            // Custom marker icon based on type
          >
            <View style={styles.customMarker}>
              {market.types.includes('supermarket') ? (
                <MaterialCommunityIcons name="cart" size={30} color="#007BFF" /> // Blue for supermarket
              ) : (
                <MaterialCommunityIcons name="shopping" size={30} color="#f97316" /> // Orange for general market
              )}
            </View>
          </Marker>
        ))}
        {routeCoordinates && (
            <Polyline
                coordinates={routeCoordinates}
                strokeWidth={4}
                strokeColor="#007BFF" // Blue for the route
                lineCap="round"
                lineJoin="round"
            />
        )}
      </MapView>


      {/* Selected market details card */}
      {selectedMarket && (
        <View style={styles.marketDetailCard}>
          <Text style={styles.marketDetailName}>{selectedMarket.name}</Text>
          <Text style={styles.marketDetailAddress}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color="#6B7280" />{' '}
            {selectedMarket.vicinity}
          </Text>
          {selectedMarket.distance !== undefined && (
            <Text style={styles.marketDetailDistance}>
              <MaterialCommunityIcons name="map-marker-distance" size={16} color="#6B7280" />{' '}
              {selectedMarket.distance.toFixed(1)} km
            </Text>
          )}
          {selectedMarket.rating !== undefined && (
            <View style={styles.marketDetailRatingContainer}>
              <MaterialCommunityIcons name="star" size={18} color="#facc15" />
              <Text style={styles.marketDetailRatingText}>
                {selectedMarket.rating.toFixed(1)} ({selectedMarket.user_ratings_total || 0} avis)
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.directionsButton}
            onPress={() => handleGetDirections(selectedMarket)}
          >
            <MaterialCommunityIcons name="directions" size={20} color="#fff" />
            <Text style={styles.directionsButtonText}>Itinéraire</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeDetailButton} onPress={() => {
              setSelectedMarket(null);
              setRouteCoordinates(null); // Clear route when card is closed
              setRouteDuration(null);
              setRouteDistance(null);
          }}>
            <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}

      {/* Route information container */}
      {routeDuration && routeDistance && (
          <View style={styles.routeInfoContainer}>
              <Text style={styles.routeInfoText}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color="#374151" />
                  {' '}Durée estimée: {routeDuration}
              </Text>
              <Text style={styles.routeInfoText}>
                  <MaterialCommunityIcons name="map-marker-distance" size={16} color="#374151" />
                  {' '}Distance: {routeDistance}
              </Text>
          </View>
      )}


      {/* List of markets */}
      <>
        <Text style={styles.listTitle}>
          {isSearching && searchedMarket ? 'Résultat de la recherche' : `Marchés proches (${listMarkets.length})`}
        </Text>
        <ScrollView
          style={styles.marketListContainer}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.marketListContentContainer}
        >
          {listMarkets.length === 0 ? (
            <Text style={styles.noMarketsText}>
              {isLoading && !currentLocation ? 'Récupération de votre position...' :
               isLoading ? 'Chargement des marchés...' :
               isSearching && searchText.length > 0 && !searchedMarket ? 'Aucun résultat trouvé pour votre recherche.' :
               'Aucun marché trouvé dans le rayon actuel.'}
            </Text>
          ) : (
            listMarkets.map((market) => (
              <TouchableOpacity
                key={market.place_id}
                style={[
                  styles.marketListItem,
                  selectedMarket?.place_id === market.place_id && styles.selectedMarketListItem,
                ]}
                onPress={() => handleMarkerPress(market)}
              >
                <Text style={styles.marketListItemName}>{market.name}</Text>
                <Text style={styles.marketListItemAddress}>{market.vicinity}</Text>
                {market.distance !== undefined && (
                  <Text style={styles.marketListItemDistance}>
                    {market.distance.toFixed(1)} km
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light gray background
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
    // fontFamily: 'Montserrat-Medium', // Example font
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 22,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#fff',
    marginHorizontal: 12,
    // fontFamily: 'Montserrat-Regular',
  },
  clearSearchButton: {
    padding: 8,
    borderRadius: 20,
  },
  filterOptionsContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 9,
  },
  radiusInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 5,
  },
  radiusLabel: {
    fontSize: 15,
    color: '#4B5563',
    marginRight: 10,
    fontWeight: '600',
    // fontFamily: 'Montserrat-SemiBold',
  },
  radiusInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: 70,
    textAlign: 'center',
    fontSize: 15,
    color: '#1F2937',
    // fontFamily: 'Montserrat-Regular',
  },
  radiusLoadingIndicator: {
    marginLeft: 10,
  },
  categoryFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selectedCategoryButton: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  selectedCategoryButtonText: {
    color: '#fff',
  },
  map: {
    width: '100%',
    height: Dimensions.get('window').height * 0.45,
    zIndex: 1,
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40, // Increased size for visibility
    height: 40, // Increased size for visibility
    borderRadius: 20, // Make it round
    backgroundColor: 'rgba(255,255,255,0.8)', // White background for the icon
    borderWidth: 2,
    borderColor: '#f97316', // Orange border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  predictionsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 105 : 75,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    maxHeight: Dimensions.get('window').height * 0.4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 15,
  },
  predictionItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  predictionMainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    // fontFamily: 'Montserrat-SemiBold',
  },
  predictionSecondaryText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    // fontFamily: 'Montserrat-Regular',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#F3F4F6',
    zIndex: 3,
    // fontFamily: 'Montserrat-Bold',
  },
  marketDetailCard: {
    position: 'absolute',
    bottom: 150,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 20,
  },
  marketDetailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    // fontFamily: 'Montserrat-Bold',
  },
  marketDetailAddress: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 4,
    // fontFamily: 'Montserrat-Regular',
    flexDirection: 'row',
    alignItems: 'center',
  },
  marketDetailDistance: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 8,
    // fontFamily: 'Montserrat-Regular',
    flexDirection: 'row',
    alignItems: 'center',
  },
  marketDetailRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  marketDetailRatingText: {
    fontSize: 15,
    marginLeft: 6,
    color: '#374151',
    // fontFamily: 'Montserrat-Regular',
  },
  directionsButton: {
    backgroundColor: '#f97316',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    gap: 8,
  },
  directionsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeDetailButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 15,
  },
  routeInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 8,
    paddingBottom: 12, // Increased padding
    paddingHorizontal: 16,
    borderBottomWidth: 0, // Removed borderBottomWidth
    backgroundColor: '#fff', // White background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 9, // Placed below predictions but above map
  },
  routeInfoText: {
    fontSize: 14,
    color: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    fontWeight: '600',
  },
  marketListContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    maxHeight: 140,
    zIndex: 2,
  },
  marketListContentContainer: {
    paddingRight: 16,
  },
  marketListItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: width * 0.75,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  selectedMarketListItem: {
    borderColor: '#f97316',
    borderWidth: 2,
  },
  marketListItemName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    // fontFamily: 'Montserrat-Bold',
  },
  marketListItemAddress: {
    fontSize: 13,
    color: '#6B7280',
    // fontFamily: 'Montserrat-Regular',
  },
  marketListItemDistance: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
    // fontFamily: 'Montserrat-Medium',
  },
  noMarketsText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    width: width - 32,
    // fontFamily: 'Montserrat-Regular',
    paddingVertical: 20,
  }
});

export default MarketMapScreen;