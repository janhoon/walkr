import React, { useState, useRef, useCallback } from 'react'
import type { Step } from '@walkr/core'
import type { WalkthroughDef, PlaybackStatus } from './types'
import { PreviewPane } from './components/PreviewPane'
import { PlaybackControls } from './components/PlaybackControls'
import { Timeline } from './components/Timeline'
import { StepPanel } from './components/StepPanel'

const DEMO_WALKTHROUGH: WalkthroughDef = {
  url: 'https://example.com',
  title: 'Demo Walkthrough',
  steps: [
    { id: 'step_1', type: 'moveTo', duration: 600, options: { x: 200, y: 150, easing: 'ease' } },
    { id: 'step_2', type: 'click', duration: 200, options: { x: 200, y: 150, button: 'left', double: false } },
    { id: 'step_3', type: 'type', duration: 1200, options: { text: 'hello@example.com', delay: 80 } },
    { id: 'step_4', type: 'wait', duration: 500, options: { ms: 500 } },
    { id: 'step_5', type: 'moveTo', duration: 400, options: { x: 400, y: 300, easing: 'ease-out' } },
    { id: 'step_6', type: 'zoom', duration: 600, options: { level: 1.5, follow: true, easing: 'ease' } },
    { id: 'step_7', type: 'click', duration: 200, options: { x: 400, y: 300, button: 'left', double: false } },
    { id: 'step_8', type: 'zoom', duration: 400, options: { level: 1, follow: false, easing: 'ease' } },
  ],
}

export function App() {
  const [walkthrough, setWalkthrough] = useState<WalkthroughDef | null>(DEMO_WALKTHROUGH)
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null)
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('idle')
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [playheadTime, setPlayheadTime] = useState(0)
  const [loop, setLoop] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null!)

  const steps = walkthrough?.steps ?? []
  const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0)

  const handleLoadScript = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.ts'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const text = await file.text()
      try {
        const parsed = JSON.parse(text) as WalkthroughDef
        setWalkthrough(parsed)
        setSelectedStepIndex(null)
        setCurrentStepIndex(0)
        setPlayheadTime(0)
        setPlaybackStatus('idle')
      } catch {
        // ignore invalid JSON
      }
    }
    input.click()
  }, [])

  const handleStepUpdate = useCallback((stepIndex: number, updates: Partial<Step>) => {
    setWalkthrough((prev) => {
      if (!prev) return prev
      const newSteps = prev.steps.map((step, i) => {
        if (i !== stepIndex) return step
        return {
          ...step,
          ...updates,
          options: updates.options ? { ...step.options, ...updates.options } : step.options,
        }
      })
      return { ...prev, steps: newSteps }
    })
  }, [])

  const handleReorderStep = useCallback((fromIndex: number, toIndex: number) => {
    setWalkthrough((prev) => {
      if (!prev) return prev
      const newSteps = [...prev.steps]
      const [moved] = newSteps.splice(fromIndex, 1)
      newSteps.splice(toIndex, 0, moved)
      return { ...prev, steps: newSteps }
    })
  }, [])

  const handleSeek = useCallback((timeMs: number) => {
    const clamped = Math.max(0, Math.min(timeMs, totalDuration))
    setPlayheadTime(clamped)

    // Find which step this time falls within
    let accumulated = 0
    for (let i = 0; i < steps.length; i++) {
      accumulated += steps[i].duration
      if (clamped <= accumulated) {
        setCurrentStepIndex(i)
        return
      }
    }
    setCurrentStepIndex(Math.max(0, steps.length - 1))
  }, [steps, totalDuration])

  const handlePlay = useCallback(() => setPlaybackStatus('playing'), [])
  const handlePause = useCallback(() => setPlaybackStatus('paused'), [])

  const handleReset = useCallback(() => {
    setPlaybackStatus('idle')
    setCurrentStepIndex(0)
    setPlayheadTime(0)
  }, [])

  const handleStepBack = useCallback(() => {
    const newIndex = Math.max(0, currentStepIndex - 1)
    setCurrentStepIndex(newIndex)
    // Calculate playhead time for start of this step
    let time = 0
    for (let i = 0; i < newIndex; i++) {
      time += steps[i].duration
    }
    setPlayheadTime(time)
  }, [currentStepIndex, steps])

  const handleStepForward = useCallback(() => {
    const newIndex = Math.min(steps.length - 1, currentStepIndex + 1)
    setCurrentStepIndex(newIndex)
    let time = 0
    for (let i = 0; i < newIndex; i++) {
      time += steps[i].duration
    }
    setPlayheadTime(time)
  }, [currentStepIndex, steps])

  const handleUpdateDuration = useCallback((stepIndex: number, newDuration: number) => {
    handleStepUpdate(stepIndex, { duration: newDuration })
  }, [handleStepUpdate])

  const selectedStep = selectedStepIndex !== null ? steps[selectedStepIndex] ?? null : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <header
        style={{
          height: 48,
          background: '#0f0f0f',
          borderBottom: '1px solid #2a2a2a',
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: '0.05em' }}>
          Walkr Studio
        </span>

        {walkthrough && (
          <span style={{ fontSize: 12, color: '#888', marginLeft: 12 }}>
            {walkthrough.title ?? 'Untitled'} — {walkthrough.steps.length} steps
          </span>
        )}

        <div style={{ flex: 1 }} />

        <button onClick={handleLoadScript} style={headerBtnStyle}>
          Load Script
        </button>
        <button style={{ ...headerBtnStyle, marginLeft: 8 }}>
          Export ▾
        </button>
      </header>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Preview pane */}
        <PreviewPane url={walkthrough?.url ?? null} iframeRef={iframeRef} />

        {/* Step panel */}
        <StepPanel
          step={selectedStep}
          stepIndex={selectedStepIndex}
          onUpdate={handleStepUpdate}
        />
      </div>

      {/* Playback controls */}
      <PlaybackControls
        status={playbackStatus}
        currentStepIndex={currentStepIndex}
        totalSteps={steps.length}
        onPlay={handlePlay}
        onPause={handlePause}
        onStepBack={handleStepBack}
        onStepForward={handleStepForward}
        onReset={handleReset}
        onLoop={setLoop}
        loop={loop}
      />

      {/* Timeline */}
      <Timeline
        steps={steps}
        selectedStepIndex={selectedStepIndex}
        currentStepIndex={currentStepIndex}
        playheadTime={playheadTime}
        totalDuration={totalDuration}
        onSelectStep={setSelectedStepIndex}
        onSeek={handleSeek}
        onUpdateDuration={handleUpdateDuration}
        onReorderStep={handleReorderStep}
      />
    </div>
  )
}

const headerBtnStyle: React.CSSProperties = {
  background: '#222',
  border: '1px solid #333',
  color: '#ccc',
  borderRadius: 6,
  padding: '6px 12px',
  fontSize: 13,
  cursor: 'pointer',
}
