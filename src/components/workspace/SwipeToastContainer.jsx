import React from 'react'
import { useApp } from '../../context/AppContext'
import SwipeToast from '../react-bits/SwipeToast'

export default function SwipeToastContainer() {
  const { toasts, removeToast } = useApp()

  if (toasts.length === 0) return null

  return (
    <div className="fixed right-6 bottom-6 z-50 flex flex-col items-end gap-2.5 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <SwipeToast
            open={true}
            inline={true}
            title={toast.title}
            description={toast.description}
            actionLabel={toast.actionLabel}
            onAction={toast.onAction}
            duration={toast.duration || 3800}
            fuseColor={toast.fuseColor || '#c29aff'}
            background={toast.background || '#19122c'}
            color={toast.color || '#f4efff'}
            width={360}
            radius={12}
            closeButton={true}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  )
}
