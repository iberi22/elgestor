import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js' // Standard client for server-side routes

// --- Resend Placeholder (same as in Edge Function) ---
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@example.com'

async function sendEmail(to: string, subject: string, htmlBody: string) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set. Skipping actual email sending for cron reminder.");
    console.log(`Simulating cron email: TO=${to}, SUBJECT=${subject}, BODY=${htmlBody.substring(0,100)}...`);
    return { success: true, message: "Simulated cron email send." };
  }
  // Actual Resend API call (same as in Edge Function)
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject: subject, html: htmlBody }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Resend API Error: ${data.message || response.statusText}`);
    console.log('Cron reminder email sent successfully via Resend:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send cron reminder email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
// --- End Resend Placeholder ---

// Define reminder intervals (in days before the event)
const REMINDER_INTERVALS_DAYS = [21, 7, 1]; // e.g., 3 weeks, 1 week, 1 day before

export async function GET(req: NextRequest) {
  // --- Security Check ---
  // Protect this endpoint, e.g., with a secret key.
  // Vercel Cron Jobs can send a secret in the Authorization header.
  const cronSecret = req.headers.get('Authorization')?.split('Bearer ')[1];
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    console.warn('Unauthorized attempt to access cron job without or with invalid secret.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('Cron job send-event-reminders triggered.');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for cron jobs

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Supabase URL or Service Role Key not configured for cron job.");
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day for date comparisons

    let eventsFoundForReminders = 0;
    let emailsSuccessfullySent = 0;
    let emailSendingErrors = 0;

    for (const daysBefore of REMINDER_INTERVALS_DAYS) {
      const targetReminderDate = new Date(today);
      targetReminderDate.setDate(today.getDate() + daysBefore);
      const targetDateString = targetReminderDate.toISOString().split('T')[0]; // YYYY-MM-DD

      console.log(`Checking for events on ${targetDateString} (for ${daysBefore}-day reminder)`);

      // Fetch events scheduled for the targetReminderDate
      // Ensure event_date is stored as TIMESTAMPTZ or DATE and queried correctly.
      // This query assumes event_date is just a DATE. If it's TIMESTAMP, adjust query.
      const { data: events, error: eventsError } = await supabaseAdminClient
        .from('events')
        .select('id, title, description, event_date, event_recipients ( class_id )')
        // Assuming event_date is stored as a full timestamp, we need to cast it to date for comparison
        // or query a range. For simplicity, if event_date is just a date string 'YYYY-MM-DD':
        // .eq('event_date', targetDateString)
        // If event_date is a timestamp:
        .gte('event_date', `${targetDateString}T00:00:00.000Z`)
        .lt('event_date', `${targetDateString}T23:59:59.999Z`)


      if (eventsError) {
        console.error(`Error fetching events for ${daysBefore}-day reminder:`, eventsError);
        // Consider whether to stop or continue with other intervals
        continue;
      }

      if (!events || events.length === 0) {
        console.log(`No events found for ${daysBefore}-day reminder on ${targetDateString}.`);
        continue;
      }

      eventsFoundForReminders += events.length;
      console.log(`Found ${events.length} events for ${daysBefore}-day reminder.`);

      for (const event of events as unknown[]) { // Type assertion for simplicity with joined data
        let parentEmails: string[] = [];
        const isTargeted = event.event_recipients && event.event_recipients.length > 0;

        if (isTargeted) {
          const classIds = event.event_recipients.map((er: unknown) => er.class_id);
          const { data: parentsInClasses, error: parentsError } = await supabaseAdminClient
            .from('students')
            .select('profiles!inner ( email )') // !inner ensures student must have a profile
            .in('class_id', classIds)
            .not('profiles', 'is', null);
          if (parentsError) {
            console.error(`Error fetching parents for event ${event.id} (targeted):`, parentsError);
            continue; // Skip this event's reminders
          }
          parentEmails = parentsInClasses?.map((s: unknown) => s.profiles?.email).filter((email: string | null) => !!email) || [];
        } else {
          const { data: allParents, error: allParentsError } = await supabaseAdminClient
            .from('profiles')
            .select('email')
            .eq('role', 'parent');
          if (allParentsError) {
            console.error(`Error fetching all parents for event ${event.id}:`, allParentsError);
            continue; // Skip this event's reminders
          }
          parentEmails = allParents?.map((p: unknown) => p.email).filter((email: string | null) => !!email) || [];
        }

        const uniqueEmails = [...new Set(parentEmails)];
        if (uniqueEmails.length === 0) {
          console.log(`No recipients for event ${event.id} ("${event.title}").`);
          continue;
        }

        const emailSubject = `Reminder: Upcoming Event - ${event.title}`;
        const eventDateFormatted = new Date(event.event_date).toLocaleString();
        const emailHtmlBody = `
          <h1>Event Reminder: ${event.title}</h1>
          <p>Hello Parent,</p>
          <p>This is a reminder for our upcoming event:</p>
          <p><strong>Title:</strong> ${event.title}</p>
          <p><strong>Date:</strong> ${eventDateFormatted}</p>
          <p><strong>Description:</strong> ${event.description || 'No description provided.'}</p>
          <p>We look forward to your participation!</p>
          <p><em>This is an automated notification from the School Parent Association App.</em></p>
        `;

        for (const email of uniqueEmails) {
          const result: unknown = await sendEmail(email, emailSubject, emailHtmlBody);
          if (result instanceof Object && 'success' in result && (result as { success: boolean }).success) {
            emailsSuccessfullySent++;
          } else {
            emailSendingErrors++;
          }
        }
      }
    }

    const summary = `Cron job finished. Events checked: ${eventsFoundForReminders}. Emails sent: ${emailsSuccessfullySent}. Errors: ${emailSendingErrors}.`;
    console.log(summary);
    return NextResponse.json({ message: "Cron job executed.", summary });

  } catch (error: unknown) {
    console.error('Error in cron job send-event-reminders:', error);
    return NextResponse.json({ error: `Cron job failed: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
  }
}

/*
To configure this as a cron job (e.g., on Vercel):
1. Set the CRON_SECRET environment variable in your Vercel project settings.
2. In vercel.json, configure the cron job:
{
  "crons": [
    {
      "path": "/api/cron/send-event-reminders",
      "schedule": "0 9 * * *" // Example: Run daily at 9 AM UTC
    }
  ]
}
3. Ensure the Authorization header with "Bearer YOUR_CRON_SECRET" is sent by the cron runner if possible,
   or remove/adjust the security check if your cron provider uses a different mechanism (e.g., IP allowlisting).
   Vercel Cron jobs can be configured to send a secret.

Also ensure Supabase environment variables (URL, SERVICE_ROLE_KEY) and email service variables (RESEND_API_KEY, FROM_EMAIL)
are available to this serverless function environment.
*/
