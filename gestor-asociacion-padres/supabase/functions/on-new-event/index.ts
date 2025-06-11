import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('on-new-event Edge Function starting up')

// --- Resend Placeholder ---
// In a real scenario, you would import the Resend SDK or use fetch for its API.
// Example: import { Resend } from 'resend';
// const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@example.com'

async function sendEmail(to: string, subject: string, htmlBody: string) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set. Skipping actual email sending.");
    console.log(`Simulating email send: TO=${to}, SUBJECT=${subject}, BODY=${htmlBody.substring(0,100)}...`);
    return { success: true, message: "Simulated email send." };
  }

  console.log(`Attempting to send email via Resend to: ${to}`);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to], // Resend API expects 'to' as an array
        subject: subject,
        html: htmlBody,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Resend API error:', data);
      throw new Error(`Resend API Error: ${data.message || response.statusText}`);
    }
    console.log('Email sent successfully via Resend:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error.message };
  }
}
// --- End Resend Placeholder ---


// This function would be triggered by a Supabase Database Webhook or a direct function call.
// For a database trigger on new 'events' row:
// The payload (request body) would typically be: { type: "INSERT", table: "events", record: NewEventData, ... }
serve(async (req) => {
  let supabaseClient: SupabaseClient;
  try {
    // Create a Supabase client with the service_role key to bypass RLS if necessary for admin tasks.
    // Ensure ANON_KEY and SUPABASE_URL are set in Edge Function environment variables.
    // For service_role, SUPABASE_SERVICE_ROLE_KEY is needed.
    // It's often better to use a dedicated, less privileged role for functions if possible.
    // For this example, using anon key, assuming RLS is set up to allow function to read necessary data.
     supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!, // Or SERVICE_ROLE_KEY for admin actions
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
  } catch (error) {
    console.error('Error creating Supabase client:', error.message);
    return new Response(JSON.stringify({ error: 'Failed to initialize Supabase client' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = await req.json();
  console.log("Received payload:", JSON.stringify(payload, null, 2));

  // Check if it's an INSERT event on the 'events' table
  if (payload.type !== 'INSERT' || payload.table !== 'events') {
    console.log('Payload is not an INSERT event on the events table. Ignoring.');
    return new Response(JSON.stringify({ message: 'Ignoring non-INSERT event or wrong table' }), {
      status: 200, // Acknowledge receipt but take no action
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const newEvent = payload.record;
  if (!newEvent || !newEvent.id || !newEvent.title || !newEvent.event_date) {
    console.error('Invalid event data in payload:', newEvent);
    return new Response(JSON.stringify({ error: 'Invalid event data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log(`Processing new event: "${newEvent.title}" (ID: ${newEvent.id})`);

    // 1. Fetch event recipients (class_ids for this event)
    const { data: recipients, error: recipientError } = await supabaseClient
      .from('event_recipients')
      .select('class_id')
      .eq('event_id', newEvent.id);

    if (recipientError) {
      console.error('Error fetching event recipients:', recipientError);
      throw new Error(`Error fetching event recipients: ${recipientError.message}`);
    }

    let parentEmails: string[] = [];
    const isTargeted = recipients && recipients.length > 0;

    if (isTargeted) {
      console.log(`Event targets specific classes: ${recipients.map(r => r.class_id).join(', ')}`);
      // Fetch parents of students in the target classes
      const classIds = recipients.map(r => r.class_id);
      const { data: parentsInClasses, error: parentsError } = await supabaseClient
        .from('students') // Assuming 'students' links parents to classes
        .select('profiles ( email )') // Assuming 'profiles' has parent email and RLS allows access
        .in('class_id', classIds)
        .not('profiles', 'is', null); // Ensure profile exists

      if (parentsError) throw new Error(`Error fetching parents for targeted classes: ${parentsError.message}`);

      // @ts-ignore Deno/Supabase type inference might be tricky here
      parentEmails = parentsInClasses?.map(s => s.profiles?.email).filter(email => !!email) || [];

    } else {
      console.log('Event targets all parents.');
      // Fetch all parent emails (those with role 'parent')
      const { data: allParents, error: allParentsError } = await supabaseClient
        .from('profiles')
        .select('email')
        .eq('role', 'parent'); // Assuming 'role' field in profiles

      if (allParentsError) throw new Error(`Error fetching all parents: ${allParentsError.message}`);
      parentEmails = allParents?.map(p => p.email).filter(email => !!email) || [];
    }

    const uniqueEmails = [...new Set(parentEmails)]; // Remove duplicates
    console.log(`Found ${uniqueEmails.length} unique parent emails to notify.`);

    if (uniqueEmails.length === 0) {
      console.log("No parent emails found to send notifications to.");
      return new Response(JSON.stringify({ message: 'No recipients found.' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Send email to each parent
    const emailSubject = `New School Event: ${newEvent.title}`;
    const eventDateFormatted = new Date(newEvent.event_date).toLocaleString(); // Format for readability
    const emailHtmlBody = `
      <h1>New Event: ${newEvent.title}</h1>
      <p>Hello Parent,</p>
      <p>We have a new event scheduled:</p>
      <p><strong>Title:</strong> ${newEvent.title}</p>
      <p><strong>Date:</strong> ${eventDateFormatted}</p>
      <p><strong>Description:</strong> ${newEvent.description || 'No description provided.'}</p>
      <p>We hope to see you there!</p>
      <p><em>This is an automated notification from the School Parent Association App.</em></p>
    `;

    let emailsSent = 0;
    let emailErrors = 0;
    for (const email of uniqueEmails) {
      console.log(`Sending notification for event "${newEvent.title}" to ${email}...`);
      const result = await sendEmail(email, emailSubject, emailHtmlBody);
      if (result.success) emailsSent++; else emailErrors++;
    }

    console.log(`Finished sending emails for event ${newEvent.id}. Sent: ${emailsSent}, Errors: ${emailErrors}`);

    return new Response(JSON.stringify({ message: `Notifications processed. Emails sent: ${emailsSent}, Errors: ${emailErrors}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in on-new-event function:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

/*
To deploy this function:
1. Ensure Supabase CLI is installed and you are logged in.
2. Navigate to your Supabase project directory in the terminal.
3. Run: supabase functions deploy on-new-event --no-verify-jwt (if using service_role key or custom auth)
   Or for anon key and Row Level Security: supabase functions deploy on-new-event

To trigger this function from a database event (e.g., new row in 'events' table):
Connect to your Supabase database and run SQL like:

CREATE OR REPLACE FUNCTION notify_on_new_event()
RETURNS TRIGGER AS $$
DECLARE
  payload TEXT;
BEGIN
  -- Construct the JSON payload manually or use row_to_json/build_object
  -- Ensure this matches what the Edge Function expects (type, table, record)
  payload = json_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', row_to_json(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END
  )::TEXT;

  -- Perform an HTTP request to the Edge Function
  -- Note: Supabase provides pg_net extension for this. Ensure it's enabled.
  -- The URL for the Edge Function needs to be correctly specified.
  -- You might need to pass headers for authentication if your function requires it.

  -- Example using pg_net (ensure pg_net is enabled in your Supabase project)
  -- SELECT net.http_post(
  --   url:='YOUR_SUPABASE_PROJECT_URL/functions/v1/on-new-event',
  --   body:=payload::JSONB,
  --   headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY_OR_ANON_KEY"}'::JSONB
  -- ) INTOสุข
  -- Alternatively, Supabase has direct database webhooks feature (beta/preview) that can call functions.
  -- Check Supabase docs for "Database Webhooks" or "Database Functions" for triggers.

  -- If using Supabase's built-in Database Webhooks:
  -- 1. Go to Database -> Webhooks in your Supabase dashboard.
  -- 2. Create a new webhook.
  -- 3. Select the 'events' table and 'INSERT' event.
  -- 4. Set HTTP Request to your Edge Function URL (e.g., https://<project_ref>.supabase.co/functions/v1/on-new-event).
  -- 5. Add necessary headers (e.g., Authorization with service_role key if function needs it).

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_event_trigger
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION notify_on_new_event();

-- Remember to set environment variables for the Edge Function in Supabase Dashboard:
-- SUPABASE_URL, SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY if needed)
-- RESEND_API_KEY, FROM_EMAIL
*/
