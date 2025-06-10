import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col grow items-center justify-center overflow-hidden gap-6">
      <h1 className="text-7xl font-bold text-center text-black">Откройте для себя идеальный домик для незабываемого отдыха с близкими.</h1>
      <Link href={'/places'} passHref>
        <Button variant={'default'} size={'lg'}>Посмотреть все домики</Button>
      </Link>
    </div>
  );
}
