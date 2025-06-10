import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Place } from '@/types/types'
import { useRouter } from 'next/navigation';
import Image from 'next/image'

interface IPlaceCardProps {
  place: Place;
}

export default function PlaceCard({ place }: IPlaceCardProps) {
  const router = useRouter();
  return (
    <Card className='w-70 overflow-hidden cursor-pointer pt-0 gap-0' onClick={() => router.push(`/places/${place.id}`)}>
      {place.imageUrl && (
        <div className='relative w-full h-48'>
          <Image 
            src={place.imageUrl}
            alt={place.name || 'Изображение Места'}
            fill
            style={{ objectFit: "cover" }}
            className='rounded-t-md'
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'/>
        </div>
      )}

      {(!place.imageUrl || place.imageUrl === '') && (
        <div className='w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500 rounded-t-mb'>
          {place.name}
        </div>
      )}
      <CardHeader className='m-0 p-0 pl-2 mb-1 mt-2'>
        <CardTitle>{place.name}</CardTitle>
      </CardHeader>
      <CardContent className='m-0 p-0 pl-2'>
        <p className='text-wrap'>Адрес: {place.address}</p>
        <p>Вместимость: {place.capacity}</p>
      </CardContent>
    </Card>
  )
}
