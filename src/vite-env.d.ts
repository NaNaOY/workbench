/// <reference types="vite/client" />

type DesktopCognitionMode = 'current' | 'growth' | 'overseas';
type DesktopCognitionCategory = 'digest' | 'politics' | 'thinking' | 'psychology' | 'law' | 'economy' | 'business' | 'technology' | 'medicine' | 'energy';
type DesktopRankingCategory = 'projects' | 'skills';
type DesktopRankingPeriod = 'all' | 'week';

type DesktopCognitionItem = {
  id: string;
  title: string;
  url: string;
  summary: string;
  source: string;
  publishedAt: string;
  category: DesktopCognitionCategory;
  categoryLabel: string;
};

type DesktopCognitionResponse = {
  items: DesktopCognitionItem[];
  fetchedAt: string;
  category: DesktopCognitionCategory;
  mode: DesktopCognitionMode;
};

type DesktopRankingRepository = {
  id: number;
  name: string;
  url: string;
  description: string;
  stars: number;
  forks: number;
  language: string | null;
  avatar: string;
  updatedAt: string;
  topics: string[];
};

type DesktopRankingResponse = {
  repositories: DesktopRankingRepository[];
  fetchedAt: string;
  scope: string;
};

type DesktopApi = {
  isDesktop: boolean;
  platform: string;
  persistStorage: () => void;
  getStoragePath: () => Promise<string>;
  getDailyContent: (
    category?: DesktopCognitionCategory,
    mode?: DesktopCognitionMode,
    force?: boolean,
  ) => Promise<DesktopCognitionResponse>;
  onDailyUpdated: (listener: () => void) => () => void;
  getGitHubRanking: (request: {
    category: DesktopRankingCategory;
    period: DesktopRankingPeriod;
  }) => Promise<DesktopRankingResponse>;
  getFuturesMarket: (selectedKey?: string) => Promise<unknown>;
  openExternal: (url: string, allowInternationalSources?: boolean) => Promise<boolean>;
  notify: (title: string, body: string) => void;
};

interface Window {
  desktop?: DesktopApi;
}