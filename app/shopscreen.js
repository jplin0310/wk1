import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ScrollView, Image, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { getPets, updatePet, getGlobalData, updateGlobalData } from '../utils/storage';

// 靜態資源定義
const catFoodImage = require('./assets/food/cat_food.png');
const dogFoodImage = require('./assets/food/dog_food.png');
const ballImage = require('./assets/game/ball.png');
const frisbeeImage = require('./assets/game/frisbee.png');
const yarnImage = require('./assets/game/yarn.png');

export default function ShopScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [pet, setPet] = useState(null);
  const [globalData, setGlobalData] = useState(null);

  const items = [
    { id: 1, name: '貓飼料', price: 15, category: 'food', image: catFoodImage, foodType: 'cat' },
    { id: 2, name: '狗飼料', price: 15, category: 'food', image: dogFoodImage, foodType: 'dog' },
    { id: 3, name: '球', price: 800, category: 'toy', image: ballImage, compatibleTypes: ['cat', 'dog'] },
    { id: 4, name: '飛盤', price: 550, category: 'toy', image: frisbeeImage, compatibleTypes: ['dog'] },
    { id: 5, name: '毛線', price: 550, category: 'toy', image: yarnImage, compatibleTypes: ['cat'] },
  ];

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const gData = await getGlobalData();
        console.log('最新 toys:', gData.toys); // 👈 debug
        setToys(gData.toys || []);
      };
      load();
    }, [])
  );

  const buyItem = async (item) => {
    if (globalData.money < item.price) {
      Alert.alert('錢不夠');
      return;
    }

    if (item.category === 'food') {
      // 更新全局金錢和食物計數
      const foodKey = item.foodType === 'cat' ? 'catFoodCount' : 'dogFoodCount';
      const newGlobalData = {
        ...globalData,
        money: globalData.money - item.price,
        [foodKey]: globalData[foodKey] + 1
      };

      await updateGlobalData(newGlobalData);
      setGlobalData(newGlobalData);
      Alert.alert('購買成功');
    } else if (item.category === 'toy') {
      // 更新全局金錢和玩具列表
      const newGlobalData = {
        ...globalData,
        money: globalData.money - item.price,
        toys: [...(globalData.toys || []), { name: item.name.trim(), image: item.image }]
      };

      await updateGlobalData(newGlobalData);
      setGlobalData(newGlobalData);
      Alert.alert('購買成功');
    }
  };

  const earnMoney = async () => {
    const newGlobalData = {
      ...globalData,
      money: globalData.money + 10
    };

    await updateGlobalData(newGlobalData);
    setGlobalData(newGlobalData);
  };

  if (!pet || !globalData) return null;

  const foodItems = items.filter(item => item.category === 'food');
  const toyItems = items.filter(item => item.category === 'toy');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>商店</Text>
        <Text style={styles.money}>💰 {globalData.money}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>食物 🍖</Text>
        <FlatList
          horizontal
          scrollEnabled
          data={foodItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Pressable style={styles.itemCard} onPress={() => buyItem(item)}>
              <Image source={item.image} style={styles.itemImage} />
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={[styles.itemPrice, { color: globalData.money >= item.price ? 'black' : '#ff6b6b' }]}>{item.price}$</Text>
            </Pressable>
          )}
          contentContainerStyle={styles.listContent}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>玩具 🎮</Text>
        <FlatList
          horizontal
          scrollEnabled
          data={toyItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const isPurchased = globalData.toys && globalData.toys.some(t => t.name === item.name);
            return (
              <Pressable 
                style={[styles.itemCard, isPurchased && styles.purchasedCard]} 
                onPress={isPurchased ? null : () => buyItem(item)}
                disabled={isPurchased}
              >
                <Image source={item.image} style={[styles.itemImage, isPurchased && styles.purchasedImage]} />
                <Text style={[styles.itemName, isPurchased && styles.purchasedText]}>{isPurchased ? '已購買' : item.name}</Text>
                <Text style={[styles.itemPrice, { color: globalData.money >= item.price ? 'black' : '#ff6b6b' }]}>{item.price}$</Text>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.listContent}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <View style={styles.actionContainer}>
        <Pressable style={styles.earnButton} onPress={earnMoney}>
          <Text style={styles.earnText}>賺錢</Text>
        </Pressable>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>返回</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  money: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  itemCard: {
    width: 120,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  itemImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 10,
  },
  earnButton: {
    padding: 15,
    backgroundColor: '#f39c12',
    borderRadius: 10,
    alignItems: 'center',
  },
  earnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    padding: 15,
    backgroundColor: '#3498db',
    borderRadius: 10,
    alignItems: 'center',
  },
  backText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  purchasedCard: {
    opacity: 0.5,
  },
  purchasedImage: {
    opacity: 0.5,
  },
  purchasedText: {
    color: '#666',
  },
});