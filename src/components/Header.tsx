import { User } from "@/types/types";
import { createClient,  } from "@/utils/supabase/supabaseServerClient";
import Link from "next/link";
import ButtonProvider from "./ButtonProvider";


export default async function Header() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let initialUser: User | null = null;
    if (user) {
        const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

        if (!profileError && profileData) {
        initialUser = {
            id: user.id,
            email: user.email!,
            role: profileData.role as 'user' | 'admin',
        };
        } else {
        // Fallback на случай ошибки получения профиля
        initialUser = {
            id: user.id,
            email: user.email!,
            role: 'user',
        };
        console.error('Ошибка получения профиля на сервере:', profileError?.message);
        }
    }


  return (
    <header className="flex justify-between mx-auto px-2 py-4 border-b-1 shadow-xs w-full">
          <nav className="flex gap-4 items-center">
            <Link href={'/'} className="px-3 py-1 hover:bg-gray-300 rounded-md">
              Главная
            </Link>
            <Link href={'/places'} className="px-3 py-1 hover:bg-gray-300 rounded-md">
              Места
            </Link>
          </nav>
          <ButtonProvider initialUser={initialUser}/>
    </header>
  )
}