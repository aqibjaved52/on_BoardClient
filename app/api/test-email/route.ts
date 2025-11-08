import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';

// Test endpoint to verify Resend email is working
export async function GET() {
  try {
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    console.log('🧪 Testing email send...', { from: fromEmail, to: testEmail });
    
    const result = await resend.emails.send({
      from: fromEmail,
      to: testEmail,
      subject: 'Test Email from Client Onboarding App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Test Email</h1>
          <p>This is a test email to verify Resend is working correctly.</p>
          <p>If you received this, your email configuration is working! ✅</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      emailId: result.id,
      from: fromEmail,
      to: testEmail,
    });
  } catch (error: any) {
    console.error('❌ Test email failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to send test email',
        details: error,
      },
      { status: 500 }
    );
  }
}

// POST endpoint to test with custom email
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    console.log('🧪 Testing email send to:', email);
    
    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Test Email from Client Onboarding App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Test Email</h1>
          <p>This is a test email to verify Resend is working correctly.</p>
          <p>If you received this, your email configuration is working! ✅</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      emailId: result.id,
      from: fromEmail,
      to: email,
    });
  } catch (error: any) {
    console.error('❌ Test email failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to send test email',
        details: error?.response?.data || error,
      },
      { status: 500 }
    );
  }
}

