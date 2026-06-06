/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TrackerState, TimetableEvent, StudyDeadline } from '../types';

export interface AlertLogItem {
  id: string;
  time: string; // HH:MM:SS
  type: 'timetable' | 'deadline' | 'test';
  title: string;
  message: string;
}

// Track alerted items in sessionStorage to prevent spamming within a single app session
const ALERTED_SESSION_KEY = 'daily_tracker_notified_event_ids';

function getAlertedIds(): string[] {
  try {
    const raw = sessionStorage.getItem(ALERTED_SESSION_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markAsAlerted(id: string) {
  try {
    const ids = getAlertedIds();
    if (!ids.includes(id)) {
      ids.push(id);
      sessionStorage.setItem(ALERTED_SESSION_KEY, JSON.stringify(ids));
    }
  } catch (e) {
    console.error(e);
  }
}

/**
 * Request permission from the browser to show native desktop/phone notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications.');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'default';
  }
}

/**
 * Returns current permission status safely
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

/**
 * Fires a native push alert with fallback console logging
 */
export function triggerNativeNotification(title: string, body: string, iconUrl?: string): boolean {
  console.log(`[ALERT] Fired: ${title} - ${body}`);
  
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    try {
      const options: NotificationOptions = {
        body,
        icon: iconUrl || '/assets/favicon.ico' || 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=48&h=48&fit=crop',
        badge: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=48&h=48&fit=crop',
        tag: 'daily-life-tracker-reminder',
        requireInteraction: false
      };
      
      const n = new Notification(title, options);
      
      // Play a quick, clean browser audio ping if possible
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.35);
      } catch (audioErr) {
        // Audio context may be blocked by user activation, which is fine
      }

      n.onclick = () => {
        window.focus();
        n.close();
      };
      
      return true;
    } catch (e) {
      console.error('Error creating notification object', e);
    }
  }
  return false;
}

/**
 * System ticker that triggers reminder alerts based on dates and advance timing preferences.
 * Returns a list of new alert items to add to the application history state.
 */
export function checkTrackerReminders(
  state: TrackerState,
  minutesAhead: number = 10
): AlertLogItem[] {
  const alertedIds = getAlertedIds();
  const alertLogs: AlertLogItem[] = [];

  const now = new Date();
  
  // Format current local date string (YYYY-MM-DD)
  const localYear = now.getFullYear();
  const localMonth = String(now.getMonth() + 1).padStart(2, '0');
  const localDay = String(now.getDate()).padStart(2, '0');
  const todayStr = `${localYear}-${localMonth}-${localDay}`;
  
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const curMinutesSinceMidnight = currentHours * 60 + currentMinutes;

  // 1. Check Timetable Events for TODAY
  const todayEvents = state.timetable.filter(e => e.date === todayStr && !e.completed);
  
  todayEvents.forEach(evt => {
    const [startH, startM] = evt.startTime.split(':').map(Number);
    if (!isNaN(startH) && !isNaN(startM)) {
      const eventStartMinutes = startH * 60 + startM;
      const difference = eventStartMinutes - curMinutesSinceMidnight;
      
      // Trigger if starting between 0 and minutesAhead minutes from now, 
      // and hasn't been notified yet this session.
      if (difference >= 0 && difference <= minutesAhead) {
        const uniqueKey = `evt-${evt.id}-${evt.startTime}`;
        if (!alertedIds.includes(uniqueKey)) {
          markAsAlerted(uniqueKey);
          
          const timeLabel = difference === 0 ? 'Starting Now!' : `Starting in ${difference} min`;
          const title = `🎓 Academic Hub Alert`;
          const body = `"${evt.title}" block ${timeLabel} (${evt.startTime}). Get ready!`;
          
          triggerNativeNotification(title, body);
          
          alertLogs.push({
            id: `alert-log-${Date.now()}-${evt.id}`,
            time: now.toLocaleTimeString(),
            type: 'timetable',
            title: evt.title,
            message: `Event starting in ${difference} minutes (${evt.startTime})`
          });
        }
      }
    }
  });

  // 2. Check Upcoming Critical Deadlines for TODAY or TOMORROW
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomYear = tomorrow.getFullYear();
  const tomMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const tomDay = String(tomorrow.getDate()).padStart(2, '0');
  const tomorrowStr = `${tomYear}-${tomMonth}-${tomDay}`;

  const remainingDeadlines = state.deadlines.filter(d => !d.completed);

  remainingDeadlines.forEach(dl => {
    const isDueToday = dl.dueDate === todayStr;
    const isDueTomorrow = dl.dueDate === tomorrowStr;

    if (isDueToday || isDueTomorrow) {
      const uniqueKey = `dl-${dl.id}-${dl.dueDate}`;
      if (!alertedIds.includes(uniqueKey)) {
        // Trigger deadline alerts once a day (we check if we haven't alerted)
        markAsAlerted(uniqueKey);

        const dueText = isDueToday ? 'DUE TODAY!' : 'Due Tomorrow!';
        const title = `🚨 Milestone Deadline Alert`;
        const body = `"${dl.title}" is ${dueText} (Respective Subject / Track). Stay focused!`;
        
        triggerNativeNotification(title, body);

        alertLogs.push({
          id: `alert-log-${Date.now()}-${dl.id}`,
          time: now.toLocaleTimeString(),
          type: 'deadline',
          title: dl.title,
          message: `Incomplete assignment milestone is ${dueText.toLowerCase()}`
        });
      }
    }
  });

  return alertLogs;
}
