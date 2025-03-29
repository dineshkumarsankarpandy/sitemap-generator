import { createContext, useContext } from 'react';

export interface SitemapContextProps {
  getNextPageNumber: () => number;
  setPageCount: (count: number) => void;
  setLayoutRefreshKey: React.Dispatch<React.SetStateAction<number>>;
}

export const SitemapContext = createContext<SitemapContextProps | undefined>(undefined);

const useSitemapFunctions = (): SitemapContextProps => {
  const context = useContext(SitemapContext);
  if (!context) {
    throw new Error('useSitemapFunctions must be used within a SitemapContext.Provider');
  }
  return context;
};

export default useSitemapFunctions;
