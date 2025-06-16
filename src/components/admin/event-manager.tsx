'use client'

import { useState, useEffect, FormEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

interface Event {
  id?: number
  title: string
  description?: string | null
  event_date: string // Should be ISO string or YYYY-MM-DDTHH:mm
  created_at?: string
  // For class selection
  target_class_ids?: number[]
}

interface SchoolClass {
  id: number
  name: string
}

interface EventRecipient {
  class_id: number
}

interface EventWithRecipients {
  id: number
  title: string
  description?: string | null
  event_date: string
  created_at?: string
  event_recipients: EventRecipient[]
}

export default function EventManager() {
  const [events, setEvents] = useState<Event[]>([])
  const [allClasses, setAllClasses] = useState<SchoolClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<Partial<Event> | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formEventDate, setFormEventDate] = useState('') // Store as YYYY-MM-DDTHH:MM
  const [formSelectedClassIds, setFormSelectedClassIds] = useState<number[]>([])

  useEffect(() => {
    fetchEvents()
    fetchClasses()
  }, [])

  const fetchEvents = async () => {
    setLoading(true)
    setError(null)
    // Fetch events and their related target classes
    const { data, error: fetchError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        event_date,
        created_at,
        event_recipients ( class_id )
      `)
      .order('event_date', { ascending: false })

    if (fetchError) {
      setError(`Error fetching events: ${fetchError.message}`)
    } else if (data) {
      const formattedEvents = data.map((event: EventWithRecipients) => ({
        ...event,
        event_date: event.event_date ? new Date(event.event_date).toISOString().substring(0, 16) : '', // Format for datetime-local
        target_class_ids: event.event_recipients.map((er: EventRecipient) => er.class_id)
      }))
      setEvents(formattedEvents)
    }
    setLoading(false)
  }

  const fetchClasses = async () => {
    const { data, error: classError } = await supabase.from('classes').select('id, name').order('name');
    if (classError) {
      console.error("Error fetching classes:", classError.message);
      setError(prev => `${prev || ''} Error fetching classes: ${classError.message}`);
    } else if (data) {
      setAllClasses(data);
    }
  }


  const handleOpenDialog = (event: Partial<Event> | null = null) => {
    setCurrentEvent(event)
    if (event && event.id) {
      setFormTitle(event.title || '')
      setFormDescription(event.description || '')
      setFormEventDate(event.event_date ? new Date(event.event_date).toISOString().substring(0, 16) : '')
      setFormSelectedClassIds(event.target_class_ids || [])
    } else {
      setFormTitle('')
      setFormDescription('')
      setFormEventDate('')
      setFormSelectedClassIds([]) // Default to all (empty array means all) or none
    }
    setError(null)
    setMessage(null)
    setIsDialogOpen(true)
  }

  const handleClassSelection = (classId: number) => {
    setFormSelectedClassIds(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (formTitle === '' || formEventDate === '') {
      setError('Title and Event Date are required.')
      return
    }
    setLoading(true)
    setError(null)
    setMessage(null)

    const eventDataCore = {
      title: formTitle,
      description: formDescription || null,
      event_date: new Date(formEventDate).toISOString(), // Ensure it's a full ISO string for Supabase
    }

    let savedEventId: number | undefined = currentEvent?.id;

    try {
      if (currentEvent && currentEvent.id) { // Update existing event
        const { data: updatedEvent, error: saveError } = await supabase
          .from('events')
          .update(eventDataCore)
          .eq('id', currentEvent.id)
          .select('id')
          .single();
        if (saveError) throw new Error(`Error updating event core: ${saveError.message}`);
        if (!updatedEvent) throw new Error('Failed to update event or retrieve ID.');
        savedEventId = updatedEvent.id;

      } else { // Create new event
        const { data: newEvent, error: saveError } = await supabase
          .from('events')
          .insert(eventDataCore)
          .select('id')
          .single();
        if (saveError) throw new Error(`Error creating event core: ${saveError.message}`);
        if (!newEvent) throw new Error('Failed to create event or retrieve ID.');
        savedEventId = newEvent.id;
      }

      // Now handle event_recipients (target classes)
      if (savedEventId) {
          // First, remove existing recipients for this event to handle changes/deselections
          const { error: deleteRecipientsError } = await supabase
              .from('event_recipients')
              .delete()
              .eq('event_id', savedEventId);
          if (deleteRecipientsError) {
              throw new Error(`Error clearing old event recipients: ${deleteRecipientsError.message}`);
          }

          // If specific classes are selected, add them
          if (formSelectedClassIds.length > 0) {
              const recipientEntries = formSelectedClassIds.map(classId => ({
                  event_id: savedEventId!,
                  class_id: classId,
              }));
              const { error: addRecipientsError } = await supabase
                  .from('event_recipients')
                  .insert(recipientEntries);
              if (addRecipientsError) {
                  throw new Error(`Error adding new event recipients: ${addRecipientsError.message}`);
              }
          }
          // If formSelectedClassIds is empty, it implies "all parents" by not having entries in event_recipients.
      }

      setMessage(`Event "${eventDataCore.title}" ${currentEvent && currentEvent.id ? 'updated' : 'created'} successfully.`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred')
    } finally {
      setIsDialogOpen(false)
      fetchEvents() // Refresh the list
      setLoading(false)
    }
  }

  const handleDelete = async (eventId: number, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete the event "${eventTitle}"? This action cannot be undone.`)) {
        return;
    }
    setLoading(true); setError(null);
    try {
      // Must delete from event_recipients first due to foreign key constraints
      const { error: deleteRecipientsError } = await supabase.from('event_recipients').delete().eq('event_id', eventId);
      if (deleteRecipientsError) throw deleteRecipientsError;

      const { error: deleteEventError } = await supabase.from('events').delete().eq('id', eventId);
      if (deleteEventError) throw deleteEventError;

      setMessage(`Event "${eventTitle}" deleted successfully.`);
      fetchEvents(); // Refresh list
    } catch (e: unknown) {
       setError(`Error deleting event: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="md:col-span-2"> {/* Take full width if it's the main content for an /admin/events page, or adjust if part of dashboard */}
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Events</CardTitle>
          <CardDescription>Create, update, and delete school events.</CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()}>Add New Event</Button>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {message && <p className="text-green-500 mb-4">{message}</p>}
        {loading && events.length === 0 && <p>Loading events...</p>}
        {!loading && events.length === 0 && <p>No events created yet.</p>}

        {events.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Target Audience</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>{new Date(event.event_date || '').toLocaleString()}</TableCell>
                  <TableCell>
                    {event.target_class_ids && event.target_class_ids.length > 0
                      ? event.target_class_ids.map(id => allClasses.find(c => c.id === id)?.name || `ID ${id}`).join(', ')
                      : 'All Parents'}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(event)} className="mr-2">Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => event.id && handleDelete(event.id, event.title)} disabled={loading}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[625px]"> {/* Wider dialog for class list */}
            <DialogHeader>
              <DialogTitle>{currentEvent?.id ? 'Edit Event' : 'Add New Event'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid items-center gap-1.5">
                  <Label htmlFor="title">Event Title</Label>
                  <Input id="title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required />
                </div>
                <div className="grid items-center gap-1.5">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea id="description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
                </div>
                <div className="grid items-center gap-1.5">
                  <Label htmlFor="event_date">Event Date and Time</Label>
                  <Input id="event_date" type="datetime-local" value={formEventDate} onChange={(e) => setFormEventDate(e.target.value)} required />
                </div>

                <div className="grid items-center gap-1.5">
                  <Label>Target Audience (select classes if not for all parents)</Label>
                  <Card className="max-h-48 overflow-y-auto p-2 border"> {/* Scrollable class list */}
                    {allClasses.length === 0 && <p className="text-sm text-muted-foreground">No classes found or loading...</p>}
                    {allClasses.map(cls => (
                      <div key={cls.id} className="flex items-center space-x-2 my-1 p-1 hover:bg-muted rounded">
                        <Checkbox
                          id={`class-${cls.id}`}
                          checked={formSelectedClassIds.includes(cls.id)}
                          onCheckedChange={() => handleClassSelection(cls.id)}
                        />
                        <Label htmlFor={`class-${cls.id}`} className="font-normal cursor-pointer">{cls.name}</Label>
                      </div>
                    ))}
                  </Card>
                  <p className="text-xs text-muted-foreground">If no classes are selected, the event will be for all parents.</p>
                </div>
              </div>
               {error && <p className="text-red-500 mb-2 text-sm px-1">{error}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Event'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
