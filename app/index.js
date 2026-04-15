import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { resetAllData } from '../utils/storage';

export default function HomeScreen() {
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      // 臨時重置數據用於測試
      await resetAllData();
      
      const timer = setTimeout(() => {
        router.replace({ pathname: '/pet', params: { id: 1 } });
      }, 50);

      return () => clearTimeout(timer);
    };
    
    init();
  }, [router]);

  return null;
}
