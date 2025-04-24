import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/translation';
import { translateBatch } from '@/lib/translation-server';
import { getCachedTranslation, setCachedTranslation } from '@/lib/translations-cache';
import { usePathname } from 'next/navigation';

export function withPageTranslation<P extends { [key: string]: string }>(
  WrappedComponent: React.ComponentType<P>,
  defaultContent: P
) {
  return function TranslatedPage(props: Omit<P, keyof typeof defaultContent>) {
    const pathname = usePathname();
    const { currentLanguage } = useTranslation();
    const [content, setContent] = useState(defaultContent);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      async function loadTranslations() {
        if (currentLanguage === 'EN') {
          setContent(defaultContent);
          setIsLoading(false);
          return;
        }

        try {
          // Try to get cached translation
          const cached = await getCachedTranslation(pathname, currentLanguage);
          if (cached) {
            setContent(cached as P);
            setIsLoading(false);
            return;
          }

          // Translate content if not cached
          const keys = Object.keys(defaultContent);
          const texts = Object.values(defaultContent);
          
          const translations = await translateBatch({
            texts,
            from: 'EN',
            to: currentLanguage
          });

          const translatedContent = Object.fromEntries(
            keys.map((key, index) => [key, translations[index]])
          ) as P;

          // Cache the translated content
          await setCachedTranslation(pathname, currentLanguage, translatedContent);
          
          setContent(translatedContent);
        } catch (error) {
          console.error('Translation error:', error);
          setContent(defaultContent); // Fallback to default content
        }
        
        setIsLoading(false);
      }

      loadTranslations();
    }, [currentLanguage, pathname]);

    if (isLoading) {
      return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
    }

    return <WrappedComponent {...props as P} {...content} />;
  };
}