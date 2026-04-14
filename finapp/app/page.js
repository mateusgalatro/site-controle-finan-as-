export default function Home() {
  return (
    <main style={{ padding: "24px" }}>
      <h1>Finapp</h1>
      <p>Projeto de controle financeiro pessoal</p>

      <ul>
        <li><a href="/register">Criar conta</a></li>
        <li><a href="/login">Login</a></li>
        <li><a href="/dashboard">Dashboard</a></li>
      </ul>
    </main>
  );
}