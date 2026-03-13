import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../api/client";
import "./Login.css";

const REDIRECT_DELAY_MS = 1500;

export default function Login() {
  const navigate = useNavigate();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);

  const resetFeedback = () => { setError(""); setSuccess(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetFeedback();
    setLoading(true);

    try {
      if (isRegisterMode) {
        if (!username.trim()) {
          setError("Le nom d'utilisateur est requis");
          return;
        }
        await register(username, email, password);
        setSuccess("Compte créé avec succès ! Redirection...");
        setTimeout(() => navigate("/boards"), REDIRECT_DELAY_MS);
      } else {
        await login(email, password);
        navigate("/boards");
      }
    } catch (err) {
      setError(err.message ?? "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const switchToRegister = () => { setIsRegisterMode(true);  resetFeedback(); };
  const switchToLogin    = () => { setIsRegisterMode(false); resetFeedback(); };

  const submitLabel = loading
    ? "Chargement..."
    : isRegisterMode
      ? "S'inscrire"
      : "Se connecter";

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>SupTaskFlow</h1>
        <h2>{isRegisterMode ? "Créer un compte" : "Se connecter"}</h2>

        <form onSubmit={handleSubmit}>
          {isRegisterMode && (
            <div className="form-group">
              <label>Nom d'utilisateur</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Votre nom"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error   && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" disabled={loading} className="btn-primary">
            {submitLabel}
          </button>
        </form>

        <div className="switch-mode">
          {isRegisterMode ? (
            <p>
              Vous avez déjà un compte ?{" "}
              <button onClick={switchToLogin} className="link-button">
                Se connecter
              </button>
            </p>
          ) : (
            <p>
              Pas encore de compte ?{" "}
              <button onClick={switchToRegister} className="link-button">
                S'inscrire
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}