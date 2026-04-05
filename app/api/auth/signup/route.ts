import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 1. Create user in auth.users and bypass email verification
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authUser.user) {
      return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
    }

    // 2. Insert user into public.users table (role: 'customer' by default)
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        name,
        role: 'customer',
      });

    if (insertError) {
      // Note: In a production app you might want to cleanly rollback the auth user creation here
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'User created successfully', user: authUser.user },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
