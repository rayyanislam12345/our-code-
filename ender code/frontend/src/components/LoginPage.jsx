import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/LoginPage.module.css";

export default function Login() {
  const [email, setEmail] = useState("");

  const navigate = useNavigate();

  const getUser = async () => {
    const response = await fetch(
      `http://localhost:8000/api/users/?email=${email}`
    );
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const user = await response.json();
    navigate("/home", { state: { user: user } });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    getUser();
  };

  return (
    <div className={styles["login-prompt"]}>
      <h1>Code Review Platform</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Enter Email: </label>
          <input
            type="text"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (e.g., elodie@union.edu)"
            required
          />
        </div>

        <button type="submit" className={styles.login}>
          Login
        </button>
      </form>
    </div>
  );
}
