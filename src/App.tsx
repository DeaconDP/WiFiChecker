import { useEffect, useState } from 'react'
import { InstallPrompt, LatencyCard, StatusCard } from './components/Cards'
import { useConnectivity } from './hooks/useConnectivity'
import { useLatencyTest } from './hooks/useLatencyTest'
import './App.css'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function App() {
  const connectivity = useConnectivity()
  const latency = useLatencyTest()
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installDismissed, setInstallDismissed] = useState(false)

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    await installEvent.userChoice
    setInstallEvent(null)
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-icon" aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="40" r="4" fill="currentColor" />
            <path
              d="M16 28c8.837-8.837 23.163-8.837 32 0"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M8 20c12.15-12.15 31.85-12.15 44 0"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M24 36c4.418-4.418 11.582-4.418 16 0"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div>
          <p className="eyebrow">Cross-platform PWA</p>
          <h1>WiFiChecker</h1>
          <p className="subtitle">Network health at a glance — connectivity, latency, and reachability on any device.</p>
        </div>
      </header>

      <InstallPrompt
        visible={!!installEvent && !installDismissed}
        onInstall={handleInstall}
        onDismiss={() => setInstallDismissed(true)}
      />

      <main className="stack">
        <StatusCard connectivity={connectivity} />
        <LatencyCard
          running={latency.running}
          results={latency.results}
          lastRunAt={latency.lastRunAt}
          onRun={latency.runTest}
        />
      </main>

      <footer className="footer">
        <p>Works in the browser or as an installed app. Deploy and open the URL on any phone to test.</p>
      </footer>
    </div>
  )
}

export default App
