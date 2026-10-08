/**
 * v0.30.0 (Noah 1a): the icon of each tile on Today and each row of the overview (#/features).
 * Tips name theirs in tips.js; the data cards by their key (know.js).
 */
import {
  Zap, Blocks, Copy, Route, House, CloudSun, Backpack, Printer, Navigation, StickyNote, Flag, MessageSquare, Sparkles, Gauge,
  TrendingDown, Scale, Star, Gift, Archive, Bike, Wrench, ClipboardList, Camera, Save, Smartphone, Languages, Play, Hash,
  HardDriveDownload, ListTodo, Inbox, Sun, CalendarDays, Lightbulb,
} from '@lucide/svelte';

export const TIP_ICON = {
  zap: Zap, blocks: Blocks, copy: Copy, route: Route, home: House, cloud: CloudSun, backpack: Backpack, printer: Printer,
  navigation: Navigation, note: StickyNote, flag: Flag, message: MessageSquare, sparkles: Sparkles, gauge: Gauge, trend: TrendingDown,
  scale: Scale, star: Star, gift: Gift, archive: Archive, bike: Bike, wrench: Wrench, clipboard: ClipboardList, camera: Camera,
  counter: Hash, save: Save, phone: Smartphone, languages: Languages, play: Play,
};

export const CARD_ICON = {
  backup: HardDriveDownload, demo: Play, todo: ListTodo, wear: Wrench, weather: CloudSun, inbox: Inbox, templates: Sparkles,
  weekend: Sun, home: House, season: CalendarDays, trend: TrendingDown, upgrade: Gift, unused: Archive, learnings: Lightbulb, pace: Gauge,
};
