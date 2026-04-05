import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, StyleSheet, SafeAreaView, ScrollView, 
    TouchableOpacity, TextInput, Image, ActivityIndicator, 
    Linking, Platform, Alert, Dimensions, Keyboard,
    PermissionsAndroid 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackScreenProps } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/AppNavigator';
import HeaderMenu from '../../components/common/HeaderMenu';
import Geolocation from '@react-native-community/geolocation'; 

const GOOGLE_API_KEY = 'AIzaSyD6EVQlX2w53NJ_KGaMSgS_4aKfyd_bZB0';

interface Clinic {
    id: string;
    name: string;
    address: string;
    phone?: string;
    lat: number;
    lon: number;
    rating?: number;
}

interface ClinicLocatorProps extends StackScreenProps<MainStackParamList, 'ClinicLocator'> {
    onSignOut: () => void;
}

const { width, height } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;
const ClinicImageSource = require('../../assets/images/clinic-images.jpeg');

// --- COMPONENT: Individual Clinic Item ---
const ClinicListItem: React.FC<{ clinic: Clinic }> = ({ clinic }) => {
    const handleCall = () => {
        if (clinic.phone) {
            const cleanPhone = clinic.phone.replace(/[^0-9+]/g, '');
            const phoneUrl = Platform.OS === 'android' ? `tel:${cleanPhone}` : `telprompt:${cleanPhone}`;
            Linking.openURL(phoneUrl).catch(() => Alert.alert("Error", "Unable to open dialer"));
        } else {
            Alert.alert("Contact Info", "Phone number not available.");
        }
    };

    const handleDirections = () => {
        const latLng = `${clinic.lat},${clinic.lon}`;
        const label = encodeURIComponent(clinic.name);
        const url = Platform.select({
            ios: `maps:0,0?q=${label}@${latLng}`,
            android: `geo:0,0?q=${latLng}(${label})`
        });
        if (url) Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open maps"));
    };

    return (
        <View style={itemStyles.container}>
            <Image source={ClinicImageSource} style={itemStyles.image} />
            <View style={itemStyles.details}>
                <Text style={itemStyles.name} numberOfLines={1}>{clinic.name}</Text>
                <Text style={itemStyles.doctor}>⭐ {clinic.rating || 'N/A'} • Specialist</Text>
                <Text style={itemStyles.address} numberOfLines={2}>{clinic.address}</Text>
                <View style={itemStyles.buttonRow}>
                    <TouchableOpacity 
                        style={[itemStyles.actionButton, !clinic.phone && {borderColor: '#E5E7EB'}]} 
                        onPress={handleCall}
                        disabled={!clinic.phone}
                    >
                        <Text style={[itemStyles.actionText, !clinic.phone && {color: '#9CA3AF'}]}>
                            {clinic.phone ? '📞 Call' : '📞 N/A'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[itemStyles.actionButton, itemStyles.dirButton]} onPress={handleDirections}>
                        <Text style={[itemStyles.actionText, itemStyles.dirActionText]}>📍 Route</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

// --- MAIN SCREEN ---
const ClinicLocatorScreen: React.FC<ClinicLocatorProps> = ({ navigation, onSignOut }) => {
    // 1. ALL HOOKS AT THE TOP LEVEL (Never conditional)
    const { t } = useTranslation();
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [coords, setCoords] = useState<{lat: number, lon: number} | null>(null);

    // Function to fetch clinics (wrapped in useCallback to prevent re-renders)
    const fetchClinics = useCallback(async (latitude: number, longitude: number) => {
        setLoading(true);
        const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=dentist&key=${GOOGLE_API_KEY}`;

        try {
            const response = await fetch(nearbyUrl);
            const data = await response.json();

            if (data.status === 'OK') {
                const detailedClinics = await Promise.all(
                    data.results.slice(0, 8).map(async (place: any) => {
                        try {
                            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number&key=${GOOGLE_API_KEY}`;
                            const detailsRes = await fetch(detailsUrl);
                            const detailsData = await detailsRes.json();
                            return {
                                id: place.place_id,
                                name: place.name,
                                address: place.vicinity || "Nearby Location",
                                lat: place.geometry.location.lat,
                                lon: place.geometry.location.lng,
                                rating: place.rating,
                                phone: detailsData.result?.formatted_phone_number || null,
                            };
                        } catch {
                            return {
                                id: place.place_id,
                                name: place.name,
                                address: place.vicinity,
                                lat: place.geometry.location.lat,
                                lon: place.geometry.location.lng,
                                rating: place.rating,
                                phone: null,
                            };
                        }
                    })
                );
                setClinics(detailedClinics);
            } else {
                setClinics([]);
            }
        } catch (error) {
            console.error("Clinic Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const useFallback = useCallback(() => {
        const defaultLat = 19.0443, defaultLon = 72.8824; 
        setCoords({ lat: defaultLat, lon: defaultLon });
        fetchClinics(defaultLat, defaultLon);
    }, [fetchClinics]);

    const getCurrentLocation = useCallback(async () => {
        setLoading(true);
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    useFallback();
                    return;
                }
            } catch (err) {
                useFallback();
                return;
            }
        }

        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setCoords({ lat: latitude, lon: longitude });
                fetchClinics(latitude, longitude);
            },
            () => useFallback(),
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
        );
    }, [fetchClinics, useFallback]);

    const handleSearch = async () => {
        if (!searchText.trim()) return;
        Keyboard.dismiss();
        setLoading(true);
        try {
            const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchText)}&key=${GOOGLE_API_KEY}`;
            const geoRes = await fetch(geoUrl);
            const geoData = await geoRes.json();
            if (geoData.status === 'OK') {
                const location = geoData.results[0].geometry.location;
                setCoords({ lat: location.lat, lon: location.lng });
                fetchClinics(location.lat, location.lng);
            } else {
                setLoading(false);
                Alert.alert("Not Found", "Try a different location.");
            }
        } catch (error) {
            setLoading(false);
        }
    };

    useEffect(() => {
        getCurrentLocation();
    }, []); // Only runs once on mount

    return (
        <SafeAreaView style={styles.safeArea}>
            <HeaderMenu title="Specialist Locator" navigation={navigation as any} onSignOut={onSignOut} />
            <View style={styles.searchContainer}>
                <View style={styles.searchWrapper}>
                    <TextInput
                        style={styles.locationInput}
                        value={searchText}
                        onChangeText={setSearchText}
                        placeholder="Search City or Area"
                        placeholderTextColor="#94A3B8"
                        onSubmitEditing={handleSearch}
                    />
                    <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                        <Text style={styles.searchBtnText}>Search</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#E9574A" />
                        <Text style={styles.loadingText}>Locating specialists...</Text>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {clinics.length > 0 ? (
                            clinics.map(clinic => <ClinicListItem key={clinic.id} clinic={clinic} />)
                        ) : (
                            <Text style={styles.noDataText}>No specialists found in this area.</Text>
                        )}
                    </View>
                )}
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>Return Home</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

// --- STYLES ---
const itemStyles = StyleSheet.create({
    container: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 16, padding: scale(12), marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
    image: { width: scale(80), height: scale(80), borderRadius: 12, marginRight: 12 },
    details: { flex: 1, justifyContent: 'space-between' },
    name: { fontSize: scale(14), fontWeight: 'bold', color: '#1E293B' },
    doctor: { fontSize: scale(12), color: '#E9574A', fontWeight: '600' },
    address: { fontSize: scale(11), color: '#64748B' },
    buttonRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    actionButton: { flex: 1, borderColor: '#E9574A', paddingVertical: 6, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
    dirButton: { backgroundColor: '#E9574A' },
    actionText: { fontSize: scale(11), fontWeight: 'bold', color: '#E9574A' },
    dirActionText: { color: '#fff' }
});

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
    searchContainer: { paddingHorizontal: width * 0.05, marginTop: -height * 0.04, zIndex: 10 },
    searchWrapper: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 15, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, alignItems: 'center', paddingRight: 10 },
    locationInput: { flex: 1, height: 55, paddingHorizontal: 15, fontSize: scale(15), color: '#333' },
    searchBtn: { backgroundColor: '#E9574A', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
    searchBtnText: { color: '#fff', fontWeight: 'bold', fontSize: scale(12) },
    scrollContainer: { paddingHorizontal: width * 0.05, paddingTop: 20, paddingBottom: 40 },
    loaderContainer: { marginTop: 40, alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#64748B' },
    listContainer: { flex: 1 },
    noDataText: { textAlign: 'center', marginTop: 40, color: '#94A3B8' },
    backButton: { height: 55, backgroundColor: '#E9574A', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    backButtonText: { color: 'white', fontWeight: 'bold', fontSize: scale(16) }
});

export default ClinicLocatorScreen;