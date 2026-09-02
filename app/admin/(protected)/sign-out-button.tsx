'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="rounded-lg p-1.5 text-stone-400 transition hover:bg-stone-700 hover:text-white"
      title="Log ud"
    >
      <LogOut size={15} />
    </button>
  );
}