import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { resend } from '@/lib/resend';
import type { ClientInsert } from '@/types/database';

// GET - Fetch all clients
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 }
      );
    }

    return NextResponse.json({ clients: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add a new client and send welcome email
export async function POST(request: NextRequest) {
  try {
    const body: ClientInsert = await request.json();
    const { name, email, business_name } = body;

    // Validate input
    if (!name || !email || !business_name) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, business_name' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Insert client into database
    const { data: client, error: dbError } = await supabaseAdmin
      .from('clients')
      .insert([{ name, email, business_name }])
      .select()
      .single();

    if (dbError) {
      console.error('Error inserting client:', dbError);
      // Check if it's a unique constraint violation
      if (dbError.code === '23505') {
        return NextResponse.json(
          { error: 'A client with this email already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to add client' },
        { status: 500 }
      );
    }

    // Send welcome email via Resend
    let emailStatus = { sent: false, error: null as string | null };
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      console.log('📧 Attempting to send email:', { from: fromEmail, to: email });
      
      const emailResult = await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: `Welcome to Our Accounting Services, ${name}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Welcome, ${name}!</h1>
            <p>Thank you for choosing our accounting services. We're excited to work with <strong>${business_name}</strong>.</p>
            <p>Our team will be in touch shortly to get started with your onboarding process.</p>
            <p>If you have any questions, please don't hesitate to reach out.</p>
            <br>
            <p>Best regards,<br>The Accounting Team</p>
          </div>
        `,
      });
      
      // Verify email was actually sent by checking for ID
      if (emailResult && (emailResult.id || emailResult.data?.id)) {
        emailStatus.sent = true;
        const emailId = emailResult.id || emailResult.data?.id;
        console.log('✅ Welcome email sent successfully!');
        console.log('📧 Email ID:', emailId);
        console.log('📧 Full Resend response:', JSON.stringify(emailResult, null, 2));
        console.log('📧 Email details:', {
          to: email,
          from: fromEmail,
          emailId: emailId,
          fullResponse: emailResult
        });
      } else {
        // No ID returned - email might not have been sent
        emailStatus.sent = false;
        emailStatus.error = 'Email sent but no ID returned from Resend';
        console.warn('⚠️ Email sent but no ID returned:', JSON.stringify(emailResult, null, 2));
      }
    } catch (emailError: any) {
      const errorMessage = emailError?.message || JSON.stringify(emailError) || 'Unknown error';
      emailStatus.error = errorMessage;
      console.error('❌ Error sending welcome email:', {
        to: email,
        error: errorMessage,
        fullError: emailError,
        stack: emailError?.stack
      });
      // Don't fail the request if email fails, just log it
      // In production, you might want to queue this for retry
    }

    return NextResponse.json(
      { 
        message: 'Client added successfully', 
        client,
        email: {
          sent: emailStatus.sent,
          to: email,
          error: emailStatus.error
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

