"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.push("/login");
        return;
      }

      setUser(data.user);
    }

    getUser();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main style={{ padding: "24px" }}>
      <h1>Dashboard</h1>
      {user ? <p>Logado como: {user.email}</p> : <p>Carregando...</p>}
      <button onClick={handleLogout}>Sair</button>
    </main>
  );
}