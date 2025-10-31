/**
 * Web Vitals Performance Tracking
 * Monitors Core Web Vitals metrics and logs them for analysis
 */
import {onCLS, onINP, onLCP, onFCP, onTTFB, type Metric} from 'web-vitals';

/**
 * Sends metric data to analytics endpoint
 * In production, replace console.log with actual analytics service (e.g., Google Analytics, Plausible)
 */
function sendToAnalytics(metric: Metric) {
  // Log to console in development
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
    });
  }

  // TODO: Send to analytics service in production
  // Example for Google Analytics:
  // gtag('event', metric.name, {
  //   value: Math.round(metric.value),
  //   metric_id: metric.id,
  //   metric_value: metric.value,
  //   metric_delta: metric.delta,
  // });
}

/**
 * Initialize Web Vitals tracking
 * Call this function once when the app loads (client-side only)
 */
export function initWebVitals() {
  // Only run on client-side
  if (typeof window === 'undefined') return;

  // Track Core Web Vitals
  onCLS(sendToAnalytics); // Cumulative Layout Shift
  onINP(sendToAnalytics); // Interaction to Next Paint (replaces FID)
  onLCP(sendToAnalytics); // Largest Contentful Paint
  onFCP(sendToAnalytics); // First Contentful Paint
  onTTFB(sendToAnalytics); // Time to First Byte
}

/**
 * Helper to get performance metrics summary
 * Useful for debugging and monitoring
 */
export function getPerformanceSummary() {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

  return {
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    ttfb: navigation.responseStart - navigation.requestStart,
    download: navigation.responseEnd - navigation.responseStart,
    domInteractive: navigation.domInteractive - navigation.fetchStart,
    domComplete: navigation.domComplete - navigation.fetchStart,
    loadComplete: navigation.loadEventEnd - navigation.fetchStart,
  };
}
