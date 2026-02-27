import React from 'react'

interface PreviewPaneProps {
  url: string | null
  iframeRef: React.RefObject<HTMLIFrameElement>
}

export function PreviewPane({ url, iframeRef }: PreviewPaneProps) {
  return (
    <div style={{
      flex: 1,
      background: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
    }}>
      <div style={{
        height: 32,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 8,
        fontSize: 12,
        color: '#888',
        borderBottom: '1px solid #333',
        flexShrink: 0,
      }}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {url ?? 'No URL'}
        </span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#888', textDecoration: 'none', fontSize: 14 }}
            title="Open in browser"
          >
            &#8599;
          </a>
        )}
      </div>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        minHeight: 0,
      }}>
        {url ? (
          <iframe
            ref={iframeRef}
            src={url}
            style={{
              width: '100%',
              height: '100%',
              border: '1px solid #333',
              borderRadius: 4,
              background: '#fff',
              aspectRatio: '16 / 9',
              maxHeight: '100%',
            }}
            title="Walkthrough preview"
          />
        ) : (
          <div style={{
            color: '#555',
            fontSize: 14,
            textAlign: 'center',
          }}>
            No walkthrough loaded
          </div>
        )}
      </div>
    </div>
  )
}
