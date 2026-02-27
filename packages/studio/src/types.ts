import type { Step, Walkthrough } from '@walkr/core'

export interface WalkthroughDef {
  url: string
  title?: string
  steps: Step[]
}

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'done'

export type PlaybackMode = 'stopped' | 'playing' | 'paused'

export interface SelectedStep {
  index: number
  step: Step
}

export interface StudioState {
  walkthrough: Walkthrough | null
  selectedStep: SelectedStep | null
  playheadTime: number      // ms from start
  mode: PlaybackMode
  loop: boolean
  // Legacy fields (kept for compatibility)
  currentStepIndex?: number
  totalDuration?: number
}
