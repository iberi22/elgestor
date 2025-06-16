'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card' // Assuming Card is available
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion" // For collapsible event details

interface EventDisplayItem {
  id: number
  title: string
  description?: string | null
  event_date: string
  // We might not need to show target classes to the parent, just relevant events.
}

export default function EventViewer() {
  const [upcomingEvents, setUpcomingEvents] = useState<EventDisplayItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initialize = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        setLoading(false)
        // setError("User not authenticated."); // Or let dashboard handle this
        return
      }
      fetchRelevantEvents(currentUser.id)
    }
    initialize()
  }, [])

  const fetchRelevantEvents = async (userId: string) => {
    setLoading(true)
    setError(null)

    try {
      // 1. Get the classes the parent's children are enrolled in.
      const { data: studentClassesData, error: studentClassesError } = await supabase
        .from('students')
        .select('class_id')
        .eq('parent_id', userId)

      if (studentClassesError) {
        throw new Error(`Error fetching student classes: ${studentClassesError.message}`)
      }
      const parentClassIds = studentClassesData?.map(s => s.class_id) || []

      // 2. Fetch all upcoming events
      const todayISO = new Date().toISOString()
      const { data: allUpcomingEvents, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          event_date,
          event_recipients ( class_id )
        `)
        .gte('event_date', todayISO) // Only future or today's events
        .order('event_date', { ascending: true })

      if (eventsError) {
        throw new Error(`Error fetching upcoming events: ${eventsError.message}`)
      }
      if (!allUpcomingEvents) {
        setUpcomingEvents([])
        setLoading(false)
        return
      }

      // 3. Filter events relevant to the parent
      const relevantEvents = allUpcomingEvents.filter((event: unknown) => {
        const isForAllParents = !event.event_recipients || event.event_recipients.length === 0
        if (isForAllParents) return true

        const targetedClassIds = event.event_recipients.map((er: unknown) => er.class_id)
        return targetedClassIds.some((targetClassId: number) => parentClassIds.includes(targetClassId))
      })
      .map((event: { id: number; title: string; event_date: string; description?: string; }) => ({ // Map to display format
        id: event.id,
        title: event.title,
        description: event.description,
        event_date: new Date(event.event_date).toLocaleString(), // Format for display
      }));

      setUpcomingEvents(relevantEvents)

    } catch (e: unknown) {
      console.error("Error fetching relevant events:", e)
      setError(e instanceof Error ? e.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p>Loading upcoming events...</p>
  if (error) return <p className="text-red-500">{error}</p>

  return (
    <Card>
      <CardHeader>        <CardTitle>Próximos Eventos</CardTitle>
        <CardDescription>Eventos relevantes para ti y tus hijos.</CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length === 0 && <p>No hay próximos eventos para ti en este momento.</p>}
        {upcomingEvents.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            {upcomingEvents.map(event => (
              <AccordionItem value={`event-${event.id}`} key={event.id}>
                <AccordionTrigger>
                  <div className="flex justify-between w-full pr-2">
                    <span>{event.title}</span>
                    <span className="text-sm text-muted-foreground">{event.event_date}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {event.description ? (
                    <p className="whitespace-pre-wrap">{event.description}</p>
                  ) : (
                    <p className="text-muted-foreground">No hay detalles adicionales.</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}
