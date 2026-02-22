export default function NotFoundPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <h1>404</h1>
      <p>Pagina nao encontrada</p>
      <a href="/">Voltar ao inicio</a>
    </div>
  );
}
