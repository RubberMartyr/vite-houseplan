import React from 'react'
import HouseViewer from './components/HouseViewer'

export default function App() {
  return (
    <>
      <div style={{
        position: "fixed",
        top: 10,
        left: 10,
        zIndex: 99999,
        padding: "10px 12px",
        background: "hotpink",
        color: "black",
        fontWeight: 800,
        borderRadius: 8
      }}>
        DEBUG APP ACTIVE {Date.now()}
      </div>

      <HouseViewer />
    </>
  )
}
