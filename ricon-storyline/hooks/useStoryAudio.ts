"use client";

import { Howl } from "howler";
import { useCallback, useEffect, useRef, useState } from "react";

const MOCK_DURATION = 16;

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoaded: boolean;
  error: string | null;
}

export interface UseStoryAudioReturn extends AudioState {
  toggle: () => void;
  seek: (seconds: number) => void;
}

export function useStoryAudio(audioUrl: string | undefined): UseStoryAudioReturn {
  const soundRef = useRef<Howl | null>(null);
  const [state, setState] = useState<AudioState>({
    isPlaying: true,
    currentTime: 0,
    duration: MOCK_DURATION,
    isLoaded: !audioUrl,
    error: null,
  });
  const isMockMode = !audioUrl || state.error !== null;

  useEffect(() => {
    setState({
      isPlaying: true,
      currentTime: 0,
      duration: MOCK_DURATION,
      isLoaded: !audioUrl,
      error: null,
    });
  }, [audioUrl]);

  useEffect(() => {
    if (!audioUrl || state.error) {
      return;
    }

    const sound = new Howl({
      src: [audioUrl],
      html5: true,
      preload: true,
      onload: () => {
        setState((current) => ({
          ...current,
          duration: sound.duration() || MOCK_DURATION,
          isLoaded: true,
          error: null,
        }));

        sound.play();
      },
      onplay: () => {
        setState((current) => ({
          ...current,
          isPlaying: true,
        }));
      },
      onpause: () => {
        setState((current) => ({
          ...current,
          isPlaying: false,
        }));
      },
      onend: () => {
        setState((current) => ({
          ...current,
          currentTime: current.duration,
          isPlaying: false,
        }));
      },
      onloaderror: (_id, error) => {
        setState((current) => ({
          ...current,
          isPlaying: true,
          isLoaded: true,
          duration: MOCK_DURATION,
          error: String(error ?? "Audio failed to load"),
        }));
      },
      onplayerror: (_id, error) => {
        setState((current) => ({
          ...current,
          isPlaying: true,
          isLoaded: true,
          duration: MOCK_DURATION,
          error: String(error ?? "Audio failed to play"),
        }));
      },
    });

    soundRef.current = sound;

    return () => {
      sound.unload();
      soundRef.current = null;
    };
  }, [audioUrl, state.error]);

  useEffect(() => {
    if (!isMockMode || !state.isPlaying) {
      return;
    }

    const interval = setInterval(() => {
      setState((current) => {
        const nextTime = Math.min(current.duration, current.currentTime + 0.1);

        return {
          ...current,
          currentTime: nextTime,
          isPlaying: nextTime >= current.duration ? false : current.isPlaying,
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isMockMode, state.isPlaying]);

  useEffect(() => {
    if (isMockMode || !state.isPlaying) {
      return;
    }

    const interval = setInterval(() => {
      const sound = soundRef.current;

      if (!sound) {
        return;
      }

      const seekValue = sound.seek();
      const currentTime = typeof seekValue === "number" ? seekValue : 0;

      setState((current) => ({
        ...current,
        currentTime,
        duration: sound.duration() || current.duration,
      }));
    }, 250);

    return () => clearInterval(interval);
  }, [isMockMode, state.isPlaying]);

  const seek = useCallback(
    (seconds: number) => {
      const nextTime = Math.max(0, Math.min(state.duration, seconds));

      if (!isMockMode) {
        soundRef.current?.seek(nextTime);
      }

      setState((current) => ({
        ...current,
        currentTime: nextTime,
      }));
    },
    [isMockMode, state.duration],
  );

  const toggle = useCallback(() => {
    setState((current) => {
      if (isMockMode) {
        const shouldRestart =
          !current.isPlaying && current.currentTime >= current.duration;

        return {
          ...current,
          currentTime: shouldRestart ? 0 : current.currentTime,
          isPlaying: !current.isPlaying,
        };
      }

      const sound = soundRef.current;

      if (!sound) {
        return current;
      }

      if (current.isPlaying) {
        sound.pause();
      } else {
        if (current.currentTime >= current.duration) {
          sound.seek(0);
        }

        sound.play();
      }

      return {
        ...current,
        currentTime:
          !current.isPlaying && current.currentTime >= current.duration
            ? 0
            : current.currentTime,
        isPlaying: !current.isPlaying,
      };
    });
  }, [isMockMode]);

  return {
    ...state,
    isLoaded: isMockMode ? true : state.isLoaded,
    toggle,
    seek,
  };
}
