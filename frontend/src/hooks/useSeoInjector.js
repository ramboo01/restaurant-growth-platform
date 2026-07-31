import { useEffect } from 'react';
import api from '../services/api.js';

export function useSeoInjector(restaurantId = 1) {
  useEffect(() => {
    let isMounted = true;

    async function applySeo() {
      try {
        const response = await api.get('/api/public/seo', {
          params: { restaurantId }
        });
        const seo = response.data?.data;

        if (!isMounted || !seo) return;

        // 1. Meta Title
        if (seo.metaTitle) {
          document.title = seo.metaTitle;
        }

        // 2. Meta Description
        if (seo.metaDescription) {
          let descMeta = document.querySelector('meta[name="description"]');
          if (!descMeta) {
            descMeta = document.createElement('meta');
            descMeta.setAttribute('name', 'description');
            document.head.appendChild(descMeta);
          }
          descMeta.setAttribute('content', seo.metaDescription);
        }

        // 3. Meta Keywords
        if (seo.metaKeywords) {
          let keyMeta = document.querySelector('meta[name="keywords"]');
          if (!keyMeta) {
            keyMeta = document.createElement('meta');
            keyMeta.setAttribute('name', 'keywords');
            document.head.appendChild(keyMeta);
          }
          keyMeta.setAttribute('content', seo.metaKeywords);
        }

        // 4. Google Rich Snippet (Structured Data JSON-LD)
        if (seo.structuredDataJson && seo.structuredDataJson !== '{}') {
          let jsonLdScript = document.getElementById('dynamic-json-ld');
          if (!jsonLdScript) {
            jsonLdScript = document.createElement('script');
            jsonLdScript.id = 'dynamic-json-ld';
            jsonLdScript.type = 'application/ld+json';
            document.head.appendChild(jsonLdScript);
          }
          jsonLdScript.textContent = typeof seo.structuredDataJson === 'string' 
            ? seo.structuredDataJson 
            : JSON.stringify(seo.structuredDataJson);
        }
      } catch (err) {
        console.error('Failed to inject public SEO metadata:', err);
      }
    }

    applySeo();

    return () => {
      isMounted = false;
    };
  }, [restaurantId]);
}

export default useSeoInjector;
