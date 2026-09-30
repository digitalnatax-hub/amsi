'use client'

import { useEffect, useState } from 'react'

function greetingForHour(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function useTimeGreeting() {
  const [greeting, setGreeting] = useState('Good morning')

  useEffect(() => {
    const updateGreeting = () => setGreeting(greetingForHour(new Date().getHours()))
    updateGreeting()
    const interval = window.setInterval(updateGreeting, 60_000)
    return () => window.clearInterval(interval)
  }, [])

  return greeting
}