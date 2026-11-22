import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, ScrollView, Linking } from 'react-native';
import mobileClient from '../api/client';

export default function ChemistShopScreen() {
  const [subTab, setSubTab] = useState('chemists'); // 'chemists' | 'shop' | 'orders'
  const [loading, setLoading] = useState(false);

  // Healthcare Facilities State
  const [facilities, setFacilities] = useState([]);
  const [facilityFilter, setFacilityFilter] = useState('all'); // 'all' | 'chemist' | 'hospital' | 'clinic'
  const [chemistsSearch, setChemistsSearch] = useState('');

  // Shop State
  const [shopQuery, setShopQuery] = useState('');
  const [shopProducts, setShopProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [generics, setGenerics] = useState([]);
  const [genericsLoading, setGenericsLoading] = useState(false);

  // Orders State
  const [orders, setOrders] = useState([]);

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const res = await mobileClient.get('/places/nearby?latitude=12.9716&longitude=77.5946&radiusKm=25');
      const list = res.data?.facilities || res.data?.chemists || [];
      setFacilities(list);
    } catch (_e) {
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchShop = async () => {
    setLoading(true);
    try {
      const endpoint = shopQuery.trim() ? `/shop/search?query=${encodeURIComponent(shopQuery.trim())}` : '/shop/search';
      const res = await mobileClient.get(endpoint);
      setShopProducts(res.data?.results || []);
    } catch (_e) {
      setShopProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await mobileClient.get('/orders');
      setOrders(res.data?.orders || []);
    } catch (_e) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 'chemists') fetchFacilities();
    if (subTab === 'shop') fetchShop();
    if (subTab === 'orders') fetchOrders();
  }, [subTab]);

  const handleOpenGoogleMaps = (item) => {
    const lat = item.coordinates?.latitude || 12.9716;
    const lng = item.coordinates?.longitude || 77.5946;
    const url = item.google_maps_url || `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch(() => Alert.alert('Navigation Error', 'Could not open Google Maps.'));
  };

  const handleCallFacility = (item) => {
    const phone = item.emergency_phone || item.phone;
    if (phone) {
      Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() =>
        Alert.alert('Phone Call', `Contact: ${phone}`)
      );
    } else {
      Alert.alert('Phone Notice', 'Contact number not available for this facility.');
    }
  };

  const filteredFacilities = facilities.filter(f => {
    if (facilityFilter !== 'all' && f.type !== facilityFilter) return false;
    if (chemistsSearch.trim()) {
      const q = chemistsSearch.trim().toLowerCase();
      return (f.name || '').toLowerCase().includes(q) || (f.address?.street || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleCompareGenerics = async (item) => {
    setSelectedProduct(item);
    setGenericsLoading(true);
    try {
      const res = await mobileClient.get(`/shop/generics/${item.medicineId || item._id}`);
      setGenerics(res.data?.alternatives || []);
    } catch (_e) {
      setGenerics([]);
    } finally {
      setGenericsLoading(false);
    }
  };

  const handleQuickOrder = async (item) => {
    try {
      const orderPayload = {
        retailerId: item.retailer?._id || item.retailerId,
        items: [{
          medicineId: item.medicineId || item._id,
          name: item.name,
          quantity: 1,
          price: item.price
        }],
        deliveryAddress: {
          street: '123 Main Road',
          city: 'Bangalore',
          pincode: '560001'
        },
        paymentMethod: 'cod'
      };

      const res = await mobileClient.post('/orders', orderPayload);
      Alert.alert('Order Placed!', `Your order for "${item.name}" has been placed. You can track dispatch in the Orders tab.`);
      setSubTab('orders');
    } catch (err) {
      Alert.alert('Checkout Notice', err.message || 'Prescription required or checkout failed');
    }
  };

  return (
    <View style={styles.container}>
      {/* Sub Tabs */}
      <View style={styles.subTabBar}>
        <TouchableOpacity
          style={[styles.subTabItem, subTab === 'chemists' && styles.subTabActive]}
          onPress={() => setSubTab('chemists')}
        >
          <Text style={[styles.subTabText, subTab === 'chemists' && styles.subTabTextActive]}>
            Nearby Chemists
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabItem, subTab === 'shop' && styles.subTabActive]}
          onPress={() => setSubTab('shop')}
        >
          <Text style={[styles.subTabText, subTab === 'shop' && styles.subTabTextActive]}>
            Pharmacy Shop
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabItem, subTab === 'orders' && styles.subTabActive]}
          onPress={() => setSubTab('orders')}
        >
          <Text style={[styles.subTabText, subTab === 'orders' && styles.subTabTextActive]}>
            My Orders
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sub Tab 1: Nearby Healthcare & Chemists */}
      {subTab === 'chemists' && (
        <View style={styles.content}>
          {/* Facility Filter Pills */}
          <View style={styles.facilityFilterRow}>
            {[
              { id: 'all', label: 'All' },
              { id: 'chemist', label: '💊 Chemists' },
              { id: 'hospital', label: '🏥 Hospitals' },
              { id: 'clinic', label: '🩺 Clinics' }
            ].map(tab => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.facilityFilterPill, facilityFilter === tab.id && styles.facilityFilterPillActive]}
                onPress={() => setFacilityFilter(tab.id)}
              >
                <Text style={[styles.facilityFilterText, facilityFilter === tab.id && styles.facilityFilterTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Search */}
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Filter by facility name or area..."
              value={chemistsSearch}
              onChangeText={setChemistsSearch}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#0d9488" style={{ marginTop: 40 }} />
          ) : filteredFacilities.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Facilities Found</Text>
              <Text style={styles.emptySub}>No healthcare facilities match your criteria in this radius.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredFacilities}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listPadding}
              renderItem={({ item }) => {
                const isHospital = item.type === 'hospital';
                const isClinic = item.type === 'clinic';

                return (
                  <View style={styles.card}>
                    <View style={styles.cardTop}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <View style={[
                            styles.typeBadge,
                            isHospital ? styles.typeBadgeHospital : (isClinic ? styles.typeBadgeClinic : styles.typeBadgeChemist)
                          ]}>
                            <Text style={styles.typeBadgeText}>
                              {item.type === 'chemist' ? '💊 Chemist' : (isHospital ? '🏥 Hospital' : '🩺 Clinic')}
                            </Text>
                          </View>
                          {item.is_emergency_24x7 && (
                            <View style={styles.emergencyPill}>
                              <Text style={styles.emergencyPillText}>24x7 Emergency</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.storeName}>{item.name}</Text>
                      </View>
                      <Text style={styles.distBadge}>
                        {item.distanceKm ? `${item.distanceKm.toFixed(1)} km` : 'Nearby'}
                      </Text>
                    </View>

                    <Text style={styles.storeAddress}>
                      {item.address?.street}, {item.address?.city}
                    </Text>

                    <View style={styles.cardFooter}>
                      <Text style={styles.storeHours}>🕒 {item.opening_hours || item.openingHours || 'Open 24 Hours'}</Text>
                    </View>

                    {/* Action Buttons: Google Maps Navigation & Call */}
                    <View style={styles.actionBtnRow}>
                      <TouchableOpacity
                        style={styles.directionsBtn}
                        onPress={() => handleOpenGoogleMaps(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.directionsBtnText}>📍 Google Maps</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.callBtn}
                        onPress={() => handleCallFacility(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.callBtnText}>📞 Call</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      )}

      {/* Sub Tab 2: Pharmacy Shop */}
      {subTab === 'shop' && (
        <View style={styles.content}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search medicines or salt molecules..."
              value={shopQuery}
              onChangeText={setShopQuery}
              onSubmitEditing={fetchShop}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={fetchShop}>
              <Text style={styles.searchBtnText}>Go</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#0d9488" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={shopProducts}
              keyExtractor={(item, idx) => idx.toString()}
              contentContainerStyle={styles.listPadding}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.storeName}>{item.name}</Text>
                    <Text style={styles.priceTag}>₹{item.price}</Text>
                  </View>
                  <Text style={styles.storeAddress}>
                    {item.strength} • From {item.retailer?.storeName || 'Partner Pharmacy'}
                  </Text>

                  <View style={styles.actionBtnRow}>
                    <TouchableOpacity
                      style={styles.compareBtn}
                      onPress={() => handleCompareGenerics(item)}
                    >
                      <Text style={styles.compareBtnText}>🏷️ Generics</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.buyBtn}
                      onPress={() => handleQuickOrder(item)}
                    >
                      <Text style={styles.buyBtnText}>Quick Buy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}

          {/* Generics Drawer */}
          {selectedProduct && (
            <View style={styles.genericsOverlay}>
              <View style={styles.genericsBox}>
                <View style={styles.cardTop}>
                  <Text style={styles.genericsTitle}>Generic Substitutes</Text>
                  <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                    <Text style={styles.closeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.genericsSub}>
                  Affordable alternatives for {selectedProduct.name}:
                </Text>

                {genericsLoading ? (
                  <ActivityIndicator size="small" color="#0d9488" style={{ marginVertical: 10 }} />
                ) : generics.length === 0 ? (
                  <Text style={styles.emptyGeneric}>No generic equivalents indexed.</Text>
                ) : (
                  generics.map((gen, idx) => (
                    <View key={idx} style={styles.genericItem}>
                      <View>
                        <Text style={styles.genName}>{gen.name}</Text>
                        <Text style={styles.genSavings}>Save {gen.savingsPercentage}%</Text>
                      </View>
                      <Text style={styles.genPrice}>₹{gen.price}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Sub Tab 3: Orders */}
      {subTab === 'orders' && (
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color="#0d9488" style={{ marginTop: 40 }} />
          ) : orders.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No Orders Placed</Text>
              <Text style={styles.emptySub}>Order medicines online for fast doorstep delivery.</Text>
            </View>
          ) : (
            <FlatList
              data={orders}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listPadding}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.orderId}>Order #{item._id.slice(-6).toUpperCase()}</Text>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.orderTotal}>Total: ₹{item.totalAmount?.toFixed(2)} • {item.paymentMethod.toUpperCase()}</Text>

                  {item.status === 'delivered' && (
                    <View style={styles.autoStockBanner}>
                      <Text style={styles.autoStockText}>✨ Delivered: Cabinet stock automatically restocked!</Text>
                    </View>
                  )}
                </View>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingHorizontal: 8
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center'
  },
  subTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#0d9488'
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b'
  },
  subTabTextActive: {
    color: '#0d9488',
    fontWeight: '700'
  },
  content: {
    flex: 1
  },
  listPadding: {
    padding: 16
  },
  searchBar: {
    flexDirection: 'row',
    padding: 14,
    gap: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    backgroundColor: '#ffffff'
  },
  searchBtn: {
    backgroundColor: '#0d9488',
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  storeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1
  },
  distBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0d9488'
  },
  priceTag: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  storeAddress: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 8
  },
  storeHours: {
    fontSize: 11,
    color: '#94a3b8'
  },
  storePhone: {
    fontSize: 11,
    color: '#0d9488',
    fontWeight: '600'
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6
  },
  compareBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  compareBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569'
  },
  buyBtn: {
    flex: 1,
    backgroundColor: '#0d9488',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  buyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff'
  },
  orderId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  statusPill: {
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0d9488'
  },
  orderTotal: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  autoStockBanner: {
    backgroundColor: '#ecfdf5',
    padding: 8,
    borderRadius: 8,
    marginTop: 8
  },
  autoStockText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700'
  },
  genericsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16
  },
  genericsBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16
  },
  genericsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a'
  },
  closeBtn: {
    fontSize: 16,
    color: '#64748b'
  },
  genericsSub: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8
  },
  genericItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  genName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a'
  },
  genSavings: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700'
  },
  genPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a'
  },
  emptyGeneric: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 12
  },
  emptyBox: {
    padding: 32,
    alignItems: 'center'
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4
  },
  facilityFilterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  facilityFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9'
  },
  facilityFilterPillActive: {
    backgroundColor: '#0f172a'
  },
  facilityFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  facilityFilterTextActive: {
    color: '#ffffff'
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6
  },
  typeBadgeChemist: {
    backgroundColor: '#d1fae5'
  },
  typeBadgeHospital: {
    backgroundColor: '#ffe4e6'
  },
  typeBadgeClinic: {
    backgroundColor: '#dbeafe'
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  emergencyPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  emergencyPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400e'
  },
  directionsBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginRight: 6
  },
  directionsBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  callBtn: {
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center'
  },
  callBtnText: {
    color: '#1e293b',
    fontSize: 12,
    fontWeight: '700'
  }
});
