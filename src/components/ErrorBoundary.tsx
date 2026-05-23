import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('MusicTube render error', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center">
          <svg className="w-14 h-14 text-text-tertiary" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-text-primary font-semibold text-lg">Something went wrong</p>
            <p className="text-text-secondary text-sm mt-1">{this.state.error.message}</p>
            {import.meta.env.DEV && this.state.error.stack && (
              <pre className="mt-4 max-w-[90vw] overflow-auto text-left text-[10px] text-text-tertiary">
                {this.state.error.stack}
              </pre>
            )}
          </div>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload() }}
            className="px-6 py-3 rounded-full bg-accent text-white font-semibold text-sm"
          >
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
