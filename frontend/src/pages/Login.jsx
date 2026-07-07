import { supabase } from "../lib/supabase";
import { APP_URL } from "../lib/config";
import Logo from "../images/Logo.png";
import "./Login.css";

export default function Login() {
  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${APP_URL}/notes`,
      },
    });
  }

  return (
    <main className="login-page">
      <section className="login-hero" aria-labelledby="login-title">
        <img className="login-hero-image" src={Logo} alt="" aria-hidden="true" />
        <h1 id="login-title">Estud<strong>IA</strong></h1>
        <p className="eyebrow">Apuntes inteligentes</p>
        <br />
        <p className="subtitle">
          Organiza tus apuntes y crea trivias de estudio en segundos.
        </p>
        <button className="login-btn" onClick={signInWithGoogle}>
          <span className="google-mark" aria-hidden="true">
            G
          </span>
          Continuar con Google
        </button>
      </section>
    </main>
  );
}
