import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useScreenWakeLock } from './useScreenWakeLock';

interface FakeSentinel extends WakeLockSentinel {
  released: boolean;
}

function createSentinel(): FakeSentinel {
  const target = new EventTarget() as FakeSentinel;
  Object.defineProperty(target, 'released', { value: false, writable: true });
  Object.defineProperty(target, 'type', { value: 'screen' });
  Object.defineProperty(target, 'release', {
    value: vi.fn(async () => {
      target.released = true;
      target.dispatchEvent(new Event('release'));
    }),
  });
  return target;
}

let request: ReturnType<typeof vi.fn>;
let visibilityState: DocumentVisibilityState;

function setVisibility(next: DocumentVisibilityState): void {
  visibilityState = next;
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  visibilityState = 'visible';
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(
    () => visibilityState,
  );
  request = vi.fn(async () => createSentinel());
  Object.defineProperty(navigator, 'wakeLock', {
    value: { request },
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'wakeLock');
});

describe('useScreenWakeLock', () => {
  it('acquires a screen lock while enabled', async () => {
    renderHook(() => useScreenWakeLock(true));
    await vi.waitFor(() => expect(request).toHaveBeenCalledWith('screen'));
  });

  it('does nothing while disabled', async () => {
    renderHook(() => useScreenWakeLock(false));
    await Promise.resolve();
    expect(request).not.toHaveBeenCalled();
  });

  it('releases the lock on unmount', async () => {
    const { unmount } = renderHook(() => useScreenWakeLock(true));
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1));

    const sentinel = await request.mock.results[0]!.value;
    unmount();

    expect(sentinel.release).toHaveBeenCalledTimes(1);
  });

  it('re-acquires the lock when the page becomes visible again', async () => {
    renderHook(() => useScreenWakeLock(true));
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1));

    const sentinel = await request.mock.results[0]!.value;
    // The platform drops the lock while hidden.
    await sentinel.release();
    setVisibility('hidden');
    setVisibility('visible');

    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  });

  it('survives a denied request', async () => {
    request.mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
    const { unmount } = renderHook(() => useScreenWakeLock(true));
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect(() => unmount()).not.toThrow();
  });
});
