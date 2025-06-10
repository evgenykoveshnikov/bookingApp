'use client'

import React from 'react'
import { Button } from './ui/button'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/utils/supabase/supabaseClient';
import Link from 'next/link';
import { Separator } from './ui/separator';
import { Session } from '@supabase/supabase-js';
import { User } from '@/types/types'

interface ButtonProviderProps {
  initialUser: User | null;
  // initialSession: Session | null;
}


export default function ButtonProvider({ initialUser }: ButtonProviderProps) {
  const { user } = useAuth(initialUser);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if(error) {
      console.error('Ошибка при выходе', error.message)
    }
  }

  

  return (
    <div>
      {user ? (
        <div className='flex gap-2 items-center px-2'>
          <p className='text-primary font-normal'>Добро Пожаловать, {user.role}</p>
          <Separator orientation='vertical' className='py-4 px-0.25'></Separator>
          <Button variant={'link'} onClick={handleSignOut} size={'lg'} className='p-0 cursor-pointer'> 
            Выйти
          </Button>
        </div>
      ) : (
        <Link href={'/login'} passHref>
          <Button variant={'default'} size={'lg'}>
            Войти
          </Button>
        </Link>
      )}
    </div>
  )
}
