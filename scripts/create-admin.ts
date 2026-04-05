import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Cannot run init script.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const adminEmail = 'admin@revflow.com';
  const adminPassword = 'AdminPassword123!';

  console.log('Creating Admin Auth user...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true, // Bypass email confirmation
  });

  if (authError) {
    if (authError.message.includes('already exists') || authError.message.includes('already been registered')) {
      console.log('Admin user already exists in auth.users!');
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users.users.find(u => u.email === adminEmail);
      if (existingUser) {
        await upsertPublicUser(existingUser.id, adminEmail);
      }
    } else {
      console.error('Error creating admin auth user:', authError);
      process.exit(1);
    }
  } else {
    console.log('Successfully created admin auth user:', authData.user.id);
    await upsertPublicUser(authData.user.id, adminEmail);
  }
}

async function upsertPublicUser(id: string, email: string) {
  console.log(`Upserting public.users record for ${id}...`);
  const { error: dbError } = await supabase
    .from('users')
    .update({
      role: 'admin' // Force the admin role if they exist
    })
    .eq('email', email);

  // If update fails because they don't exist yet, insert
  const { error: insertError } = await supabase
    .from('users')
    .insert({
      id: id,
      email: email,
      name: 'RevFlow Admin',
      role: 'admin'
    });

  if (dbError && insertError) {
    console.error('Error configuring public user:', insertError);
  } else {
    console.log('Successfully configured public.users as "admin" role.');
    console.log('\n--- ADMIN CREDENTIALS ---');
    console.log(`Email:    admin@revflow.com`);
    console.log(`Password: AdminPassword123!`);
    console.log('---------------------------');
  }
}

run();
