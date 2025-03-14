"use client";
import { useRouter } from "next/navigation";


export default function Home() {
  const router = useRouter();
  return (
    <div>
      <div>
        Chess Landing Page
      </div>
      <div>
        <button onClick={(e) => {
          e.preventDefault();
          router.push("/game");
        }}>
          Click here to Play
        </button>
      </div>
    </div>
  );
}
