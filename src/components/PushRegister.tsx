'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Base64 to Uint8Array utility for VAPID key conversion
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    async function registerAndSubscribe() {
      try {
        // 1. Service Worker Kaydı
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // 2. Çerez onayı verilmiş mi kontrol et
        const consent = localStorage.getItem('quantum_cookie_consent');
        if (consent !== 'all') {
          // İzin verilene kadar bekle
          window.addEventListener('quantum_consent_granted', () => {
            requestNotificationPermission(registration);
          });
          return;
        }

        await requestNotificationPermission(registration);
      } catch (err) {
        console.error("Service Worker/Push registration failed:", err);
      }
    }

    async function requestNotificationPermission(registration: ServiceWorkerRegistration) {
      if (Notification.permission === 'denied') {
        return;
      }

      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
      }

      // 3. Push Aboneliği Al (Sıfır Maliyetli VAPID Anahtarı)
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BEl62Obbpt7ZST3Qdxadx398vR_WW1t02N44w06Qx4_w05Qx4_w06Qx4_w05Qx4_w06Qx4_w05Qx4_w06Qx4_w";
      
      try {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        // 4. Supabase'e Kaydet (Sıfır Maliyetli API Ucu veya Doğrudan JS Client)
        await supabase
          .from('push_subscriptions')
          .insert([{ 
            subscription_json: JSON.parse(JSON.stringify(subscription)),
            created_at: new Date().toISOString()
          }]);

      } catch (err) {
        console.warn("Push subscription failed (probably local keys are empty):", err);
      }
    }

    registerAndSubscribe();
  }, []);

  return null; // Arayüzde yer kaplamaz, tamamen otonom arka plan servisidir.
}
