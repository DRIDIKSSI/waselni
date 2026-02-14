import { useEffect } from 'react';
import axios from 'axios';

export const VisitorTracker = () => {
  useEffect(() => {
    const trackVisit = async () => {
      try {
        const API_URL = process.env.REACT_APP_BACKEND_URL;
        await axios.post(`${API_URL}/api/analytics/track`, {
          page: window.location.pathname,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          screen_width: window.screen.width,
          screen_height: window.screen.height,
          language: navigator.language
        });
      } catch (error) {
        // Silent fail - don't break the app if tracking fails
        console.debug('Visitor tracking failed:', error);
      }
    };

    trackVisit();
  }, []);

  return null; // This component doesn't render anything
};

export default VisitorTracker;
