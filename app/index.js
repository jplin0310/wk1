import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace({ pathname: '/pet', params: { id: 1 } });
    }, 50);

    return () => clearTimeout(timer);
  }, [router]);

  return null;
}
