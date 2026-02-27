import type { Step } from '@walkr/core'

export interface WalkthroughDef {
  url: string
  title?: string
  steps: Step[]
}

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'done'

export interface StudioState {
  walkthrough: WalkthroughDef | null
  selectedStepIndex: number | null
  playheadTime: number      // ms from start
  playbackStatus: PlaybackStatus
  currentStepIndex: number
  totalDuration: number     // sum of all step durations
}
