'use client'

import { useAuth } from '@/hooks/useAuth'
import { Place } from '@/types/types';
import { supabase } from '@/utils/supabase/supabaseClient';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button'
import Link from 'next/link';
import PlaceCard from '@/components/PlaceCard';
import { X } from 'lucide-react';

export default function Places() {
  const { user, loading: authLoading } = useAuth();
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if(authLoading) return;

    if(!user) {
      router.push('/login')
    }
  }, [user, authLoading, router])


  useEffect(() => {
    const fetchPlaces = async () => {
      if(authLoading) return;
      setLoading(true);

      const { data, error } = await supabase.from('places').select('*');

      if(error) {
        toast(`Ошибка ${error.message}`);
        setPlaces([])
      } else {
        setPlaces(data as Place[]);
      }
      setLoading(false)
    }

    fetchPlaces();
  }, [user, authLoading])

  const handleDeleteClick = async (placeId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это место? Это действие необратимо.')) {
        return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('places')
        .delete()
        .eq('id', placeId)

      if (error) {
        toast.error(`Ошибка удаления места ${error.message}`)
      } else {
        toast.success('Обьект удален')
        setPlaces(prevPlaces => prevPlaces.filter(place => place.id !== placeId))
      }
    } catch (err) {
      if(err instanceof Error) {
        toast.error(`Неожиданная ошибка при удалении: ${err.message || 'неизвестная ошибка'}`);
      }
    } finally {
      setLoading(false)
    }
  }

  if(authLoading || loading) {
    return (
      <div className='flex grow justify-center items-center'>
        <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500'>
        </div>
      </div>
    )
  }

  const isAdmin = user?.role === 'admin'

  
  return (
    <div className='flex flex-col grow mt-4'>
      {isAdmin && (
        <div>
          <Link href={'/places/create'}>
            <Button variant={'default'} size={'lg'} className='fixed bottom-2 right-2 cursor-pointer'>Создать</Button>
          </Link>
        </div>
      )}

      {places.length === 0 ?(
        <div className='flex grow items-center justify-center'>
          {isAdmin ? (
            <div className='flex flex-col gap-4'>
              <p>На данный момент нет созданных мест. Нажмите - Создать новое место, чтобы добавить первое!</p>
              <Button variant={'default'} size={'lg'} onClick={() => router.push('/places/create')}>Создать новое место</Button>
            </div>
          ) : (
            <p>Извините, на данный момент нет доступных мест. Пожалуйста, зайдите позже.</p>
          )}
        </div> 
      ) : (
        <div className='flex flex-wrap gap-4 justify-center items-center mb-4'>
          {places.map((place) => (
            <div key={place.id} className='relative'>
              <PlaceCard key={place.id} place={place}/>
              {isAdmin && (
                  <Button variant={'outline'} size={'icon'} className='absolute right-2 top-2 w-6 h-6' onClick={(event) => {
                event.stopPropagation();
                void handleDeleteClick(place.id);
              }}>
                <X width={24} height={24}/>
              </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
