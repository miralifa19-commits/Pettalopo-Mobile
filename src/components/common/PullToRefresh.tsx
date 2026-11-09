import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  enabled: boolean;
  scrollElement: HTMLElement | null;
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const REFRESH_THRESHOLD = 70;
const MAX_PULL_DISTANCE = 112;

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  enabled,
  scrollElement,
  onRefresh,
  children
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const startPoint = useRef<{ x: number; y: number; scrollTarget: HTMLElement } | null>(null);
  const currentPull = useRef(0);
  const refreshingRef = useRef(false);
  const animationFrame = useRef<number | null>(null);
  const errorTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !scrollElement) {
      startPoint.current = null;
      currentPull.current = 0;
      setPullDistance(0);
      return;
    }

    const updatePull = (value: number) => {
      currentPull.current = value;
      if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
      animationFrame.current = requestAnimationFrame(() => {
        setPullDistance(value);
        animationFrame.current = null;
      });
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (refreshingRef.current || scrollElement.scrollTop > 0 || event.touches.length !== 1) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('button, a, input, textarea, select, [contenteditable="true"], [role="button"], .fixed')) return;

      let scrollTarget = scrollElement;
      let ancestor = target?.parentElement || null;
      while (ancestor && ancestor !== scrollElement) {
        const overflowY = window.getComputedStyle(ancestor).overflowY;
        if ((overflowY === 'auto' || overflowY === 'scroll') && ancestor.scrollHeight > ancestor.clientHeight) {
          scrollTarget = ancestor;
          break;
        }
        ancestor = ancestor.parentElement;
      }
      if (scrollTarget.scrollTop > 0) return;

      const touch = event.touches[0];
      startPoint.current = { x: touch.clientX, y: touch.clientY, scrollTarget };
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!startPoint.current || refreshingRef.current || event.touches.length !== 1) return;
      if (scrollElement.scrollTop > 0 || startPoint.current.scrollTarget.scrollTop > 0) {
        startPoint.current = null;
        updatePull(0);
        return;
      }
      const touch = event.touches[0];
      const deltaY = touch.clientY - startPoint.current.y;
      const deltaX = Math.abs(touch.clientX - startPoint.current.x);
      if (deltaY <= 0 || deltaX > deltaY) {
        if (deltaY < 0) {
          startPoint.current = null;
          updatePull(0);
        }
        return;
      }
      if (event.cancelable) event.preventDefault();
      const resistedDistance = Math.min(MAX_PULL_DISTANCE, deltaY * 0.52);
      updatePull(resistedDistance);
    };

    const finishPull = async () => {
      startPoint.current = null;
      if (currentPull.current < REFRESH_THRESHOLD * 0.52 || refreshingRef.current) {
        updatePull(0);
        return;
      }

      refreshingRef.current = true;
      setIsRefreshing(true);
      setHasError(false);
      updatePull(58);
      try {
        await onRefresh();
      } catch (error) {
        console.warn('Pull-to-refresh failed:', error);
        setHasError(true);
        if (errorTimeout.current) clearTimeout(errorTimeout.current);
        errorTimeout.current = setTimeout(() => setHasError(false), 2600);
      } finally {
        refreshingRef.current = false;
        setIsRefreshing(false);
        updatePull(0);
      }
    };

    const handleTouchEnd = () => {
      if (startPoint.current) void finishPull();
    };
    const handleTouchCancel = () => {
      startPoint.current = null;
      if (!refreshingRef.current) updatePull(0);
    };

    scrollElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    scrollElement.addEventListener('touchend', handleTouchEnd, { passive: true });
    scrollElement.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      scrollElement.removeEventListener('touchstart', handleTouchStart);
      scrollElement.removeEventListener('touchmove', handleTouchMove);
      scrollElement.removeEventListener('touchend', handleTouchEnd);
      scrollElement.removeEventListener('touchcancel', handleTouchCancel);
      if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
    };
  }, [enabled, scrollElement, onRefresh]);

  useEffect(() => () => {
    if (errorTimeout.current) clearTimeout(errorTimeout.current);
    if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
  }, []);

  const isReady = pullDistance >= REFRESH_THRESHOLD * 0.52;

  return (
    <div className="pull-refresh-root">
      <div
        className={`pull-refresh-indicator ${isRefreshing ? 'is-refreshing' : ''} ${hasError ? 'has-error' : ''}`}
        style={{ transform: `translate(-50%, ${hasError ? 8 : Math.max(0, pullDistance - 46)}px)`, opacity: pullDistance > 0 || isRefreshing || hasError ? 1 : 0 }}
        role="status"
        aria-live="polite"
      >
        <span className="pull-refresh-icon">
          <RefreshCw size={17} strokeWidth={2.4} />
        </span>
        <span>{hasError ? 'Gagal memuat, periksa koneksi' : isRefreshing ? 'Memuat...' : isReady ? 'Lepas untuk menyegarkan' : 'Tarik untuk menyegarkan'}</span>
      </div>
      <div
        className="pull-refresh-content"
        style={{ transform: `translate3d(0, ${pullDistance}px, 0)`, transition: pullDistance === 0 ? 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none' }}
      >
        {children}
      </div>
    </div>
  );
};
