"use client";
import { useRouter } from "next/navigation";


export default function Home() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-2">
      <div className="text-black">
        Chess Landing Page
      </div>
      <div className="text-black border border-2 rounded-lg p-2 mt-4 cursor-pointer">
        <button className="cursor-pointer" onClick={(e) => {
          e.preventDefault();
          router.push("/game");
        }}>
          Click here to Play
        </button>
      </div>
    </div>
  );
}
