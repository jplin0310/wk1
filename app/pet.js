import React, { useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, Pressable, Alert, Modal, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { initPets, getPets, updatePet, getGlobalData, updateGlobalData } from '../utils/storage';

// 靜態資源定義，讓 bundler 能正確識別
const catFoodImage = require('./assets/food/cat_food.png');
const dogFoodImage = require('./assets/food/dog_food.png');
const catPetImage = require('./assets/pets/cat.png');
const dogPetImage = require('./assets/pets/dog.png');
const ballImage = require('./assets/game/ball.png');
const frisbeeImage = require('./assets/game/frisbee.png');
const yarnImage = require('./assets/game/yarn.png');
const switchIcon = require('./assets/icon/switch.png');
const shopIcon = require('./assets/icon/shop_logo.png');
const gameIcon = require('./assets/icon/game.png');

export default function PetScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [pet, setPet] = useState(null);
  const [rewards, setRewards] = useState(0);
  const [level, setLevel] = useState(1);
  const [allPets, setAllPets] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [foodModalVisible, setFoodModalVisible] = useState(false);
  const [toyModalVisible, setToyModalVisible] = useState(false);
  const [selectedFood, setSelectedFood] = useState('貓飼料');
  const [selectedToy, setSelectedToy] = useState('球');
  const [globalData, setGlobalData] = useState(null);
  const [availableFoods, setAvailableFoods] = useState([]);

  const [toys, setToys] = useState([]);

  const petId = Number(id || '1');

  // 🔥 載入該寵物資料，每次回到畫面時更新
  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        await initPets();
        const pets = await getPets();
        setAllPets(pets);

        const found = pets.find(p => p.id === petId);
        if (found) {
          setPet(found);
          setLevel(found.level || 1);
          setRewards(found.rewards || 0);

          // 🔥 根據寵物類型設置可用飼料
          const petType = found.type;
          if (petType === 'dog') {
            setAvailableFoods([{ name: '狗飼料', image: dogFoodImage }]);
            setSelectedFood('狗飼料');
          } else {
            setAvailableFoods([{ name: '貓飼料', image: catFoodImage }]);
            setSelectedFood('貓飼料');
          }
        }

        // 🔥 獲取全局飼料計數和玩具列表
        const gData = await getGlobalData();
        setGlobalData(gData);
        setToys(gData.toys || []);
      };
      load();
    }, [petId])
  );

  const handlePetSelect = async (selectedPet) => {
    setModalVisible(false);
    setPet(selectedPet);
    setLevel(selectedPet.level || 1);
    setRewards(selectedPet.rewards || 0);

    // 🔥 根據寵物類型設置可用飼料
    const petType = selectedPet.type;
    if (petType === 'dog') {
      setAvailableFoods([{ name: '狗飼料', image: dogFoodImage }]);
      setSelectedFood('狗飼料');
    } else {
      setAvailableFoods([{ name: '貓飼料', image: catFoodImage }]);
      setSelectedFood('貓飼料');
    }

    router.replace({ pathname: '/pet', params: { id: selectedPet.id } });
  };

  // 🔥 經驗值系統
  const addRewards = async (amount) => {
    setRewards(prev => {
      let newRewards = prev + amount;
      const required = level * 100;

      if (newRewards >= required) {
        const newLevel = level + 1;
        setLevel(newLevel);

        // 🔥 升級也存起來
        updatePet(pet.id, { level: newLevel, rewards: newRewards - required });

        return newRewards - required;
      } else {
        // 🔥 即使沒升級，也存 rewards
        updatePet(pet.id, { rewards: newRewards });
        return newRewards;
      }
    });
  };

  // 🍖 餵食
  const feedPet = async () => {
    if (!globalData) return;

    // 🔥 根據寵物類型檢查飼料
    const foodKey = pet.type === 'dog' ? 'dogFoodCount' : 'catFoodCount';
    const currentFoodCount = globalData[foodKey];

    if (currentFoodCount <= 0) {
      Alert.alert('飼料不足！');
      return;
    }

    const updated = {
      ...pet,
      hunger: Math.max(pet.hunger - 30, 0),
      happiness: Math.min(pet.happiness + 5, 100)
    };

    // 🔥 更新全局飼料計數
    const newGlobalData = {
      ...globalData,
      [foodKey]: currentFoodCount - 1
    };

    setPet(updated);
    await updatePet(pet.id, updated);
    await updateGlobalData(newGlobalData);
    setGlobalData(newGlobalData);
    addRewards(10);
  };

  // 🎮 玩耍（會增加飢餓）
  const playWithPet = async () => {
    if (pet.hunger >= 100) {
      Alert.alert('太餓了！先餵食吧');
      return;
    }

    const updated = {
      ...pet,
      hunger: Math.min(pet.hunger + 10, 100),
      happiness: Math.min(pet.happiness + 10, 100)
    };

    setPet(updated);
    await updatePet(pet.id, updated);
    addRewards(10);
  };

  if (!pet || !globalData) return <Text>Loading...</Text>;

  const maxExp = level * 100;
  const expPercent = (rewards / maxExp) * 100;

  // 🔥 根據寵物類型顯示對應的飼料計數
  const foodKey = pet.type === 'dog' ? 'dogFoodCount' : 'catFoodCount';
  const currentFoodCount = globalData[foodKey] || 0;
  const currentFoodImage = pet.type === 'dog' ? dogFoodImage : catFoodImage;
  const currentPetImage = pet.type === 'dog' ? dogPetImage : catPetImage;

  return (
    <View style={styles.container}>
      {/* 左上角狀態 */}
      <View style={styles.statusContainer}>
        <View style={styles.statusItem}>
          <View style={styles.levelRow}>
            <Text style={styles.statusLabel}>Lv.{level}</Text>
            <View style={styles.expBarBackground}>
              <View style={[styles.expBarFill, { width: `${expPercent}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.statusItem}>
          <View style={styles.row}>
            <Image 
              source={currentFoodImage}
              style={styles.icon}
            />
            <Text style={styles.statusLabel}>{currentFoodCount}</Text>
          </View>
        </View>

        <View style={styles.statusItem}>
          <View style={styles.row}>
            <Text style={styles.statusLabel}>💰 {globalData.money}</Text>
          </View>
        </View>

        <View style={styles.statusActions}>
          <Pressable 
            style={styles.switchButton} 
            onPress={() => setModalVisible(true)}
          >
            <Image 
              source={switchIcon}
              style={styles.switch_icon}
            />
          </Pressable>
        </View>
      </View>

      <Pressable 
        style={styles.shopButton} 
        onPress={() => router.push(`/shopscreen?id=${pet.id}`)}
      >
        <Image 
          source={shopIcon}
          style={styles.shop_icon}
        />
      </Pressable>

      {/* 寵物 */}
      <View style={styles.petContainer}>
        <Image source={currentPetImage} style={styles.petImage} />
        <Text style={styles.petName}>{pet.name}</Text>
      </View>

      {/* 底部 */}
      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          <View style={styles.actionRow}>
            <Pressable style={styles.actionButton} onPress={feedPet}>
              <Image 
                source={currentFoodImage}
                style={styles.switch_icon}
              />
            </Pressable>
            <Pressable style={styles.arrowButton} onPress={() => setFoodModalVisible(true)}>
              <Text style={styles.arrowText}>▶</Text>
            </Pressable>
          </View>

          <View style={styles.actionRow}>
            <Pressable style={[styles.actionButton, (toys.length === 0 || !toys.find(t => t.name === selectedToy)) && styles.disabledButton]} onPress={(toys.length > 0 && toys.find(t => t.name === selectedToy)) ? playWithPet : null} disabled={toys.length === 0 || !toys.find(t => t.name === selectedToy)}>
              <Image 
                source={toys.find(t => t.name === selectedToy)?.image || ballImage}
                style={styles.switch_icon}
              />
            </Pressable>
            <Pressable style={styles.arrowButton} onPress={() => setToyModalVisible(true)}>
              <Text style={styles.arrowText}>▶</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.statusLabel}>飢餓值: {pet.hunger}</Text>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>選擇要切換的寵物</Text>
            <FlatList
              data={allPets}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const foodKey = item.type === 'dog' ? 'dogFoodCount' : 'catFoodCount';
                const itemFoodCount = globalData[foodKey] || 0;
                return (
                  <Pressable
                    style={[
                      styles.petItem,
                      item.id === pet.id && styles.selectedPetItem,
                    ]}
                    onPress={() => handlePetSelect(item)}
                  >
                    <Text style={styles.petItemText}>{item.name}</Text>
                    <Text style={styles.petItemText}>飢餓 {item.hunger} / 食 {itemFoodCount}</Text>
                  </Pressable>
                );
              }}
              contentContainerStyle={styles.petList}
            />
            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>取消</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={foodModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>選擇食物</Text>
            <FlatList
              data={availableFoods}
              horizontal
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.foodItem,
                    selectedFood === item.name && styles.selectedFoodItem,
                  ]}
                  onPress={() => {
                    setSelectedFood(item.name);
                    setFoodModalVisible(false);
                  }}
                >
                  <Image source={item.image} style={styles.foodImage} />
                  <Text style={styles.foodName}>{item.name}</Text>
                </Pressable>
              )}
              contentContainerStyle={styles.foodListContent}
              showsHorizontalScrollIndicator={false}
            />
            <Pressable style={styles.closeButton} onPress={() => setFoodModalVisible(false)}>
              <Text style={styles.closeButtonText}>取消</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={toyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>選擇玩具</Text>
            {(() => {
              const compatibleToys = toys.filter(item => {
                return item.name === '球' || 
                  (item.name === '飛盤' && pet.type === 'dog') || 
                  (item.name === '毛線' && pet.type === 'cat');
              });
              return compatibleToys.length > 0 ? (
                <FlatList
                  data={compatibleToys}
                  horizontal
                  keyExtractor={(item) => item.name}
                  renderItem={({ item }) => (
                    <Pressable
                      style={[
                        styles.foodItem,
                        selectedToy === item.name && styles.selectedFoodItem,
                      ]}
                      onPress={() => {
                        setSelectedToy(item.name);
                        setToyModalVisible(false);
                      }}
                    >
                      <Image source={item.image} style={styles.foodImage} />
                      <Text style={styles.foodName}>{item.name}</Text>
                    </Pressable>
                  )}
                  contentContainerStyle={styles.foodListContent}
                  showsHorizontalScrollIndicator={false}
                />
              ) : (
                <View style={styles.noToysContainer}>
                  <Text style={styles.noToysText}>沒有適用的玩具</Text>
                  <Pressable style={styles.goToShopButton} onPress={() => { setToyModalVisible(false); router.push(`/shopscreen?id=${pet.id}`); }}>
                    <Text style={styles.goToShopText}>前往商店</Text>
                  </Pressable>
                </View>
              );
            })()}
            <Pressable style={styles.closeButton} onPress={() => setToyModalVisible(false)}>
              <Text style={styles.closeButtonText}>取消</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#D0E7EF',
    paddingTop: 10,
    flexDirection: 'column',
  },
  statusContainer: { 
    position: 'absolute', 
    top: 20, left: 20, 
    flexDirection: 'column', 
    gap: 15, 
    zIndex: 1, 
    paddingTop: 45 
  },
  statusItem: {
    backgroundColor: '#fcd5b0',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 240, // 🔥 比較穩定
    borderWidth: 2,
    borderColor: '#ffc38ad2',
  },
  statusLabel: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#333',
  },
  expBarFill: {
    height: '100%',
    backgroundColor: '#ffc38ad2',
    borderRadius: 10,
  },
  levelRow: {
    flexDirection: 'row', // 🔥 左右排
    alignItems: 'center',
    gap: 8,
  },
  expBarBackground: {
    width: 150,   // 🔥 固定寬度（不要用100%）
    height: 6,
    backgroundColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
  },
  expBarFill: {
    height: '100%',
    backgroundColor: '#ca823ed2',
  },
  row: {
    flexDirection: 'row', // 🔥 左右排
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  shop_icon: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  statusActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  switchButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  switch_icon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  shopButton: {
    padding: 8,
    borderRadius: 20,
    right: 10,
    top: 50,
    position: 'absolute',
    zIndex: 1,
  },
  petContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120, // 給狀態欄留空間
    paddingBottom: 120, // 給底部按鈕留空間
  },
  petImage: {
    width: 160,
    height: 160,
    borderRadius: 100,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  petName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
    backgroundColor: '#D0E7EF',
  },
  rewardsBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffd700',
  },
  rewardsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  rewardsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffd700',
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#ffc38ad2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowButton: {
    backgroundColor: '#ff9ff3',
    paddingHorizontal: 12,
    paddingVertical: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  foodListContent: {
    paddingHorizontal: 10,
    paddingVertical: 15,
    gap: 12,
  },
  foodItem: {
    width: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    minWidth: 120,
  },
  selectedFoodItem: {
    borderColor: '#6c5ce7',
    backgroundColor: '#dfe6e9',
  },
  foodImage: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  foodName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    backgroundColor: '#ffc38ad2',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  petList: {
    paddingBottom: 20,
  },
  petItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
  },
  selectedPetItem: {
    borderColor: '#6c5ce7',
    backgroundColor: '#dfe6e9',
  },
  petItemText: {
    fontSize: 16,
    color: '#333',
  },
  closeButton: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#d63031',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noToysContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noToysText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  goToShopButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  goToShopText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  incompatibleItem: {
    opacity: 0.5,
  },
  incompatibleImage: {
    opacity: 0.5,
  },
  incompatibleText: {
    color: '#999',
  },
});